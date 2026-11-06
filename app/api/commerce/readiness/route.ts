import { NextResponse } from 'next/server';

import { getCommerceReadiness } from '@/utils/commerce/readiness';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = getCommerceReadiness({
    TOCHKA_API_TOKEN: process.env.TOCHKA_API_TOKEN,
    TOCHKA_CUSTOMER_CODE: process.env.TOCHKA_CUSTOMER_CODE,
    TOCHKA_PUBLIC_KEY: process.env.TOCHKA_PUBLIC_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });

  return NextResponse.json(
    {
      checkoutReady: readiness.checkoutReady,
      webhookReady: readiness.webhookReady,
      missing: readiness.missing,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
