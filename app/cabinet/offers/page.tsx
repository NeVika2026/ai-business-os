import { redirect } from 'next/navigation';

import { WelcomeOfferCard } from '@/components/commerce/WelcomeOfferCard';
import { createClient } from '@/services/supabase/server';
import { getWelcomeOffer } from '@/utils/commerce/welcome-offer';

export default async function WelcomeOffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/cabinet/offers');

  const offer = getWelcomeOffer(user.created_at, new Date(), 2990, 1490);

  return (
    <main className="min-h-screen bg-[#fffaf5] px-5 py-10 text-[#1f2430] lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="text-sm font-black uppercase tracking-[0.16em] text-[#7357ff]">
            Личный кабинет · Бизнес-завод
          </div>
          <p className="mt-2 text-[#666b75]">
            Здесь будут покупки, доступы, подписка, договоры и персональные предложения.
          </p>
        </div>
        <WelcomeOfferCard
          active={offer.active}
          regularPrice={offer.regularPrice}
          price={offer.price}
          savings={offer.savings}
          expiresAtIso={offer.expiresAt.toISOString()}
        />
      </div>
    </main>
  );
}
