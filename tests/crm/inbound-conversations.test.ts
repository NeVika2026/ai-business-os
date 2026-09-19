import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

import { groupUnmatchedInbound } from '@/lib/crm/inbox-conversations';
import { recordInboundCommunication } from '@/lib/crm/webhook-inbox';
import { claimInboundConversation, loadInboundClaims } from '@/services/crm/claim-inbound';

type Row = Record<string, unknown>;
type RequestLog = { table: string; method: string; params: URLSearchParams };
const org = 'our-org';
const phone = '+7 (999) 123-45-67';

// Exercise the real Supabase client and PostgREST requests without a live CRM.
function database(seed: { events?: Row[]; crm_leads?: Row[] }) {
  const rows: Record<string, Row[]> = {
    events: structuredClone(seed.events ?? []),
    crm_leads: structuredClone(seed.crm_leads ?? []),
  };
  const requests: RequestLog[] = [];
  let failure: ((request: RequestLog) => boolean) | undefined;
  let nextId = 0;

  function field(row: Row, key: string): unknown {
    return key
      .split('->>')
      .reduce<unknown>(
        (value, part) => (value && typeof value === 'object' ? (value as Row)[part] : undefined),
        row,
      );
  }

  function matches(value: unknown, expression: string): boolean {
    if (expression === 'is.null') return value == null;
    if (expression === 'not.is.null') return value != null;
    if (expression.startsWith('eq.')) return String(value) === expression.slice(3);
    if (expression.startsWith('lt.')) return value != null && String(value) < expression.slice(3);
    if (expression.startsWith('in.')) {
      return expression
        .slice(4, -1)
        .split(',')
        .map((item) => item.replaceAll('"', ''))
        .includes(String(value));
    }
    if (expression.startsWith('cs.')) {
      const expected = JSON.parse(expression.slice(3)) as Row;
      return Object.entries(expected).every(
        ([key, item]) => field((value ?? {}) as Row, key) === item,
      );
    }
    throw new Error('Unsupported test filter: ' + expression);
  }

  const supabase = createClient('https://crm.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        );
        const table = url.pathname.split('/').at(-1)!;
        const method = init?.method ?? 'GET';
        const request = { table, method, params: url.searchParams };
        requests.push(request);
        if (failure?.(request)) {
          return Response.json(
            { message: 'Database unavailable', code: 'TEST_ERROR' },
            { status: 400 },
          );
        }

        const matching = rows[table].filter((row) =>
          [...url.searchParams].every(([key, value]) => {
            if (['select', 'order', 'offset', 'limit', 'columns'].includes(key)) return true;
            if (key === 'or') {
              return value
                .slice(1, -1)
                .split(',')
                .some((condition) => {
                  const separator = condition.indexOf('.');
                  return matches(
                    field(row, condition.slice(0, separator)),
                    condition.slice(separator + 1),
                  );
                });
            }
            return matches(field(row, key), value);
          }),
        );
        let result: Row[];
        if (method === 'POST') {
          const body = JSON.parse(String(init?.body)) as Row | Row[];
          result = (Array.isArray(body) ? body : [body]).map((row) => ({
            id: table + '-' + ++nextId,
            ...row,
          }));
          rows[table].push(...result);
        } else if (method === 'PATCH') {
          for (const row of matching) Object.assign(row, JSON.parse(String(init?.body)));
          result = matching;
        } else {
          const order = url.searchParams.get('order');
          if (order)
            matching.sort((a, b) => {
              for (const clause of order.split(',')) {
                const [key, direction] = clause.split('.');
                const comparison = String(field(a, key)).localeCompare(String(field(b, key)));
                if (comparison) return direction === 'desc' ? -comparison : comparison;
              }
              return 0;
            });
          const offset = Number(url.searchParams.get('offset') ?? 0);
          const limit = Number(url.searchParams.get('limit') ?? 1000);
          result = matching.slice(offset, offset + limit);
        }

        const accept = new Headers(init?.headers).get('accept') ?? '';
        if (accept.includes('vnd.pgrst.object')) {
          if (result.length !== 1)
            return Response.json(
              { code: 'PGRST116', message: 'Expected one row' },
              { status: 406 },
            );
          return Response.json(result[0]);
        }
        return Response.json(result);
      },
    },
  });

  return {
    rows,
    requests,
    supabase,
    failWhen: (predicate?: typeof failure) => {
      failure = predicate;
    },
  };
}

