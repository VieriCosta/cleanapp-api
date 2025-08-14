import { PrismaClient, Prisma, Unit, JobStatus } from '@prisma/client';
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

export async function detail(offerId: string) {
  const o = await prisma.serviceOffer.findUnique({
    where: { id: offerId },
    include: {
      category: true,
      provider: { include: { user: true } },
    },
  });
  if (!o) throw { status: 404, code: 'OFFER_NOT_FOUND' };
  return o;
}

type CreateInput = {
  title: string;
  description?: string;
  priceBase: number;        // em reais (número)
  unit: Unit;               // 'hora' | 'diaria' | etc. conforme seu enum
  categoryId?: string;
  categorySlug?: string;
  active?: boolean;
};

export async function create(userId: string, data: CreateInput) {
  // garante ProviderProfile (upsert mínimo)
  const provider = await prisma.providerProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, verified: false, radiusKm: 10 },
  });

  // resolve categoria
  let categoryId = data.categoryId;
  if (!categoryId && data.categorySlug) {
    const cat = await prisma.serviceCategory.findUnique({ where: { slug: data.categorySlug } });
    if (!cat) throw { status: 400, code: 'CATEGORY_NOT_FOUND' };
    categoryId = cat.id;
  }
  if (!categoryId) throw { status: 400, code: 'CATEGORY_REQUIRED' };

  // cria
  const created = await prisma.serviceOffer.create({
    data: {
      providerId: provider.id,
      categoryId,
      title: data.title,
      description: data.description ?? '',
      priceBase: new Prisma.Decimal(Number(data.priceBase).toFixed(2)),
      unit: data.unit,
      active: data.active ?? true,
    },
  });
  return created;
}

type UpdateInput = {
  title?: string;
  description?: string;
  priceBase?: number;
  unit?: Unit;
  categoryId?: string;
  categorySlug?: string;
  active?: boolean;
};

export async function update(userId: string, offerId: string, data: UpdateInput) {
  const offer = await prisma.serviceOffer.findUnique({
    where: { id: offerId },
    include: { provider: true },
  });
  if (!offer) throw { status: 404, code: 'OFFER_NOT_FOUND' };

  const myProvider = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!myProvider || offer.providerId !== myProvider.id) {
    throw { status: 403, code: 'FORBIDDEN', message: 'Você não é o dono desta oferta' };
  }

  // resolve categoria (se enviada)
  let categoryId = data.categoryId ?? offer.categoryId;
  if (!data.categoryId && data.categorySlug) {
    const cat = await prisma.serviceCategory.findUnique({ where: { slug: data.categorySlug } });
    if (!cat) throw { status: 400, code: 'CATEGORY_NOT_FOUND' };
    categoryId = cat.id;
  }

  const updated = await prisma.serviceOffer.update({
    where: { id: offerId },
    data: {
      categoryId,
      title: data.title ?? offer.title,
      description: data.description ?? offer.description,
      priceBase:
        data.priceBase != null
          ? new Prisma.Decimal(Number(data.priceBase).toFixed(2))
          : offer.priceBase,
      unit: (data.unit as Unit) ?? offer.unit,
      active: data.active ?? offer.active,
    },
  });

  return updated;
}

export async function remove(userId: string, offerId: string) {
  const offer = await prisma.serviceOffer.findUnique({
    where: { id: offerId },
    include: { provider: true },
  });
  if (!offer) throw { status: 404, code: 'OFFER_NOT_FOUND' };

  const myProvider = await prisma.providerProfile.findUnique({ where: { userId } });
  if (!myProvider || offer.providerId !== myProvider.id) {
    throw { status: 403, code: 'FORBIDDEN' };
  }

  // bloqueia se houver job ativo com essa oferta
  const activeJob = await prisma.job.findFirst({
    where: {
      offerId,
      status: { in: [JobStatus.pending, JobStatus.accepted, JobStatus.in_progress] },
    },
    select: { id: true },
  });
  if (activeJob) {
    throw {
      status: 400,
      code: 'OFFER_IN_USE',
      message: 'Existe um job ativo vinculado a esta oferta.',
    };
  }

  await prisma.serviceOffer.delete({ where: { id: offerId } });
  return { deleted: true };
}
