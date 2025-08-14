import { PrismaClient } from '@prisma/client';
import { haversineKm } from '../../lib/geo';

const prisma = new PrismaClient();

type ListOffersParams = {
  categoryId?: string;
  categorySlug?: string;
  near?: { lat: number; lng: number };
  radiusKm?: number;       // aplica filtro se near + radiusKm
  page?: number;           // 1-based
  pageSize?: number;       // default 10
};

export async function list(params: ListOffersParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  // Se vier slug, resolve para id primeiro
  let categoryId = params.categoryId;
  if (!categoryId && params.categorySlug) {
    const cat = await prisma.serviceCategory.findUnique({ where: { slug: params.categorySlug } });
    categoryId = cat?.id;
    if (params.categorySlug && !categoryId) {
      return { total: 0, page, pageSize, items: [] };
    }
  }

  // Busca ofertas ativas com minimal info do provider e category
  const [total, items] = await Promise.all([
    prisma.serviceOffer.count({
      where: { active: true, ...(categoryId ? { categoryId } : {}) },
    }),
    prisma.serviceOffer.findMany({
      where: { active: true, ...(categoryId ? { categoryId } : {}) },
      include: {
        category: true,
        provider: {
          include: {
            user: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Se não tiver near, devolve direto sem distância
  if (!params.near) {
    return {
      total,
      page,
      pageSize,
      items: items.map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description,
        priceBase: o.priceBase,
        unit: o.unit,
        category: { id: o.category.id, name: o.category.name, slug: o.category.slug },
        provider: {
          id: o.provider.id,
          userId: o.provider.userId,
          name: o.provider.user.name,
          verified: o.provider.verified,
          radiusKm: o.provider.radiusKm,
          scoreAvg: o.provider.scoreAvg,
          totalReviews: o.provider.totalReviews,
        },
      })),
    };
  }

  // Carregar endereços default dos providers para calcular distância
  const providerUserIds = items.map((o) => o.provider.userId);
  const addresses = await prisma.address.findMany({
    where: { userId: { in: providerUserIds }, isDefault: true },
    select: { userId: true, lat: true, lng: true },
  });
  const addressByUserId = new Map(addresses.map((a) => [a.userId, a]));

  // Monta com distância e aplica filtro por raio, se houver
  const withDistance = items.map((o) => {
    const addr = addressByUserId.get(o.provider.userId);
    let distanceKm: number | null = null;
    if (addr?.lat != null && addr?.lng != null) {
      distanceKm = haversineKm(
        { lat: Number(params.near!.lat), lng: Number(params.near!.lng) },
        { lat: Number(addr.lat),        lng: Number(addr.lng) }
      );
    }
    return {
      id: o.id,
      title: o.title,
      description: o.description,
      priceBase: o.priceBase,
      unit: o.unit,
      distanceKm,
      category: { id: o.category.id, name: o.category.name, slug: o.category.slug },
      provider: {
        id: o.provider.id,
        userId: o.provider.userId,
        name: o.provider.user.name,
        verified: o.provider.verified,
        radiusKm: o.provider.radiusKm,
        scoreAvg: o.provider.scoreAvg,
        totalReviews: o.provider.totalReviews,
      },
    };
  });

  const filtered = typeof params.radiusKm === 'number'
    ? withDistance.filter((o) => o.distanceKm != null && o.distanceKm <= params.radiusKm!)
    : withDistance;

  // Ordena por distância quando houver
  filtered.sort((a, b) => {
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
    return da - db;
  });

  // Observação: o "total" acima é o total bruto (sem filtro de raio).
  // Se quiser um total já filtrado por raio, troque por filtered.length.
  return {
    total,
    page,
    pageSize,
    items: filtered,
  };
}
