import { Prisma } from '@prisma/client';

export type PriceCalcInput = {
  priceBase: Prisma.Decimal;
  distanceKm?: number | null;
};

export function estimatePrice({ priceBase, distanceKm }: PriceCalcInput): Prisma.Decimal {
  // Regra MVP: preço = base + (distância * 2.00), se houver
  const extra = distanceKm && distanceKm > 0 ? (distanceKm * 2.0) : 0;
  return new Prisma.Decimal(priceBase).plus(extra.toFixed(2));
}