function incoming(id: string, overrides: Row = {}): Row {
  return {
    id,
    organization_id: org,
    type: 'crm_whatsapp_received_unmatched',
    source: 'Evolution Go',
    payload: { phone, text: 'Сообщение ' + id, sender_name: 'Клиент' },
    metadata: { phone_key: '9991234567', provider: 'Evolution Go', provider_event_id: id },
    correlation_id: null,
    created_at: '2026-09-19T09:00:00.000Z',
    ...overrides,
  };
}

function lead(overrides: Row = {}): Row {
  return {
    id: 'existing-lead',
    organization_id: org,
    phone: '89991234567',
    status: 'new',
    last_contact_at: null,
    notes: 'Заметки менеджера',
    ...overrides,
  };
}

function claim(db: ReturnType<typeof database>, eventId = 'first') {
  return claimInboundConversation({
    supabase: db.supabase,
    organizationId: org,
    userId: 'our-user',
    eventId,
  });
}

function linked(db: ReturnType<typeof database>) {
  return db.rows.events.filter((event) => (event.metadata as Row)?.original_event_id);
}

test('one claim preserves the whole conversation, both channels and original times', async () => {
  const first = incoming('first');
  const second = incoming('second', {
    type: 'crm_sms_received_unmatched',
    source: 'httpSMS',
    payload: { phone: '8 999 123 45 67', text: 'Уточнение', sender_name: null },
    created_at: '2026-09-19T10:00:00.000Z',
  });
  const db = database({
    events: [second, incoming('foreign', { organization_id: 'other-org' }), first],
  });
  const result = await claim(db);

  assert.equal(result.created, true);
  assert.equal(result.linkedCount, 2);
  assert.equal(db.rows.crm_leads.length, 1);
  assert.equal(db.rows.crm_leads[0].last_contact_at, second.created_at);
  assert.equal(db.rows.crm_leads[0].notes, 'Первое входящее сообщение:\nСообщение first');
  assert.deepEqual(
    linked(db).map((event) => [event.type, event.created_at]),
    [
      ['crm_whatsapp_received', first.created_at],
      ['crm_sms_received', second.created_at],
    ],
  );
  assert.ok(
    linked(db).every(
      (event) => event.correlation_id === result.leadId && event.organization_id === org,
    ),
  );
  assert.ok(
    db.requests
      .filter((request) => request.method !== 'POST')
      .every((request) => request.params.get('organization_id') === 'eq.' + org),
  );
});

test('existing deal stage, later contact and manager notes are preserved', async () => {
  const original = lead({ status: 'won', last_contact_at: '2026-09-20T11:00:00.000Z' });
  const db = database({ events: [incoming('first')], crm_leads: [original] });
  assert.equal((await claim(db)).created, false);
  assert.deepEqual(db.rows.crm_leads[0], original);
});

test('new leads advance to contacted and the latest incoming contact is recorded', async () => {
  const db = database({ events: [incoming('first')], crm_leads: [lead()] });
  await claim(db);
  assert.equal(db.rows.crm_leads[0].status, 'contacted');
  assert.equal(db.rows.crm_leads[0].last_contact_at, '2026-09-19T09:00:00.000Z');
});

test('legacy claims reuse their card and repeated claims do not duplicate history', async () => {
  const original = incoming('first');
  const db = database({
    events: [
      original,
      incoming('second'),
      incoming('legacy-copy', {
        type: 'crm_whatsapp_received',
        correlation_id: 'existing-lead',
        metadata: { ...(original.metadata as Row), original_event_id: 'first' },
      }),
    ],
    crm_leads: [lead({ status: 'qualified' })],
  });
  assert.equal((await claim(db)).linkedCount, 1);
  assert.equal((await claim(db, 'second')).linkedCount, 0);
  assert.equal(linked(db).length, 2);
  assert.equal(db.rows.crm_leads.length, 1);
  assert.equal(db.rows.crm_leads[0].status, 'qualified');
});

test('foreign or unrelated events cannot create cards', async () => {
  const db = database({
    events: [
      incoming('foreign', { organization_id: 'other-org' }),
      incoming('unrelated', { type: 'other_event' }),
    ],
  });
  await assert.rejects(claim(db, 'foreign'), /не найдено/);
  await assert.rejects(claim(db, 'unrelated'), /не относится к CRM/);
  assert.equal(db.rows.crm_leads.length, 0);
  assert.equal(db.requests.filter((request) => request.method !== 'GET').length, 0);
});

