'use server';

import { ensureFactoryProject, saveFactoryArtifact } from '@/lib/factory-chain/persistence';

export type CommunicationChannel = 'sms' | 'whatsapp';

export type CommunicationsStatus = {
  sms: {
    connected: boolean;
    provider: 'httpSMS';
    fromConfigured: boolean;
  };
  whatsapp: {
    connected: boolean;
    provider: 'Evolution Go';
    baseUrlConfigured: boolean;
    tokenConfigured: boolean;
  };
  scout: {
    connected: boolean;
    provider: 'Scout';
  };
};

function cleanPhone(value: string) {
  return value.trim().replace(/[\s()\-]/g, '');
}

function normalizeE164(value: string): string | null {
  const cleaned = cleanPhone(value);
  if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) return null;
  return cleaned;
}

function normalizeWhatsAppNumber(value: string): string | null {
  const cleaned = cleanPhone(value).replace(/^\+/, '');
  if (!/^[1-9]\d{7,14}$/.test(cleaned)) return null;
  return cleaned;
}

function trimBaseUrl(value: string | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/$/, '');
}

export async function getCommunicationsStatusAction(): Promise<CommunicationsStatus> {
  return {
    sms: {
      connected: Boolean(
        process.env.HTTPSMS_API_KEY?.trim() &&
          process.env.HTTPSMS_FROM_PHONE?.trim(),
      ),
      provider: 'httpSMS',
      fromConfigured: Boolean(process.env.HTTPSMS_FROM_PHONE?.trim()),
    },
    whatsapp: {
      connected: Boolean(
        process.env.EVOLUTION_GO_BASE_URL?.trim() &&
          process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim(),
      ),
      provider: 'Evolution Go',
      baseUrlConfigured: Boolean(process.env.EVOLUTION_GO_BASE_URL?.trim()),
      tokenConfigured: Boolean(process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim()),
    },
    scout: {
      connected: Boolean(process.env.SCOUT_API_URL?.trim()),
      provider: 'Scout',
    },
  };
}

export async function sendSmsMessageAction(input: {
  to: string;
  content: string;
  consentConfirmed: boolean;
  projectId?: string | null;
}): Promise<
  | { status: 'sent'; provider: 'httpSMS'; projectId: string | null; message: string }
  | { status: 'failed'; message: string }
> {
  if (!input.consentConfirmed) {
    return {
      status: 'failed',
      message: 'Подтвердите, что у вас есть законное основание отправить это сообщение.',
    };
  }

  const apiKey = process.env.HTTPSMS_API_KEY?.trim();
  const from = process.env.HTTPSMS_FROM_PHONE?.trim();
  const baseUrl = trimBaseUrl(
    process.env.HTTPSMS_BASE_URL,
    'https://api.httpsms.com',
  );
  const to = normalizeE164(input.to);
  const content = input.content.trim();

  if (!apiKey || !from) {
    return {
      status: 'failed',
      message: 'httpSMS ещё не подключён: нужны HTTPSMS_API_KEY и HTTPSMS_FROM_PHONE.',
    };
  }

  if (!to) {
    return {
      status: 'failed',
      message: 'Номер должен быть в международном формате, например +79991234567.',
    };
  }

  if (!content) {
    return { status: 'failed', message: 'Введите текст SMS.' };
  }

  try {
    const response = await fetch(baseUrl + '/v1/messages/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        from,
        to,
        content,
      }),
      cache: 'no-store',
    });

    const raw = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      return {
        status: 'failed',
        message:
          (typeof data.message === 'string' && data.message) ||
          (typeof data.error === 'string' && data.error) ||
          'httpSMS вернул ошибку отправки.',
      };
    }

    let projectId: string | null = null;

    if (input.projectId?.trim()) {
      const project = await ensureFactoryProject({
        projectId: input.projectId,
        seed: 'SMS клиенту',
        stage: 'publish',
      });
      projectId = project.projectId;

      await saveFactoryArtifact({
        projectId: project.projectId,
        stage: 'publish',
        title: 'SMS · отправлено',
        content: content + '\n\nПолучатель: ' + to,
        metadata: {
          artifactType: 'sms_message',
          provider: 'httpsms',
          recipient: to,
          sentAt: new Date().toISOString(),
        },
        identity: project.identity,
      });
    }

    return {
      status: 'sent',
      provider: 'httpSMS',
      projectId,
      message: 'SMS принято к отправке.',
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось отправить SMS.',
    };
  }
}

export async function sendWhatsAppMessageAction(input: {
  to: string;
  text: string;
  consentConfirmed: boolean;
  projectId?: string | null;
}): Promise<
  | { status: 'sent'; provider: 'Evolution Go'; projectId: string | null; message: string }
  | { status: 'failed'; message: string }
