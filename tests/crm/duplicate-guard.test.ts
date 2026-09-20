import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  findCrmDuplicateCandidates,
  normalizeContactEmail,
} from '@/services/crm/duplicate-guard';
import { database, type Row } from './helpers';

const org = 'our-org';

function lead(id: string, overrides: Row = {}): Row {
  return {
    id,
    organization_id: org,
    name: 'Клиент ' + id,
    email: null,
    phone: null,
    status: 'new',
    ...overrides,
  };
}

test('duplicate guard normalizes email case and phone formatting', async () => {
  const db = database({
    crm_leads: [
      lead('same', {
        email: ' Client@Example.COM ',
        phone: '8 (999) 123-45-67',
      }),
    ],
  });

  const result = await findCrmDuplicateCandidates({
    supabase: db.supabase,
    organizationId: org,
    email: 'client@example.com',
    phone: '+7 999 123 45 67',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'same');
  assert.deepEqual(result[0].reasons, ['email', 'phone']);
  assert.equal(normalizeContactEmail(' A@B.RU '), 'a@b.ru');
});

test('editing a card can exclude itself while still finding another duplicate', async () => {
  const db = database({
    crm_leads: [
      lead('self', { phone: '+79991234567' }),
      lead('other', { phone: '89991234567' }),
    ],
  });

  const result = await findCrmDuplicateCandidates({
    supabase: db.supabase,
    organizationId: org,
    phone: '+7 999 123-45-67',
    excludeLeadId: 'self',
  });

  assert.deepEqual(result.map((item) => item.id), ['other']);
});

test('duplicate guard never crosses organization boundaries', async () => {
  const db = database({
    crm_leads: [
      lead('ours', { phone: '+79991234567' }),
      lead('foreign', { organization_id: 'other-org', phone: '+79991234567' }),
    ],
  });

  const result = await findCrmDuplicateCandidates({
    supabase: db.supabase,
    organizationId: org,
    phone: '+79991234567',
  });

  assert.deepEqual(result.map((item) => item.id), ['ours']);
  assert.ok(
    db.requests.every((request) => request.params.get('organization_id') === 'eq.' + org),
  );
});

test('duplicate guard reads beyond the first CRM page', async () => {
  const db = database({
    crm_leads: [
      ...Array.from({ length: 505 }, (_, index) =>
        lead('a-' + String(index).padStart(3, '0'), { phone: '+7800' + String(index).padStart(7, '0') }),
      ),
      lead('z-target', { phone: '+79991234567' }),
    ],
  });

  const result = await findCrmDuplicateCandidates({
    supabase: db.supabase,
    organizationId: org,
    phone: '8 999 123 45 67',
  });

  assert.deepEqual(result.map((item) => item.id), ['z-target']);
  assert.ok(db.requests.filter((request) => request.table === 'crm_leads').length >= 2);
});

test('empty contact identity performs no CRM scan', async () => {
  const db = database({ crm_leads: [lead('one')] });
  const result = await findCrmDuplicateCandidates({
    supabase: db.supabase,
    organizationId: org,
    email: ' ',
    phone: '',
  });
  assert.deepEqual(result, []);
  assert.equal(db.requests.length, 0);
});
