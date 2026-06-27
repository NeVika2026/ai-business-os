'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/services/supabase/server';

function getOrigin(headersList: Headers) {
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') ?? 'http';

  if (host) {
    return `${protocol}://${host}`;
  }

  return 'http://127.0.0.1:3000';
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email');

  if (typeof email !== 'string' || !email.trim()) {
    redirect('/login?error=invalid_email');
  }

  const headersList = await headers();
  const origin = getOrigin(headersList);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect('/login?error=send_failed');
  }

  redirect('/login?sent=1');
}
