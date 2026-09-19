import { NextRequest, NextResponse } from 'next/server';

import { recordInboundCommunication } from '@/lib/crm/webhook-inbox';

function authorized(request: NextRequest) {
  const expected = process.env.HTTPSMS_WEBHOOK_SECRET?.trim();
  if (!expected) return false;

  const querySecret = request.nextUrl.searchParams.get('secret')?.trim();
  const headerSecret =
    request.headers.get('x-business-zavod-webhook-secret')?.trim() ||
    request.headers.get('x-webhook-secret')?.trim();

  return querySecret === expected || headerSecret === expected;
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
        id?: string;
        type?: string;
        data?: {
          message_id?: string;
          owner?: string;
          contact?: string;
          content?: string;
          timestamp?: string;
          encrypted?: boolean;
          sim?: string;
        };
      }
    | null;

  if (!body || body.type !== 'message.phone.received' || !body.data) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const phone = body.data.contact?.trim() ?? '';
  const providerEventId =
    body.id?.trim() || body.data.message_id?.trim() || crypto.randomUUID();

  const encrypted = body.data.encrypted === true;
  const text = encrypted
    ? '[Зашифрованное входящее SMS]'
    : body.data.content?.trim() || '[SMS без текста]';

  try {
    const result = await recordInboundCommunication({
      organizationId,
      channel: 'sms',
      phone,
      text,
      provider: 'httpSMS',
      providerEventId,
      metadata: {
        encrypted,
        owner: body.data.owner ?? null,
        sim: body.data.sim ?? null,
        provider_timestamp: body.data.timestamp ?? null,
        message_id: body.data.message_id ?? null,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Inbound SMS processing failed.',
      },
      { status: 500 },
    );
  }
}
