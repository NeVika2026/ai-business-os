import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MANUAL_FOLLOW_UP_MARKER,
  followUpNote,
  followUpPreset,
  toLocalDateTime,
} from '@/lib/crm/follow-ups';
import { recordInboundCommunication } from '@/lib/crm/webhook-inbox';
import {
  completeAutomaticCrmFollowUps,
  resolveCrmFollowUp,
  scheduleCrmFollowUp,
} from '@/services/crm/follow-ups';
import { database, type Row } from './helpers';

const organizationId = 'our-org';
const leadId = 'our-lead';
const now = new Date('2026-09-19T09:00:00.000Z');
const oldDue = '2026-09-19T08:00:00.000Z';
const nextDue = '2026-09-21T13:30:00.000Z';

function task(overrides: Row = {}): Row {
  return {
    id: 'our-task',
    organization_id: organizationId,
    description: 'CRM_LEAD_ID:' + leadId + '\nCRM follow-up',
    due_at: oldDue,
    status: 'todo',
    updated_at: '2026-09-18T09:00:00.000Z',
    ...overrides,
  };
}

function fixture(tasks: Row[] = []) {
  return database({
    crm_leads: [
      {
        id: leadId,
        organization_id: organizationId,
        project_id: 'project',
        name: 'Клиент',
        status: 'qualified',
        phone: '+79991234567',
      },
    ],
    tasks,
  });
}

function actor(db: ReturnType<typeof database>) {
  return { supabase: db.supabase, organizationId, leadId, userId: 'our-user' };
}

function schedule(
  db: ReturnType<typeof database>,
  options: Partial<Parameters<typeof scheduleCrmFollowUp>[0]> = {},
) {
  return scheduleCrmFollowUp({ ...actor(db), now, dueAt: nextDue, ...options });
}

function resolve(db: ReturnType<typeof database>, outcome: 'done' | 'cancelled' = 'done') {
  return resolveCrmFollowUp({ ...actor(db), taskId: 'our-task', expectedDueAt: oldDue, outcome });
}

test('custom time zone, note and history persist without changing the deal stage', async () => {
  const db = fixture();
  const result = await schedule(db, {
    dueAt: '2026-09-21T18:30:00+05:00',
    note: '  Позвонить после встречи  ',
  });
  assert.equal(result.dueAt, nextDue);
  assert.equal(db.rows.tasks.length, 1);
  assert.equal(db.rows.tasks[0].due_at, nextDue);
  assert.equal(db.rows.tasks[0].created_by, 'our-user');
  assert.equal(db.rows.tasks[0].project_id, 'project');
  assert.match(String(db.rows.tasks[0].description), /CRM_FOLLOWUP_MANUAL/);
  assert.equal(followUpNote(String(db.rows.tasks[0].description)), 'Позвонить после встречи');
  assert.equal(db.rows.events[0].type, 'crm_followup_scheduled');
  assert.equal((db.rows.events[0].payload as Row).task_id, result.taskId);
  assert.equal(db.rows.crm_leads[0].status, 'qualified');
  assert.ok(
    db.requests
      .filter((request) => request.method !== 'POST')
      .every((request) => request.params.get('organization_id') === 'eq.' + organizationId),
  );
});

test('rescheduling updates the selected reminder and preserves an omitted note', async () => {
  const db = fixture([
    task({
      description: 'CRM_LEAD_ID:' + leadId + '\n' + MANUAL_FOLLOW_UP_MARKER + '\nОбсудить договор',
    }),
  ]);
  await schedule(db, { taskId: 'our-task', expectedDueAt: oldDue });
  assert.equal(db.rows.tasks.length, 1);
  assert.equal(db.rows.tasks[0].due_at, nextDue);
  assert.equal(followUpNote(String(db.rows.tasks[0].description)), 'Обсудить договор');
  assert.equal(db.rows.events[0].type, 'crm_followup_rescheduled');
  assert.equal((db.rows.events[0].payload as Row).previous_due_at, oldDue);
});

test('multiple existing reminders do not cause another duplicate to be inserted', async () => {
  const db = fixture([task(), task({ id: 'later', due_at: '2026-09-20T11:00:00.000Z' })]);
  await schedule(db);
  assert.equal(db.rows.tasks.length, 2);
  assert.equal(db.rows.tasks.find((row) => row.id === 'our-task')?.due_at, nextDue);
  assert.equal(db.rows.tasks.find((row) => row.id === 'later')?.due_at, '2026-09-20T11:00:00.000Z');
});

test('invalid, past, ambiguous dates and oversized notes are rejected before database writes', async () => {
  const db = fixture();
  for (const dueAt of ['invalidZ', oldDue, now.toISOString(), '2026-09-21T18:30']) {
    await assert.rejects(schedule(db, { dueAt }));
  }
  await assert.rejects(schedule(db, { note: 'x'.repeat(2001) }), /2000/);
  assert.equal(db.requests.length, 0);
});

test('completion closes only the selected reminder and repeated completion is idempotent', async () => {
  const db = fixture([task(), task({ id: 'another' })]);
  await resolve(db);
  await resolve(db);
  assert.equal(db.rows.tasks[0].status, 'done');
  assert.equal(db.rows.tasks[1].status, 'todo');
  assert.equal(db.rows.events.length, 1);
  assert.equal(db.rows.events[0].type, 'crm_followup_completed');
});

