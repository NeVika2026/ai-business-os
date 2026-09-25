import Link from 'next/link';

import { createAdminClient } from '@/services/supabase/admin';
import { createClient } from '@/services/supabase/server';
import { requireOrganizationAdmin } from '@/utils/auth/authorization';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  updateTeamMemberRoleAction,
} from './actions';

type TeamPageProps = {
  searchParams: Promise<{
    invited?: string;
    updated?: string;
    removed?: string;
    error?: string;
  }>;
};

type MemberRow = {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  profiles: Array<{ full_name: string | null }> | null;
};

function roleLabel(role: 'owner' | 'admin' | 'member') {
  if (role === 'owner') return 'Владелец';
  if (role === 'admin') return 'Администратор';
  return 'Участник';
}

function statusMessage(params: Awaited<TeamPageProps['searchParams']>) {
  if (params.invited === '1') return { kind: 'success', text: 'Участник добавлен. Если аккаунта ещё не было, приглашение отправлено на email.' };
  if (params.updated === '1') return { kind: 'success', text: 'Роль участника обновлена.' };
  if (params.removed === '1') return { kind: 'success', text: 'Доступ участника удалён.' };

  const errors: Record<string, string> = {
    invalid_invite: 'Проверьте email и выбранную роль.',
    invite_failed: 'Не удалось отправить приглашение.',
    already_member: 'Этот пользователь уже состоит в организации.',
    membership_failed: 'Не удалось добавить пользователя в организацию.',
    invalid_role: 'Не удалось определить новую роль.',
    role_failed: 'Не удалось изменить роль.',
    invalid_member: 'Не удалось определить участника.',
    remove_failed: 'Не удалось удалить доступ.',
    owner_protected: 'Роль владельца защищена и не может быть изменена здесь.',
    self_remove: 'Нельзя удалить собственный доступ из этой панели.',
    organization_missing: 'Организация не найдена.',
  };

  if (params.error && errors[params.error]) {
    return { kind: 'error', text: errors[params.error] };
  }

  return null;
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const params = await searchParams;
  const context = await requireOrganizationAdmin();
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) return null;

  const { data: memberData } = await supabase
    .from('organization_members')
    .select('user_id,role,created_at,profiles(full_name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  const admin = createAdminClient();
  const rows = (memberData ?? []) as MemberRow[];

  const members = await Promise.all(
    rows.map(async (row) => {
      let email = '';
      try {
        const { data } = await admin.auth.admin.getUserById(row.user_id);
        email = data.user?.email ?? '';
      } catch {
        email = '';
      }

      return { ...row, email };
    }),
  );

  const notice = statusMessage(params);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <section className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent)]">
              Настройки · Команда
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[var(--text-primary)]">
              Доступ к Бизнес-заводу
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Добавляйте участников и администраторов. Владелец защищён от удаления и изменения роли.
            </p>
          </div>
          <Link
            href="/settings"
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2.5 text-sm font-bold text-[var(--text-primary)]"
          >
            ← Настройки
          </Link>
        </div>
      </section>

      {notice ? (
        <div
          className={
            notice.kind === 'success'
              ? 'rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-700'
              : 'rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-sm text-red-700'
          }
        >
          {notice.text}
        </div>
      ) : null}

      <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
        <h2 className="text-xl font-black text-[var(--text-primary)]">Добавить человека</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Если аккаунта ещё нет, Supabase отправит приглашение на email. Повторный аккаунт не создаётся.
        </p>

        <form action={inviteTeamMemberAction} className="mt-5 grid gap-3 md:grid-cols-[1fr_190px_auto]">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
            className="h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
          <select
            name="role"
            defaultValue="member"
            className="h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="member">Участник</option>
            <option value="admin">Администратор</option>
          </select>
          <button
            type="submit"
            className="h-12 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-white"
          >
            Добавить
          </button>
        </form>
      </section>

      <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Команда</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {context.organizationName} · {members.length} чел.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {members.map((member) => {
            const isOwner = member.role === 'owner';

            return (
              <div
                key={member.user_id}
                className="grid gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-0)] p-4 lg:grid-cols-[1fr_180px_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--text-primary)]">
                    {member.profiles?.[0]?.full_name?.trim() || member.email || 'Пользователь'}
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                    {member.email || member.user_id}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--accent)]">
                    {roleLabel(member.role)}
                  </p>
                </div>

                {isOwner ? (
                  <div className="flex items-center text-sm font-bold text-[var(--text-secondary)]">
                    Защищённая роль
                  </div>
                ) : (
                  <form action={updateTeamMemberRoleAction} className="flex gap-2">
                    <input type="hidden" name="user_id" value={member.user_id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm text-[var(--text-primary)]"
                    >
                      <option value="member">Участник</option>
                      <option value="admin">Администратор</option>
                    </select>
                    <button
                      type="submit"
                      className="h-11 rounded-xl border border-[var(--border-subtle)] px-3 text-xs font-black text-[var(--text-primary)]"
                    >
                      Сохранить
                    </button>
                  </form>
                )}

                {isOwner ? (
                  <div className="flex items-center justify-end text-xs text-[var(--text-secondary)]">
                    Владелец
                  </div>
                ) : (
                  <form action={removeTeamMemberAction} className="flex items-center justify-end">
                    <input type="hidden" name="user_id" value={member.user_id} />
                    <button
                      type="submit"
                      className="h-11 rounded-xl border border-red-400/15 px-4 text-xs font-black text-red-700"
                    >
                      Удалить доступ
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
