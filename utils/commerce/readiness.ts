export type CommerceEnv = {
  TOCHKA_API_TOKEN?: string;
  TOCHKA_CUSTOMER_CODE?: string;
  TOCHKA_PUBLIC_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
};

export type CommerceReadiness = {
  checkoutReady: boolean;
  webhookReady: boolean;
  missing: string[];
};

export function getCommerceReadiness(env: CommerceEnv): CommerceReadiness {
  const required = [
    'TOCHKA_API_TOKEN',
    'TOCHKA_CUSTOMER_CODE',
    'TOCHKA_PUBLIC_KEY',
    'SUPABASE_SECRET_KEY',
  ] as const;

  const missing = required.filter((key) => !env[key]?.trim());

  return {
    checkoutReady:
      Boolean(env.TOCHKA_API_TOKEN?.trim()) &&
      Boolean(env.TOCHKA_CUSTOMER_CODE?.trim()) &&
      Boolean(env.SUPABASE_SECRET_KEY?.trim()),
    webhookReady:
      Boolean(env.TOCHKA_PUBLIC_KEY?.trim()) &&
      Boolean(env.SUPABASE_SECRET_KEY?.trim()),
    missing: [...missing],
  };
}
