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

function extractText(message: Record<string, unknown>) {
  const conversation = stringValue(message.conversation);
  if (conversation) return conversation;

  const extended = objectValue(message.extendedTextMessage);
  const extendedText = stringValue(extended.text);
  if (extendedText) return extendedText;

  const image = objectValue(message.imageMessage);
  const imageCaption = stringValue(image.caption);
  if (imageCaption) return imageCaption;

  const video = objectValue(message.videoMessage);
  const videoCaption = stringValue(video.caption);
  if (videoCaption) return videoCaption;

  const document = objectValue(message.documentMessage);
  return stringValue(document.caption);
}

function authorized(request: NextRequest) {
  const expected = process.env.EVOLUTION_GO_WEBHOOK_SECRET?.trim();
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

  const organizationId =
    process.env.EVOLUTION_GO_WEBHOOK_ORGANIZATION_ID?.trim();

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

  const event = stringValue(body.event).toLowerCase();
  const acceptedEvents = new Set([
    'message',
    'messages.upsert',
    'message.upsert',
  ]);

  if (!acceptedEvents.has(event)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = objectValue(body.data);
  const key = objectValue(data.key);
  const message = objectValue(data.message);

  if (key.fromMe === true) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'from_me' });
  }

  const remoteJid =
    stringValue(key.remoteJid) ||
    stringValue(data.remoteJid) ||
    stringValue(body.remoteJid);

  if (!remoteJid || remoteJid.includes('@g.us')) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'not_direct_chat' });
  }

  const from = remoteJid.split('@')[0] ?? '';
  const text =
    extractText(message) ||
    stringValue(data.text) ||
    stringValue(body.text);

  if (!from || !text) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'no_text' });
  }

  const providerMessageId =
    stringValue(key.id) ||
    stringValue(data.id) ||
    stringValue(body.id) ||
    null;

  const providerTimestamp =
    stringValue(data.messageTimestamp) ||
    stringValue(body.messageTimestamp) ||
    null;

  const result = await recordInboundCommunication({
    organizationId,
    channel: 'whatsapp',
    from,
    text,
    providerMessageId,
    providerTimestamp,
    raw: body,
  });

  return NextResponse.json({ ok: true, ...result });
}