test('cancellation is recorded once and does not mark the contact completed', async () => {
  const db = fixture([task()]);
  await resolve(db, 'cancelled');
  await resolve(db, 'cancelled');
  assert.equal(db.rows.tasks[0].status, 'cancelled');
  assert.equal(db.rows.events.length, 1);
  assert.equal(db.rows.events[0].type, 'crm_followup_cancelled');
  await assert.rejects(resolve(db), /уже закрыто/);
});

test('reminders belonging to other organizations or clients cannot be edited or closed', async () => {
  for (const overrides of [
    { organization_id: 'foreign' },
    { description: 'CRM_LEAD_ID:other\nCRM follow-up' },
  ]) {
    const db = fixture([task(overrides)]);
    await assert.rejects(resolve(db), /не найдено/);
    await assert.rejects(schedule(db, { taskId: 'our-task', expectedDueAt: oldDue }), /не найдено/);
    assert.equal(db.rows.tasks[0].status, 'todo');
    assert.equal(db.rows.tasks[0].due_at, oldDue);
    assert.equal(db.rows.events.length, 0);
  }
});

test('an outdated screen cannot close or move an already rescheduled reminder', async () => {
  const db = fixture([task({ due_at: nextDue })]);
  await assert.rejects(resolve(db), /уже перенесено/);
  await assert.rejects(
    schedule(db, { taskId: 'our-task', expectedDueAt: oldDue }),
    /уже перенесено/,
  );
  assert.equal(db.rows.tasks[0].due_at, nextDue);
  assert.equal(db.rows.tasks[0].status, 'todo');
  assert.equal(db.rows.events.length, 0);
});

test('concurrent changes between reading and writing are preserved', async () => {
  for (const operation of ['schedule', 'resolve']) {
    const db = fixture([task()]);
    db.beforeRequest((request) => {
      if (request.table === 'tasks' && request.method === 'PATCH') {
        db.rows.tasks[0].due_at = '2026-09-25T12:00:00.000Z';
        db.rows.tasks[0].updated_at = '2026-09-19T10:00:00.000Z';
      }
    });
    await assert.rejects(operation === 'schedule' ? schedule(db) : resolve(db), /уже изменилось/);
    assert.equal(db.rows.tasks[0].due_at, '2026-09-25T12:00:00.000Z');
    assert.equal(db.rows.tasks[0].status, 'todo');
    assert.equal(db.rows.events.length, 0);
  }
});

test('a failed reminder lookup cannot create a duplicate', async () => {
  const db = fixture([task()]);
  db.failWhen((request) => request.table === 'tasks' && request.method === 'GET');
  await assert.rejects(schedule(db));
  assert.equal(db.rows.tasks.length, 1);
  assert.equal(db.rows.events.length, 0);
});

test('an audit failure reports the saved task accurately and retry does not duplicate it', async () => {
  const db = fixture();
  db.failWhen((request) => request.table === 'events' && request.method === 'POST');
  const result = await schedule(db);
  assert.equal(result.historySaved, false);
  assert.match(result.message, /сохранено/);
  assert.equal(db.rows.tasks[0].due_at, nextDue);
  db.failWhen();
  await schedule(db);
  assert.equal(db.rows.tasks.length, 1);
});

test('automatic completion only affects due legacy tasks and keeps explicit future contacts', async () => {
  const db = fixture([
    task(),
    task({ id: 'manual', description: 'CRM_LEAD_ID:' + leadId + '\n' + MANUAL_FOLLOW_UP_MARKER }),
    task({ id: 'future', due_at: nextDue }),
    task({ id: 'foreign', organization_id: 'other-org' }),
    task({ id: 'other-client', description: 'CRM_LEAD_ID:other\nCRM follow-up' }),
    task({ id: 'mentioned', description: 'Заметка\nCRM_LEAD_ID:' + leadId + '\nCRM follow-up' }),
    task({ id: 'lookalike', description: 'CRM-LEAD-ID:' + leadId + '\nCRM follow-up' }),
    task({ id: 'no-date', due_at: null }),
  ]);
  const result = await completeAutomaticCrmFollowUps({ ...actor(db), now });
  assert.equal(result.error, null);
  assert.equal(db.rows.tasks[0].status, 'done');
  assert.ok(db.rows.tasks.slice(1).every((row) => row.status === 'todo'));
});

test('receiving a real CRM message preserves the manually planned contact', async () => {
  const db = fixture([
    task({ description: 'CRM_LEAD_ID:' + leadId + '\n' + MANUAL_FOLLOW_UP_MARKER }),
  ]);
  const result = await recordInboundCommunication(
    {
      organizationId,
      channel: 'whatsapp',
      phone: '+79991234567',
      text: 'Спасибо!',
      provider: 'Evolution Go',
      providerEventId: 'incoming-1',
    },
    db.supabase,
  );
  assert.equal(result.matched, true);
  assert.equal(db.rows.tasks[0].status, 'todo');
  assert.equal(db.rows.events[0].type, 'crm_whatsapp_received');
  assert.equal(db.rows.crm_leads[0].status, 'qualified');
});

test('quick dates follow the device calendar and daylight-saving changes', () => {
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Yekaterinburg';
    const atNight = new Date('2026-09-19T22:00:00.000Z');
    assert.equal(followUpPreset(1, atNight), '2026-09-21T06:00:00.000Z');
    assert.equal(toLocalDateTime(nextDue), '2026-09-21T18:30');
    assert.equal(new Date(toLocalDateTime(nextDue)).toISOString(), nextDue);
    process.env.TZ = 'America/New_York';
    assert.equal(
      followUpPreset(1, new Date('2026-03-07T18:00:00.000Z')),
      '2026-03-08T15:00:00.000Z',
    );
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});