test('a failed lead lookup does not create a duplicate', async () => {
  const db = database({ events: [incoming('first')], crm_leads: [lead()] });
  db.failWhen((request) => request.table === 'crm_leads' && request.method === 'GET');
  await assert.rejects(
    claim(db),
    (error: unknown) => (error as Row).message === 'Database unavailable',
  );
  assert.equal(linked(db).length, 0);
  assert.equal(db.rows.crm_leads.length, 1);
});

test('retry after a failed history save reuses the created card', async () => {
  const db = database({ events: [incoming('first'), incoming('second')] });
  db.failWhen((request) => request.table === 'events' && request.method === 'POST');
  await assert.rejects(claim(db));
  assert.equal(db.rows.crm_leads.length, 1);
  assert.equal(linked(db).length, 0);
  db.failWhen();
  assert.equal((await claim(db)).linkedCount, 2);
  assert.equal(db.rows.crm_leads.length, 1);
});

test('retry after a failed card update completes it without duplicating saved messages', async () => {
  const db = database({ events: [incoming('first')], crm_leads: [lead()] });
  db.failWhen((request) => request.table === 'crm_leads' && request.method === 'PATCH');
  await assert.rejects(claim(db));
  assert.equal(linked(db).length, 1);
  db.failWhen();
  await claim(db);
  assert.equal(linked(db).length, 1);
  assert.equal(db.rows.crm_leads[0].status, 'contacted');
});

test('long conversations and large CRMs are read beyond the first page', async () => {
  const db = database({
    events: Array.from({ length: 505 }, (_, index) => incoming('event-' + index)),
    crm_leads: [
      ...Array.from({ length: 502 }, (_, index) =>
        lead({ id: 'a-' + index, phone: '8800000' + index }),
      ),
      lead({ id: 'z-customer' }),
    ],
  });
  const result = await claim(db, 'event-0');
  assert.equal(result.leadId, 'z-customer');
  assert.equal(result.linkedCount, 505);
  assert.equal(db.rows.crm_leads.length, 503);
  assert.equal((await claim(db, 'event-504')).linkedCount, 0);
});

test('provider replay after a claim does not create another incoming event', async () => {
  const db = database({ events: [incoming('first')] });
  await claim(db);
  const eventCount = db.rows.events.length;
  const result = await recordInboundCommunication(
    {
      organizationId: org,
      channel: 'whatsapp',
      phone,
      text: 'Повтор доставки',
      provider: 'Evolution Go',
      providerEventId: 'first',
    },
    db.supabase,
  );
  assert.equal(result.duplicate, true);
  assert.equal(db.rows.events.length, eventCount);
});

test('claims lookup is independent of the visible inbox event window', async () => {
  const db = database({
    events: [
      incoming('copy', {
        correlation_id: 'existing-lead',
        metadata: { original_event_id: 'old-message' },
      }),
    ],
  });
  assert.deepEqual(await loadInboundClaims(db.supabase, org, ['old-message']), [
    { originalId: 'old-message', leadId: 'existing-lead' },
  ]);
});

test('mismatched phone metadata never attaches another contact history', async () => {
  const db = database({
    events: [
      incoming('first'),
      incoming('wrong-phone', { payload: { phone: '+7 999 000-00-00', text: 'Чужое сообщение' } }),
    ],
  });
  assert.equal((await claim(db)).linkedCount, 1);
});

test('inbox groups formatted phone aliases across channels and keeps the latest preview', () => {
  const messages = [
    {
      eventId: 'first',
      channel: 'whatsapp' as const,
      phone,
      senderName: 'Анна',
      text: 'Здравствуйте',
      at: '2026-09-19T09:00:00.000Z',
    },
    {
      eventId: 'second',
      channel: 'sms' as const,
      phone: '89991234567',
      senderName: null,
      text: 'Уточню вопрос',
      at: '2026-09-19T10:00:00.000Z',
    },
  ];
  const result = groupUnmatchedInbound(messages);
  assert.equal(result.length, 1);
  assert.equal(result[0].messageCount, 2);
  assert.equal(result[0].eventId, 'second');
  assert.equal(result[0].text, 'Уточню вопрос');
  assert.equal(result[0].senderName, 'Анна');
  assert.deepEqual(result[0].channels, ['sms', 'whatsapp']);
  assert.equal(messages[0].eventId, 'first');
});

test('missing phone numbers stay separate in the inbox', () => {
  const messages = ['a', 'b'].map((eventId) => ({
    eventId,
    channel: 'sms' as const,
    phone: '',
    senderName: null,
    text: '',
    at: '2026-09-19T09:00:00.000Z',
  }));
  assert.equal(groupUnmatchedInbound(messages).length, 2);
});
