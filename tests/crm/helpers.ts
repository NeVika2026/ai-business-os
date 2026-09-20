import { createClient } from '@supabase/supabase-js';

export type Row = Record<string, unknown>;
type RequestLog = { table: string; method: string; params: URLSearchParams };

// Exercise the real Supabase client and PostgREST requests without a live CRM.
export function database(seed: { events?: Row[]; crm_leads?: Row[]; tasks?: Row[] }) {
  const rows: Record<string, Row[]> = {
    events: structuredClone(seed.events ?? []),
    crm_leads: structuredClone(seed.crm_leads ?? []),
    tasks: structuredClone(seed.tasks ?? []),
  };
  const requests: RequestLog[] = [];
  let failure: ((request: RequestLog) => boolean) | undefined;
  let nextId = 0;
  let revision = 0;
  let before: ((request: RequestLog) => void) | undefined;
  const nextRevision = () => new Date(Date.UTC(2026, 8, 19, 12) + ++revision).toISOString();

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
    if (expression.startsWith('lte.')) return value != null && String(value) <= expression.slice(4);
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
    const like = expression.match(/^(not\.)?(i?like)\.([\s\S]*)$/);
    if (like) {
      let pattern = '';
      let escaped = false;
      for (const character of like[3]) {
        if (!escaped && character === '\\') {
          escaped = true;
          continue;
        }
        pattern +=
          !escaped && character === '%'
            ? '[\\s\\S]*'
            : !escaped && character === '_'
              ? '[\\s\\S]'
              : character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        escaped = false;
      }
      const result =
        value != null &&
        new RegExp('^' + pattern + '$', like[2] === 'ilike' ? 'i' : '').test(String(value));
      return like[1] ? value != null && !result : result;
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
        before?.(request);
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
            updated_at: nextRevision(),
            ...row,
          }));
          rows[table].push(...result);
        } else if (method === 'PATCH') {
          for (const row of matching)
            Object.assign(row, JSON.parse(String(init?.body)), { updated_at: nextRevision() });
          result = matching;
        } else if (method === 'DELETE') {
          result = [...matching];
          rows[table] = rows[table].filter((row) => !matching.includes(row));
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
    beforeRequest: (callback?: typeof before) => {
      before = callback;
    },
    failWhen: (predicate?: typeof failure) => {
      failure = predicate;
    },
  };
}
