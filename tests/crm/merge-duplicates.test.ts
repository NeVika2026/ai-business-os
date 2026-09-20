import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DuplicateMergeError, mergeDuplicateLeads } from '@/services/crm/merge-duplicates';
import { database, type Row } from './helpers';

const organizationId = 'our-org';
const primaryId = 'primary';
const duplicateId = 'duplicate';
const primaryUpdatedAt = '2026-09-19T08:00:00.000Z';
const duplicateUpdatedAt = '2026-09-19T08:01:00.000Z';

function lead(id: string, overrides: Row = {}): Row {
  return {
    id,
    organization_id: organizationId,
    name: id === primaryId ? 'Основной клиент' : 'Дубль клиента',
    email: null,
    phone: null,
    source: null,
    notes: null,
    project_id: null,
    status: 'new',
    assigned_to: null,
    last_contact_at: null,
    updated_at: id === primaryId ? primaryUpdatedAt : duplicateUpdatedAt,
    ...overrides,
  };
}

function fixture(overrides: {
  primary?: Row;
  duplicate?: Row;
  events?: Row[];
  tasks?: Row[];
} = {}) {
  return database({
    crm_leads: [
      lead(primaryId, overrides.primary),
      lead(duplicateId, overrides.duplicate),
    ],
    events: overrides.events ?? [],
    tasks: overrides.tasks ?? [],
  });
}

function merge(db: ReturnType<typeof database>) {
  return mergeDuplicateLeads({
    supabase: db.supabase,
    organizationId,
    userId: 'our-user',
    primaryLeadId: primaryId,
    duplicateLeadIds: [duplicateId],
  });
}

test('merge preserves useful fields, latest contact, manager and readable notes', async () => {
  const db = fixture({
    primary: {
      notes: 'Главная заметка',
      status: 'contacted',
    },
    duplicate: {
      email: 'client@example.com',
      phone: '+7 999 123-45-67',
      source: 'WhatsApp',
      project_id: 'project-1',
      assigned_to: 'manager-1',
      notes: 'Любит звонки после 18:00',
      status: 'qualified',
      last_contact_at: '2026-09-20T10:00:00.000Z',
    },
  });

  const result = await merge(db);
  assert.equal(result.merged, 1);
  assert.equal(db.rows.crm_leads.length, 1);

  const primary = db.rows.crm_leads[0];
  assert.equal(primary.id, primaryId);
  assert.equal(primary.email, 'client@example.com');
  assert.equal(primary.phone, '+7 999 123-45-67');
  assert.equal(primary.source, 'WhatsApp');
  assert.equal(primary.project_id, 'project-1');
  assert.equal(primary.assigned_to, 'manager-1');
  assert.equal(primary.status, 'qualified');
  assert.equal(primary.last_contact_at, '2026-09-20T10:00:00.000Z');
  assert.match(String(primary.notes), /Главная заметка/);
  assert.match(String(primary.notes), /Любит звонки после 18:00/);
});

test('merge moves full event identity and only exact CRM reminder markers', async () => {
  const db = fixture({
    events: [
      {
        id: 'event-1',
        organization_id: organizationId,
        type: 'crm_whatsapp_received',
        correlation_id: duplicateId,
        payload: { lead_id: duplicateId, text: 'Здравствуйте' },
        metadata: { crm_lead_id: duplicateId, provider: 'whatsapp' },
        created_at: '2026-09-19T09:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        organization_id: organizationId,
        title: 'Связаться: Дубль клиента',
        description: 'CRM_LEAD_ID:' + duplicateId + '\nCRM_FOLLOWUP_MANUAL\nПозвонить',
        status: 'todo',
        updated_at: '2026-09-19T09:01:00.000Z',
      },
      {
        id: 'task-mentioned',
        organization_id: organizationId,
        title: 'Не CRM follow-up',
        description: 'Заметка\nCRM_LEAD_ID:' + duplicateId + '\nCRM follow-up',
        status: 'todo',
        updated_at: '2026-09-19T09:02:00.000Z',
      },
    ],
  });

  await merge(db);

  assert.equal(db.rows.events[0].correlation_id, primaryId);
  assert.equal((db.rows.events[0].payload as Row).lead_id, primaryId);
  assert.equal((db.rows.events[0].metadata as Row).crm_lead_id, primaryId);

  const movedTask = db.rows.tasks.find((row) => row.id === 'task-1')!;
  assert.equal(movedTask.title, 'Связаться: Основной клиент');
  assert.match(String(movedTask.description), new RegExp('^CRM_LEAD_ID:' + primaryId + '\\n'));

  const untouched = db.rows.tasks.find((row) => row.id === 'task-mentioned')!;
  assert.match(String(untouched.description), new RegExp('CRM_LEAD_ID:' + duplicateId));
});

test('a duplicate from another organization cannot be merged or deleted', async () => {
  const db = fixture({
    duplicate: { organization_id: 'foreign-org' },
  });

  await assert.rejects(merge(db), DuplicateMergeError);
  assert.equal(db.rows.crm_leads.length, 2);
  assert.equal(db.rows.crm_leads.find((row) => row.id === duplicateId)?.organization_id, 'foreign-org');
  assert.ok(db.requests.every((request) => !['PATCH', 'DELETE'].includes(request.method)));
});

test('history transfer failure keeps the duplicate and retry does not duplicate notes', async () => {
  const db = fixture({
    primary: { notes: 'Главная заметка' },
    duplicate: { notes: 'Важная заметка из дубля' },
    events: [
      {
        id: 'event-1',
        organization_id: organizationId,
        correlation_id: duplicateId,
        payload: { lead_id: duplicateId },
        metadata: { crm_lead_id: duplicateId },
        created_at: '2026-09-19T09:00:00.000Z',
      },
    ],
  });

  db.failWhen((request) => request.table === 'events' && request.method === 'PATCH');
  await assert.rejects(merge(db));
  assert.equal(db.rows.crm_leads.length, 2);
  assert.equal(
    (String(db.rows.crm_leads.find((row) => row.id === primaryId)?.notes).match(/Важная заметка из дубля/g) ?? []).length,
    1,
  );

  db.failWhen();
  const result = await merge(db);
  assert.equal(result.merged, 1);
  assert.equal(db.rows.crm_leads.length, 1);
  assert.equal(
    (String(db.rows.crm_leads[0].notes).match(/Важная заметка из дубля/g) ?? []).length,
    1,
  );
});

test('duplicate deletion happens only after its events and reminders are transferred', async () => {
  const db = fixture({
    events: [
      {
        id: 'event-1',
        organization_id: organizationId,
        correlation_id: duplicateId,
        payload: { lead_id: duplicateId },
        metadata: { crm_lead_id: duplicateId },
        created_at: '2026-09-19T09:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        organization_id: organizationId,
        description: 'CRM_LEAD_ID:' + duplicateId + '\nCRM follow-up',
        status: 'todo',
        updated_at: '2026-09-19T09:01:00.000Z',
      },
    ],
  });

  await merge(db);

  const deleteIndex = db.requests.findIndex(
    (request) => request.table === 'crm_leads' && request.method === 'DELETE',
  );
  const eventMoveIndex = db.requests.findIndex(
    (request) => request.table === 'events' && request.method === 'PATCH',
  );
  const taskMoveIndex = db.requests.findIndex(
    (request) => request.table === 'tasks' && request.method === 'PATCH',
  );

  assert.ok(eventMoveIndex >= 0);
  assert.ok(taskMoveIndex >= 0);
  assert.ok(deleteIndex > eventMoveIndex);
  assert.ok(deleteIndex > taskMoveIndex);
});
