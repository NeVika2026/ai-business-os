'use server';

import { randomUUID } from 'node:crypto';

import { ensureFactoryProject, saveFactoryArtifact } from '@/lib/factory-chain/persistence';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

const DEFAULT_BASE_URL = 'https://voicyfy.ru';

type VoicyfyStartResponse = {
  success?: boolean;
  message?: string;
  started?: number;
  failed?: number;
  session_ids?: string[];
  detail?: string;
};

export type VoiceAgentDialogItem = {
  role: 'user' | 'assistant' | string;
  text: string;
  ts?: number | null;
};

export type VoiceAgentCallData = {
  sessionHistoryId: string;
  assistantName: string | null;
  assistantType: string | null;
  callerNumber: string | null;
  direction: string | null;
  cost: number | null;
  durationSeconds: number | null;
  recordUrl: string | null;
  createdAt: string | null;
  dialog: VoiceAgentDialogItem[];
  messagesCount: number;
};

export type VoiceAgentConnectionStatus = {
  connected: boolean;
  provider: 'voicyfy';
  assistantConfigured: boolean;
  baseUrl: string;
};

function normalizePhone(value: string): string | null {
  const trimmed = value.trim().replace(/[\s()\-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) return null;
  return trimmed;
}

function baseUrl() {
  return (process.env.VOICYFY_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
}

export async function getVoiceAgentConnectionStatusAction(): Promise<VoiceAgentConnectionStatus> {
  return {
    connected: Boolean(process.env.VOICYFY_ASSISTANT_ID?.trim()),
    provider: 'voicyfy',
    assistantConfigured: Boolean(process.env.VOICYFY_ASSISTANT_ID?.trim()),
    baseUrl: baseUrl(),
  };
}

export async function startVoiceAgentCallAction(input: {
  targetPhone: string;
  task?: string;
  firstPhrase?: string;
  callerPhone?: string;
  projectId?: string | null;
}): Promise<
  | { status: 'started'; sessionId: string; projectId: string | null; message: string }
  | { status: 'failed'; message: string }
> {
  const assistantId = process.env.VOICYFY_ASSISTANT_ID?.trim();
  if (!assistantId) {
    return {
      status: 'failed',
      message: 'Голосовой агент ещё не подключён. Нужен VOICYFY_ASSISTANT_ID в настройках окружения.',
    };
  }

  const targetPhone = normalizePhone(input.targetPhone);
  if (!targetPhone) {
    return {
      status: 'failed',
      message: 'Укажите номер в международном формате, например +79991234567.',
    };
  }

  const callerPhone = input.callerPhone?.trim()
    ? normalizePhone(input.callerPhone)
    : null;

  if (input.callerPhone?.trim() && !callerPhone) {
    return {
      status: 'failed',
      message: 'Номер Caller ID указан неверно.',
    };
  }

  let projectId: string | null = null;

  try {
    if (input.projectId?.trim()) {
      const project = await ensureFactoryProject({
        projectId: input.projectId,
        seed: input.task?.trim() || 'Голосовой звонок',
        stage: 'create',
      });
      projectId = project.projectId;
    }

    const response = await fetch(`${baseUrl()}/api/telephony/public/call`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        assistant_id: assistantId,
        target_phones: [targetPhone],
        ...(callerPhone ? { caller_phone: callerPhone } : {}),
        ...(input.firstPhrase?.trim() ? { first_phrase: input.firstPhrase.trim() } : {}),
        ...(input.task?.trim() ? { task: input.task.trim() } : {}),
      }),
      cache: 'no-store',
    });

    const data = (await response.json()) as VoicyfyStartResponse;

    if (!response.ok || !data.success || !data.session_ids?.length) {
      return {
        status: 'failed',
        message: data.detail || data.message || 'Не удалось запустить звонок.',
      };
    }

    return {
      status: 'started',
      sessionId: data.session_ids[0],
      projectId,
      message: data.message || 'Звонок запущен.',
    };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось запустить звонок.',
    };
  }
}

