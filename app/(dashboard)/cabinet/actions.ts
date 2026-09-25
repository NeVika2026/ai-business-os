'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';

const PHONE_COOKIE = 'bz_phone_change';

function normalizePhone(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return '';
  return '+' + digits;
}

function safeCabinetError(code: string) {
  return '/cabinet?error=' + encodeURIComponent(code);
}

export async function startPhoneLinkAction(formData: FormData) {
  const phone = normalizePhone(formData.get('phone'));

  if (!phone) {
    redirect(safeCabinetError('invalid_phone'));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login/sign-in');
  }

  const { error } = await supabase.auth.updateUser({ phone });

  if (error) {
    redirect(safeCabinetError('phone_send_failed'));
  }

  const cookieStore = await cookies();
  cookieStore.set(PHONE_COOKIE, phone, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60,
    path: '/cabinet',
  });

  redirect('/cabinet?phone_sent=1');
}

export async function verifyPhoneLinkAction(formData: FormData) {
  const token = formData.get('token');
  const cookieStore = await cookies();
  const phone = cookieStore.get(PHONE_COOKIE)?.value ?? '';

  if (!phone) {
    redirect(safeCabinetError('phone_session_expired'));
  }

  if (typeof token !== 'string' || !/^\d{6,8}$/.test(token.trim())) {
    redirect('/cabinet?phone_sent=1&error=invalid_code');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: token.trim(),
    type: 'phone_change',
  });

  if (error) {
    redirect('/cabinet?phone_sent=1&error=invalid_code');
  }

  cookieStore.delete(PHONE_COOKIE);
  redirect('/cabinet?phone_linked=1');
}
