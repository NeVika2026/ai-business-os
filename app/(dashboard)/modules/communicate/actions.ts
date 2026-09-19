'use server';

import { ensureFactoryProject, saveFactoryArtifact } from '@/lib/factory-chain/persistence';
import { aiGateway } from '@/services/runtime/gateway/ai-gateway';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import type { GatewayRequest } from '@/types/runtime/dto';

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

async function completeLeadFollowUpTask(input: {
  leadId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  userId: string;
}) {
  const marker = 'CRM_LEAD_ID:' + input.leadId;

  const { data: tasks } = await input.supabase
    .from('tasks')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('status', 'todo')
    .ilike('description', '%' + marker + '%');

  const ids = (tasks ?? []).map((task) => task.id);
  if (!ids.length) return;

  await input.supabase
    .from('tasks')
    .update({
      status: 'done',
      updated_by: input.userId,
    })
    .in('id', ids)
    .eq('organization_id', input.organizationId);
}

async function logCommunicationLeadEvent(input: {
  leadId: string;
  type: 'crm_sms_sent' | 'crm_whatsapp_sent';
  text: string;
  recipient: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) return;

  await supabase.from('events').insert({
    organization_id: organizationId,
    type: input.type,
    source: 'communications',
    actor_type: 'user',
    actor_id: user.id,
    payload: {
      lead_id: input.leadId,
      text: input.text,
      recipient: input.recipient,
    },
    metadata: {
      crm_lead_id: input.leadId,
    },
    correlation_id: input.leadId,
  });
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
  leadId?: string | null;
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

    if (input.leadId?.trim()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const organizationId = user ? await getCurrentOrganizationId(supabase) : null;

      if (user && organizationId) {
        await supabase
          .from('crm_leads')
          .update({
            status: 'contacted',
            last_contact_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', input.leadId.trim())
          .eq('organization_id', organizationId);

        await completeLeadFollowUpTask({
          leadId: input.leadId.trim(),
          supabase,
          organizationId,
          userId: user.id,
        });
      }

      await logCommunicationLeadEvent({
        leadId: input.leadId.trim(),
        type: 'crm_sms_sent',
        text: content,
        recipient: to,
      });
    }

    return {
      status: 'sent',
      provider: 'httpSMS',
      projectId,
      message: 'SMS принято к отправке. CRM обновлена.',
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
  leadId?: string | null;
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

    if (input.leadId?.trim()) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const organizationId = user ? await getCurrentOrganizationId(supabase) : null;

      if (user && organizationId) {
        await supabase
          .from('crm_leads')
          .update({
            status: 'contacted',
            last_contact_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('id', input.leadId.trim())
          .eq('organization_id', organizationId);

        await completeLeadFollowUpTask({
          leadId: input.leadId.trim(),
          supabase,
          organizationId,
          userId: user.id,
        });
      }

      await logCommunicationLeadEvent({
        leadId: input.leadId.trim(),
        type: 'crm_whatsapp_sent',
        text,
        recipient: '+' + number,
      });
    }

    return {
      status: 'sent',
      provider: 'Evolution Go',
      projectId,
      message: 'Сообщение отправлено в WhatsApp. CRM обновлена.',
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
  | { status: 'saved'; projectId: string; crmLeadId: string | null; message: string }
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

    let crmLeadId: string | null = null;
    const phone =
      typeof lead.phone === 'string' && lead.phone.trim() ? lead.phone.trim() : null;
    const email =
      typeof lead.email === 'string' && lead.email.trim() ? lead.email.trim() : null;

    if (email) {
      const { data: existingByEmail } = await project.identity.supabase
        .from('crm_leads')
        .select('id')
        .eq('organization_id', project.identity.organizationId)
        .eq('email', email)
        .maybeSingle();
      crmLeadId = existingByEmail?.id ?? null;
    }

    if (!crmLeadId && phone) {
      const { data: existingByPhone } = await project.identity.supabase
        .from('crm_leads')
        .select('id')
        .eq('organization_id', project.identity.organizationId)
        .eq('phone', phone)
        .maybeSingle();
      crmLeadId = existingByPhone?.id ?? null;
    }

    const notesParts = [
      typeof lead.company === 'string' && lead.company.trim()
        ? 'Компания: ' + lead.company.trim()
        : '',
      typeof lead.website === 'string' && lead.website.trim()
        ? 'Сайт: ' + lead.website.trim()
        : '',
      typeof lead.lead_score === 'number'
        ? 'Lead score: ' + String(lead.lead_score)
        : '',
    ].filter(Boolean);

    if (!crmLeadId) {
      const { data: insertedLead, error: leadError } = await project.identity.supabase
        .from('crm_leads')
        .insert({
          organization_id: project.identity.organizationId,
          project_id: project.projectId,
          name: displayName,
          email,
          phone,
          source: 'Scout',
          status: 'new',
          notes: notesParts.join('\n') || null,
          created_by: project.identity.userId,
        })
        .select('id')
        .single();

      if (!leadError && insertedLead?.id) {
        crmLeadId = insertedLead.id;
      }
    } else {
      await project.identity.supabase
        .from('crm_leads')
        .update({
          project_id: project.projectId,
          name: displayName,
          email,
          phone,
          source: 'Scout',
          notes: notesParts.join('\n') || null,
          updated_by: project.identity.userId,
        })
        .eq('id', crmLeadId)
        .eq('organization_id', project.identity.organizationId);
    }

    if (crmLeadId) {
      await project.identity.supabase.from('events').insert({
        organization_id: project.identity.organizationId,
        type: 'crm_lead_imported',
        source: 'scout',
        actor_type: 'user',
        actor_id: project.identity.userId,
        payload: {
          lead_id: crmLeadId,
          source: 'Scout',
          profile: lead,
        },
        metadata: {
          crm_lead_id: crmLeadId,
        },
        correlation_id: crmLeadId,
      });
    }

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
      crmLeadId,
      message: crmLeadId
        ? 'Лид сохранён в проект и CRM.'
        : 'Лид сохранён в проект.',
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось сохранить лид.',
    };
  }
}


export async function generateLeadOutreachMessageAction(input: {
  lead: Record<string, unknown>;
  channel: CommunicationChannel;
  objective?: string;
}): Promise<
  | { status: 'generated'; message: string }
  | { status: 'failed'; message: string }
> {
  const lead = input.lead ?? {};
  const channel = input.channel;
  const objective =
    input.objective?.trim() ||
    'Начать деловой разговор и предложить обсудить сотрудничество без давления.';

  const safeLead = Object.fromEntries(
    Object.entries(lead)
      .filter(([, value]) => {
        const type = typeof value;
        return (
          value === null ||
          type === 'string' ||
          type === 'number' ||
          type === 'boolean'
        );
      })
      .slice(0, 30),
  );

  const runId = crypto.randomUUID();
  const request: GatewayRequest = {
    scope: {
      organizationId: 'org-communications',
      userId: 'user-communications',
    },
    trace: {
      runId,
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [
      {
        role: 'user',
        content: [
          'Ты пишешь первое персональное деловое сообщение потенциальному контакту.',
          'Канал: ' + (channel === 'whatsapp' ? 'WhatsApp' : 'SMS') + '.',
          'Цель: ' + objective,
          '',
          'Данные лида:',
          JSON.stringify(safeLead, null, 2),
          '',
          'Правила:',
          '- используй только факты из данных лида; ничего не выдумывай;',
          '- не притворяйся знакомым человеком и не создавай ложную срочность;',
          '- не упоминай, что данные собраны Scout или автоматически;',
          '- сообщение должно звучать естественно, по-человечески и без канцелярщины;',
          '- для SMS максимум 320 символов; для WhatsApp максимум 650 символов;',
          '- один понятный повод написать и один мягкий следующий шаг;',
          '- не добавляй markdown, заголовок, комментарии или пояснения;',
          '- верни только готовый текст сообщения.',
        ].join('\n'),
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.45,
      maxTokens: 240,
    },
    timeoutMs: 25_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [500, 1000],
    },
    routing: {
      intent: 'lead_outreach_message',
      taskCategory: 'creative',
      estimatedContextLength: JSON.stringify(safeLead).length,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
  };

  try {
    const response = await aiGateway.complete(request);
    const generated = response.content?.trim() ?? '';

    if (!generated) {
      return {
        status: 'failed',
        message: 'OSA не вернула текст сообщения.',
      };
    }

    const limit = channel === 'sms' ? 320 : 650;
    const finalText =
      generated.length <= limit
        ? generated
        : generated.slice(0, Math.max(0, limit - 1)).trimEnd() + '…';

    return {
      status: 'generated',
      message: finalText,
    };
  } catch (error) {
    return {
      status: 'failed',
      message:
        error instanceof Error
          ? error.message
          : 'Не удалось подготовить сообщение.',
    };
  }
}


export async function getCrmLeadContextAction(
  leadId: string,
): Promise<
  | { status: 'found'; lead: Record<string, unknown> }
  | { status: 'failed'; message: string }
> {
  const cleanId = leadId.trim();
  if (!cleanId) return { status: 'failed', message: 'Лид не указан.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: 'failed', message: 'Требуется авторизация.' };

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return { status: 'failed', message: 'Организация не найдена.' };
  }

  const { data: lead, error } = await supabase
    .from('crm_leads')
    .select(
      'id, name, email, phone, status, source, notes, last_contact_at, project_id',
    )
    .eq('organization_id', organizationId)
    .eq('id', cleanId)
    .maybeSingle();

  if (error) return { status: 'failed', message: error.message };
  if (!lead) return { status: 'failed', message: 'Лид не найден.' };

  return {
    status: 'found',
    lead: {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      source: lead.source,
      notes: lead.notes,
      last_contact_at: lead.last_contact_at,
      project_id: lead.project_id,
    },
  };
}


export async function generateCrmReplyMessageAction(input: {
  leadId: string;
  channel: CommunicationChannel;
}): Promise<
  | { status: 'generated'; message: string }
  | { status: 'failed'; message: string }
> {
  const leadId = input.leadId.trim();
  if (!leadId) return { status: 'failed', message: 'Лид не указан.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: 'failed', message: 'Требуется авторизация.' };

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return { status: 'failed', message: 'Организация не найдена.' };
  }

  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id, name, email, phone, status, source, notes, last_contact_at')
    .eq('organization_id', organizationId)
    .eq('id', leadId)
    .maybeSingle();

  if (!lead) return { status: 'failed', message: 'Лид не найден.' };

  const { data: events } = await supabase
    .from('events')
    .select('type, payload, created_at')
    .eq('organization_id', organizationId)
    .eq('correlation_id', leadId)
    .in('type', [
      'crm_whatsapp_sent',
      'crm_whatsapp_received',
      'crm_sms_sent',
      'crm_sms_received',
      'crm_voice_call_completed',
      'crm_note_added',
    ])
    .order('created_at', { ascending: false })
    .limit(24);

  const history = [...(events ?? [])].reverse().map((event) => {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    return {
      type: event.type,
      text:
        (typeof payload.text === 'string' && payload.text) ||
        (typeof payload.transcript === 'string' && payload.transcript) ||
        (typeof payload.note === 'string' && payload.note) ||
        '',
      created_at: event.created_at,
    };
  });

  const runId = crypto.randomUUID();
  const request: GatewayRequest = {
    scope: {
      organizationId,
      userId: user.id,
    },
    trace: {
      runId,
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    },
    providerCode: 'auto',
    modelCode: 'auto',
    messages: [
      {
        role: 'user',
        content: [
          'Напиши следующий ответ клиенту по истории реального диалога.',
          'Канал: ' + (input.channel === 'sms' ? 'SMS' : 'WhatsApp') + '.',
          '',
          'Карточка клиента:',
          JSON.stringify(lead, null, 2),
          '',
          'История общения от старого к новому:',
          JSON.stringify(history, null, 2),
          '',
          'Правила:',
          '- отвечай на последнее сообщение клиента и учитывай предыдущий контекст;',
          '- не выдумывай факты, цены, обещания, сроки или договорённости;',
          '- не повторяй уже заданный вопрос, если клиент на него ответил;',
          '- тон естественный, деловой и короткий, без канцелярщины;',
          '- если в истории недостаточно данных, задай один уместный уточняющий вопрос;',
          '- SMS максимум 320 символов; WhatsApp максимум 650 символов;',
          '- верни только готовый текст, без markdown и пояснений.',
        ].join('\n'),
      },
    ],
    tools: [],
    parameters: {
      temperature: 0.35,
      maxTokens: 260,
    },
    timeoutMs: 25_000,
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: [500, 1000],
    },
    routing: {
      intent: 'crm_reply_message',
      taskCategory: 'creative',
      estimatedContextLength: JSON.stringify({ lead, history }).length,
      reasoningComplexity: 'medium',
      latencyTarget: 'balanced',
      costTarget: 'balanced',
      toolUsage: false,
    },
  };

  try {
    const response = await aiGateway.complete(request);
    const generated = response.content?.trim() ?? '';
    if (!generated) {
      return { status: 'failed', message: 'OSA не вернула текст ответа.' };
    }

    const limit = input.channel === 'sms' ? 320 : 650;
    const finalText =
      generated.length <= limit
        ? generated
        : generated.slice(0, Math.max(0, limit - 1)).trimEnd() + '…';

    return { status: 'generated', message: finalText };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось подготовить ответ.',
    };
  }
}


export type CommunicationsDiagnostics = {
  outbound: CommunicationsStatus;
  evolution: {
    health: 'connected' | 'disconnected' | 'unreachable' | 'not_configured';
    detail: string;
  };
  scout: {
    health: 'healthy' | 'unreachable' | 'not_configured';
    detail: string;
  };
  inbound: {
    ready: boolean;
    missing: string[];
    httpsmsWebhookReady: boolean;
    evolutionWebhookReady: boolean;
    webhookPaths: {
      httpsms: string;
      evolution: string;
    };
  };
};

export async function getCommunicationsDiagnosticsAction(): Promise<CommunicationsDiagnostics> {
  const outbound = await getCommunicationsStatusAction();

  const evolutionBase = process.env.EVOLUTION_GO_BASE_URL?.trim()?.replace(/\/$/, '');
  const evolutionToken = process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim();

  let evolution: CommunicationsDiagnostics['evolution'] = {
    health: 'not_configured',
    detail: 'Нужны EVOLUTION_GO_BASE_URL и EVOLUTION_GO_INSTANCE_TOKEN.',
  };

  if (evolutionBase && evolutionToken) {
    try {
      const response = await fetch(evolutionBase + '/instance/status', {
        headers: {
          accept: 'application/json',
          apikey: evolutionToken,
        },
        cache: 'no-store',
      });

      const raw = await response.text();
      let data: Record<string, unknown> = {};
      try {
        data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        data = { raw };
      }

      const nested =
        data.data && typeof data.data === 'object'
          ? (data.data as Record<string, unknown>)
          : data;
      const loggedIn = nested.loggedIn === true;
      const connected = nested.connected === true;

      evolution = response.ok
        ? {
            health: loggedIn ? 'connected' : 'disconnected',
            detail: loggedIn
              ? 'WhatsApp подключён и авторизован.'
              : connected
                ? 'Инстанс отвечает, но WhatsApp ещё не авторизован.'
                : 'Инстанс отвечает, но сейчас не подключён.',
          }
        : {
            health: 'unreachable',
            detail:
              (typeof data.error === 'string' && data.error) ||
              (typeof data.message === 'string' && data.message) ||
              'Evolution Go вернул ошибку статуса.',
          };
    } catch (error) {
      evolution = {
        health: 'unreachable',
        detail:
          error instanceof Error
            ? error.message
            : 'Evolution Go недоступен.',
      };
    }
  }

  const scoutBase = process.env.SCOUT_API_URL?.trim()?.replace(/\/$/, '');
  const scoutToken = process.env.SCOUT_API_TOKEN?.trim();

  let scout: CommunicationsDiagnostics['scout'] = {
    health: 'not_configured',
    detail: 'Нужен SCOUT_API_URL.',
  };

  if (scoutBase) {
    try {
      const response = await fetch(scoutBase + '/health', {
        headers: {
          accept: 'application/json',
          ...(scoutToken ? { authorization: 'Bearer ' + scoutToken } : {}),
        },
        cache: 'no-store',
      });

      scout = response.ok
        ? {
            health: 'healthy',
            detail: 'Scout worker отвечает.',
          }
        : {
            health: 'unreachable',
            detail: 'Scout worker вернул HTTP ' + response.status + '.',
          };
    } catch (error) {
      scout = {
        health: 'unreachable',
        detail:
          error instanceof Error ? error.message : 'Scout worker недоступен.',
      };
    }
  }

  const inboundRequired = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'COMMUNICATIONS_ORGANIZATION_ID',
  ];

  const missing = inboundRequired.filter(
    (key) => !process.env[key]?.trim(),
  );

  const httpsmsWebhookReady = Boolean(
    process.env.HTTPSMS_WEBHOOK_SECRET?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.COMMUNICATIONS_ORGANIZATION_ID?.trim(),
  );

  const evolutionWebhookReady = Boolean(
    (process.env.EVOLUTION_GO_WEBHOOK_SECRET?.trim() ||
      process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim()) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.COMMUNICATIONS_ORGANIZATION_ID?.trim(),
  );

  if (!process.env.HTTPSMS_WEBHOOK_SECRET?.trim()) {
    missing.push('HTTPSMS_WEBHOOK_SECRET');
  }

  if (
    !process.env.EVOLUTION_GO_WEBHOOK_SECRET?.trim() &&
    !process.env.EVOLUTION_GO_INSTANCE_TOKEN?.trim()
  ) {
    missing.push('EVOLUTION_GO_WEBHOOK_SECRET');
  }

  return {
    outbound,
    evolution,
    scout,
    inbound: {
      ready: httpsmsWebhookReady || evolutionWebhookReady,
      missing: [...new Set(missing)],
      httpsmsWebhookReady,
      evolutionWebhookReady,
      webhookPaths: {
        httpsms: '/api/webhooks/httpsms',
        evolution: '/api/webhooks/evolution-go',
      },
    },
  };
}