> {
  if (!input.consentConfirmed) {
    return {
      status: 'failed',
      message: 'Подтвердите, что у вас есть законное основание написать этому человеку.',
    };
  }

  const baseUrl = process.env.EVOLUTION_GO_BASE_URL?.trim()?.replace(/\/$/, '');
  const token = process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim();
  const number = normalizeWhatsAppNumber(input.to);
  const text = input.text.trim();

  if (!baseUrl || !token) {
    return {
      status: 'failed',
      message:
        'Evolution Go ещё не подключён: нужны EVOLUTION_GO_BASE_URL и EVOLUTION_GO_INSTANCE_TOKEN.',
    };
  }

  if (!number) {
    return {
      status: 'failed',
      message: 'Укажите номер WhatsApp в международном формате.',
    };
  }

  if (!text) {
    return { status: 'failed', message: 'Введите текст сообщения.' };
  }

  try {
    const response = await fetch(baseUrl + '/send/text', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        apikey: token,
      },
      body: JSON.stringify({
        number,
        text,
        formatJid: true,
      }),
      cache: 'no-store',
    });

    const raw = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      return {
        status: 'failed',
        message:
          (typeof data.error === 'string' && data.error) ||
          (typeof data.message === 'string' && data.message) ||
          'Evolution Go вернул ошибку отправки.',
      };
    }

    let projectId: string | null = null;

    if (input.projectId?.trim()) {
      const project = await ensureFactoryProject({
        projectId: input.projectId,
        seed: 'WhatsApp клиенту',
        stage: 'publish',
      });
      projectId = project.projectId;

      await saveFactoryArtifact({
        projectId: project.projectId,
        stage: 'publish',
        title: 'WhatsApp · отправлено',
        content: text + '\n\nПолучатель: +' + number,
        metadata: {
          artifactType: 'whatsapp_message',
          provider: 'evolution-go',
          recipient: '+' + number,
          sentAt: new Date().toISOString(),
        },
        identity: project.identity,
      });
    }

    return {
      status: 'sent',
      provider: 'Evolution Go',
      projectId,
      message: 'Сообщение отправлено в WhatsApp.',
    };
  } catch (error) {
    return {
      status: 'failed',
      message:
        error instanceof Error ? error.message : 'Не удалось отправить сообщение в WhatsApp.',
    };
  }
}


export type ScoutPlatform =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'github'
  | 'youtube'
  | 'twitch'
  | 'linkbio'
  | 'pinterest';

export type ScoutLeadResult =
  | { status: 'found'; lead: Record<string, unknown> }
  | { status: 'failed'; message: string };

export async function scrapeScoutLeadAction(input: {
  platform: ScoutPlatform;
  identifier: string;
  enrich?: boolean;
}): Promise<ScoutLeadResult> {
  const baseUrl = process.env.SCOUT_API_URL?.trim()?.replace(/\/$/, '');
  const token = process.env.SCOUT_API_TOKEN?.trim();
  const identifier = input.identifier.trim();

  if (!baseUrl) {
    return {
      status: 'failed',
      message: 'Scout worker ещё не подключён: нужен SCOUT_API_URL.',
    };
  }

  if (!identifier) {
    return {
      status: 'failed',
      message: 'Укажите профиль, канал или идентификатор.',
    };
  }

  try {
    const response = await fetch(baseUrl + '/scrape', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(token ? { authorization: 'Bearer ' + token } : {}),
      },
      body: JSON.stringify({
        platform: input.platform,
        identifier,
        enrich: input.enrich !== false,
      }),
      cache: 'no-store',
    });

    const raw = await response.text();
    let data: Record<string, unknown> = {};

    try {
      data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      return {
        status: 'failed',
        message:
          (typeof data.detail === 'string' && data.detail) ||
          (typeof data.message === 'string' && data.message) ||
          'Scout worker вернул ошибку.',
      };
    }

    const lead =
      data.lead && typeof data.lead === 'object'
        ? (data.lead as Record<string, unknown>)
        : null;

    if (!lead) {
      return {
        status: 'failed',
        message: 'Scout не вернул данные профиля.',
      };
    }

    return { status: 'found', lead };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Scout worker недоступен.',
    };
  }
}


export async function saveScoutLeadAction(input: {
  lead: Record<string, unknown>;
  projectId?: string | null;
}): Promise<
  | { status: 'saved'; projectId: string; message: string }
  | { status: 'failed'; message: string }
> {
  const lead = input.lead ?? {};
  const displayName =
    (typeof lead.full_name === 'string' && lead.full_name.trim()) ||
    (typeof lead.name === 'string' && lead.name.trim()) ||
    (typeof lead.username === 'string' && lead.username.trim()) ||
    'Лид';

  try {
    const project = await ensureFactoryProject({
      projectId: input.projectId,
      seed: 'Лид · ' + displayName,
      stage: 'find',
    });

    const visibleFields = [
      ['Имя', lead.full_name ?? lead.name],
      ['Username', lead.username],
      ['Компания', lead.company],
      ['Email', lead.email],
      ['Телефон', lead.phone],
      ['Сайт', lead.website],
      ['Lead score', lead.lead_score],
      ['Email score', lead.email_score],
      ['Email verified', lead.email_verified],
    ]
      .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
      .map(([label, value]) => label + ': ' + String(value))
      .join('\n');

    await saveFactoryArtifact({
      projectId: project.projectId,
      stage: 'find',
      title: 'Лид · ' + displayName,
      content: visibleFields || JSON.stringify(lead, null, 2),
      metadata: {
        artifactType: 'lead',
        source: 'scout',
        lead,
        savedAt: new Date().toISOString(),
      },
      identity: project.identity,
    });

    return {
      status: 'saved',
      projectId: project.projectId,
      message: 'Лид сохранён в проект.',
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось сохранить лид.',
    };
  }
}
