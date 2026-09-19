import { NextRequest, NextResponse } from 'next/server';

import { recordInboundCommunication } from '@/lib/crm/inbound-communications';

export const runtime = 'nodejs';

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function authorized(request: NextRequest) {
  const expected = process.env.HTTPSMS_WEBHOOK_SECRET?.trim();
  if (!expected) return true;

  const provided =
    request.nextUrl.searchParams.get('secret')?.trim() ||
    request.headers.get('x-business-zavod-secret')?.trim();

  return provided === expected;
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const organizationId = process.env.HTTPSMS_WEBHOOK_ORGANIZATION_ID?.trim();

  if (!organizationId) {
    return NextResponse.json(
      { ok: false, error: 'organization_not_configured' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = objectValue(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const eventType =
    stringValue(body.type) ||
    stringValue(body.event_type) ||
    stringValue(body.event);

  if (
    eventType &&
    eventType !== 'message.phone.received' &&
    eventType !== 'message.received'
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = objectValue(body.data);
  const payload = Object.keys(data).length ? data : objectValue(body.payload);
  const source = Object.keys(payload).length ? payload : body;

  if (source.encrypted === true) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'encrypted' });
  }

  const from =
    stringValue(source.contact) ||
    stringValue(source.from) ||
    stringValue(source.phone);

  const text =
    stringValue(source.content) ||
    stringValue(source.text) ||
    stringValue(source.message);

  if (!from || !text) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'no_text' });
  }

  const providerMessageId =
    stringValue(source.message_id) ||
    stringValue(source.id) ||
    stringValue(body.id) ||
    null;

  const providerTimestamp =
    stringValue(source.timestamp) ||
    stringValue(source.created_at) ||
    stringValue(body.time) ||
    null;

  const result = await recordInboundCommunication({
    organizationId,
    channel: 'sms',
    from,
    text,
    providerMessageId,
    providerTimestamp,
    raw: body,
  });

  return NextResponse.json({ ok: true, ...result });
}
