import { createClient } from '@/services/supabase/server';
import { getDashboardContext } from '@/utils/auth/onboarding';

import {
  startPhoneLinkAction,
  verifyPhoneLinkAction,
} from './actions';

type CabinetPageProps = {
  searchParams: Promise<{
    phone_sent?: string;
    phone_linked?: string;
    error?: string;
  }>;
};

function roleLabel(role: 'owner' | 'admin' | 'member') {
  if (role === 'owner') return 'Владелец';
  if (role === 'admin') return 'Администратор';
  return 'Участник';
}

function maskPhone(phone: string | null | undefined) {
  if (!phone) return 'Не привязан';
  if (phone.length <= 6) return phone;
  return phone.slice(0, 4) + '••••' + phone.slice(-4);
}

export default async function CabinetPage({ searchParams }: CabinetPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const context = await getDashboardContext(supabase);

  if (!user || !context) return null;

  const phoneSent = params.phone_sent === '1';
  const phoneLinked = params.phone_linked === '1';

  const errorMessage =
    params.error === 'invalid_phone'
      ? 'Введите номер в международном формате, например +79991234567.'
      : params.error === 'phone_send_failed'
        ? 'Не удалось отправить SMS. Проверьте настройку SMS-провайдера в Supabase.'
        : params.error === 'phone_session_expired'
          ? 'Время подтверждения истекло. Запросите новый код.'
          : params.error === 'invalid_code'
            ? 'Код неверный или уже истёк.'
            : null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <section className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent)]">
          Личный кабинет
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[var(--text-primary)]">
          Аккаунт и безопасность
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          Здесь хранятся данные входа и способ подтверждения по телефону. Пароль для Бизнес-завода не нужен.
        </p>
      </section>

      {phoneLinked ? (
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-700">
          Телефон подтверждён. Теперь этот номер можно использовать для SMS-входа.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-secondary)]">Email</p>
          <p className="mt-2 break-all text-sm font-semibold text-[var(--text-primary)]">{user.email || '—'}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-secondary)]">Роль</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{roleLabel(context.role)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
          <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--text-secondary)]">Телефон</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{maskPhone(user.phone)}</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
        <h2 className="text-xl font-black text-[var(--text-primary)]">
          {user.phone ? 'Изменить телефон' : 'Привязать телефон'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          На номер придёт одноразовый SMS-код. После подтверждения телефон можно использовать вместо email при входе.
        </p>

        {!phoneSent ? (
          <form action={startPhoneLinkAction} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="+7 999 123-45-67"
              className="h-12 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="h-12 rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-white"
            >
              Получить SMS-код
            </button>
          </form>
        ) : (
          <form action={verifyPhoneLinkAction} className="mt-5 max-w-md space-y-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-secondary)]">
                Код из SMS
              </span>
              <input
                name="token"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                maxLength={8}
                required
                placeholder="123456"
                className="h-14 w-full rounded-xl border border-[var(--accent)]/30 bg-[var(--surface-0)] px-4 text-center text-xl font-black tracking-[.25em] text-[var(--text-primary)] outline-none"
              />
            </label>
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-[var(--accent)] px-5 text-sm font-black text-white"
            >
              Подтвердить телефон
            </button>
          </form>
        )}
      </section>

      <section className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6">
        <h2 className="text-lg font-black text-[var(--text-primary)]">Организация</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{context.organizationName}</p>
      </section>
    </main>
  );
}