export async function getVoiceAgentCallAction(
  sessionId: string,
  projectId?: string | null,
  leadId?: string | null,
): Promise<
  | { status: 'completed'; call: VoiceAgentCallData }
  | { status: 'pending'; message: string }
  | { status: 'failed'; message: string }
> {
  const cleanId = sessionId.trim();
  if (!cleanId) {
    return { status: 'failed', message: 'Не найден ID звонка.' };
  }

  try {
    const response = await fetch(
      `${baseUrl()}/api/telephony/call/${encodeURIComponent(cleanId)}`,
      { cache: 'no-store' },
    );

    if (response.status === 404) {
      return {
        status: 'pending',
        message: 'Звонок ещё идёт или запись результата ещё не сформирована.',
      };
    }

    const data = (await response.json()) as {
      success?: boolean;
      detail?: string;
      call_session_history_id?: string;
      assistant_name?: string | null;
      assistant_type?: string | null;
      caller_number?: string | null;
      call_direction?: string | null;
      call_cost?: number | null;
      call_duration?: number | null;
      record_url?: string | null;
      created_at?: string | null;
      dialog?: Array<{ role?: string; text?: string; ts?: number | null }>;
      messages_count?: number;
    };

    if (!response.ok || !data.success) {
      return {
        status: 'failed',
        message: data.detail || 'Не удалось получить результат звонка.',
      };
    }

    const call: VoiceAgentCallData = {
      sessionHistoryId: data.call_session_history_id || cleanId,
      assistantName: data.assistant_name ?? null,
      assistantType: data.assistant_type ?? null,
      callerNumber: data.caller_number ?? null,
      direction: data.call_direction ?? null,
      cost: typeof data.call_cost === 'number' ? data.call_cost : null,
      durationSeconds:
        typeof data.call_duration === 'number' ? data.call_duration : null,
      recordUrl: data.record_url ?? null,
      createdAt: data.created_at ?? null,
      dialog: (data.dialog ?? []).map((item) => ({
        role: item.role || 'unknown',
        text: item.text || '',
        ts: item.ts ?? null,
      })),
      messagesCount:
        typeof data.messages_count === 'number'
          ? data.messages_count
          : (data.dialog ?? []).length,
    };

    if (projectId?.trim()) {
      const project = await ensureFactoryProject({
        projectId,
        seed: 'Голосовой звонок',
        stage: 'create',
      });

      const transcript = call.dialog
        .map((item) => `${item.role === 'assistant' ? 'Агент' : 'Клиент'}: ${item.text}`)
        .join('\n');

      await saveFactoryArtifact({
        projectId: project.projectId,
        stage: 'create',
        title: `Голосовой звонок · ${call.assistantName || 'AI-агент'}`,
        content: transcript || 'Звонок завершён без текстовой расшифровки.',
        metadata: {
          artifactType: 'voice_call',
          provider: 'voicyfy',
          sessionId: call.sessionHistoryId,
          durationSeconds: call.durationSeconds,
          cost: call.cost,
          recordUrl: call.recordUrl,
          savedAt: new Date().toISOString(),
          eventId: randomUUID(),
        },
        identity: project.identity,
      });
    }

    if (leadId?.trim()) {
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
          .eq('id', leadId.trim())
          .eq('organization_id', organizationId);

        const transcript = call.dialog
          .map((item) => `${item.role === 'assistant' ? 'Агент' : 'Клиент'}: ${item.text}`)
          .join('\n');

        await supabase.from('events').insert({
          organization_id: organizationId,
          type: 'crm_voice_call_completed',
          source: 'voice-agent',
          actor_type: 'agent',
          actor_id: user.id,
          payload: {
            lead_id: leadId.trim(),
            transcript,
            summary:
              call.messagesCount > 0
                ? 'Звонок завершён, сообщений в диалоге: ' + String(call.messagesCount)
                : 'Звонок завершён.',
            duration_seconds: call.durationSeconds,
            cost: call.cost,
            record_url: call.recordUrl,
            session_id: call.sessionHistoryId,
          },
          metadata: {
            crm_lead_id: leadId.trim(),
          },
          correlation_id: leadId.trim(),
        });
      }
    }

    return { status: 'completed', call };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Не удалось получить результат звонка.',
    };
  }
}
