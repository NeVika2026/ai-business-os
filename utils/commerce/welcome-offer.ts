const WELCOME_WINDOW_MS = 24 * 60 * 60 * 1000;

export type WelcomeOffer = {
  active: boolean;
  price: number;
  regularPrice: number;
  welcomePrice: number;
  savings: number;
  remainingMs: number;
  expiresAt: Date;
};

export function getWelcomeOffer(
  createdAt: string | Date,
  now: Date,
  regularPrice: number,
  welcomePrice: number,
): WelcomeOffer {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const expiresAt = new Date(created.getTime() + WELCOME_WINDOW_MS);

  const validPrices =
    Number.isFinite(regularPrice) &&
    Number.isFinite(welcomePrice) &&
    regularPrice >= 0 &&
    welcomePrice >= 0 &&
    welcomePrice < regularPrice;

  const validCreatedAt = Number.isFinite(created.getTime()) && created.getTime() <= now.getTime();
  const remainingMs = validCreatedAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0;
  const active = validPrices && validCreatedAt && remainingMs > 0;

  return {
    active,
    price: active ? welcomePrice : Math.max(0, regularPrice),
    regularPrice: Math.max(0, regularPrice),
    welcomePrice: validPrices ? welcomePrice : Math.max(0, regularPrice),
    savings: active ? Math.max(0, regularPrice - welcomePrice) : 0,
    remainingMs,
    expiresAt,
  };
}
