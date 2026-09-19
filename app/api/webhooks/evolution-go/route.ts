import { NextRequest, NextResponse } from 'next/server';

import { recordInboundCommunication } from '@/lib/crm/webhook-inbox';

type EvolutionMessageData = {
  key?: {
    id?: string;
    remoteJid?: string;
    fromMe?: boolean;
  };
  pushName?: string;
  messageTimestamp?: string | number;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
    videoMessage?: { caption?: string };
    documentMessage?: { caption?: string; fileName?: string };
  };
};

function authorized(request: NextRequest) {
  const expected =
    process.env.EVOLUTION_GO_WEBHOOK_SECRET?.trim() ||
    process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim();

  if (!expected) return false;

  const querySecret = request.nextUrl.searchParams.get('secret')?.trim();
  const headerSecret =
    request.headers.get('x-business-zavod-webhook-secret')?.trim() ||
    request.headers.get('x-webhook-secret')?.trim();

  return querySecret === expected || headerSecret === expected;
}

function getMessageText(data: EvolutionMessageData) {
  return (
    data.message?.conversation?.trim() ||
    data.message?.extendedTextMessage?.text?.trim() ||
    data.message?.imageMessage?.caption?.trim() ||
    data.message?.videoMessage?.caption?.trim() ||
    data.message?.documentMessage?.caption?.trim() ||
    (data.message?.documentMessage?.fileName
      ? '[Документ: ' + data.message.documentMessage.fileName + ']'
      : '') ||
    '[Входящее сообщение без текста]'
  );
}

function senderFromJid(value: string) {
  const left = value.split('@')[0] ?? '';
  return left.split(':')[0] ?? '';
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = process.env.COMMUNICATIONS_ORGANIZATION_ID?.trim();
  if (!organizationId) {
    return NextResponse.json(
      { error: 'COMMUNICATIONS_ORGANIZATION_ID is not configured.' },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        event?: string;
        instanceName?: string;
        data?: EvolutionMessageData | EvolutionMessageData[];
      }
    | null;

  const eventName = body?.event?.trim().toLowerCase() ?? '';
  if (!body || (eventName !== 'messages.upsert' && eventName !== 'message')) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = Array.isArray(body.data) ? body.data[0] : body.data;
  if (!data?.key) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (data.key.fromMe) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'fromMe' });
  }

  const remoteJid = data.key.remoteJid?.trim() ?? '';
  if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.includes('status@')) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'non-direct-chat' });
  }

  const phone = senderFromJid(remoteJid);
  const providerEventId =
    data.key.id?.trim() ||
    [body.instanceName, remoteJid, data.messageTimestamp].filter(Boolean).join(':') ||
    crypto.randomUUID();

  try {
    const result = await recordInboundCommunication({
      organizationId,
      channel: 'whatsapp',
      phone,
      text: getMessageText(data),
      provider: 'Evolution Go',
      providerEventId,
      senderName: data.pushName?.trim() || null,
      metadata: {
        instance_name: body.instanceName ?? null,
        remote_jid: remoteJid,
        provider_timestamp: data.messageTimestamp ?? null,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Inbound WhatsApp processing failed.',
      },
      { status: 500 },
    );
  }
}
