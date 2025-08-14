import { Prisma, JobStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../../db/client';
import { estimatePrice } from '../../lib/pricing';

export async function createJob(params: {
  customerId: string;
  offerId: string;
  addressId: string;
  datetime: Date;
  notes?: string;
}) {
  // Carrega oferta + provider + address do provider (default) para calcular distância
  const offer = await prisma.serviceOffer.findUnique({
    where: { id: params.offerId },
    include: {
      provider: { include: { user: true } },
      category: true,
    },
  });
  if (!offer || !offer.active) {
    throw { status: 400, code: 'INVALID_OFFER', message: 'Oferta inválida ou inativa' };
  }

  // Address do cliente
  const address = await prisma.address.findUnique({ where: { id: params.addressId } });
  if (!address || address.userId !== params.customerId) {
    throw { status: 403, code: 'ADDRESS_FORBIDDEN', message: 'Endereço não pertence ao cliente' };
  }

  // Address default do prestador (para distância)
  const providerDefaultAddr = await prisma.address.findFirst({
    where: { userId: offer.provider.userId, isDefault: true },
  });

  let distanceKm: number | null = null;
  if (providerDefaultAddr?.lat != null && providerDefaultAddr?.lng != null && address.lat != null && address.lng != null) {
    distanceKm = haversineKm(
      { lat: Number(providerDefaultAddr.lat), lng: Number(providerDefaultAddr.lng) },
      { lat: Number(address.lat),           lng: Number(address.lng) }
    );
  }

  const priceEstimated = estimatePrice({ priceBase: offer.priceBase, distanceKm });

  const job = await prisma.job.create({
    data: {
      customerId: params.customerId,
      addressId: params.addressId,
      categoryId: offer.categoryId,
      offerId: offer.id,
      datetime: params.datetime,
      status: JobStatus.pending,
      paymentStatus: PaymentStatus.hold,
      priceEstimated,
      notes: params.notes,
    },
    include: {
      category: true,
      offer: true,
    },
  });

  return { job, distanceKm };
}

export async function listJobs(params: {
  userId: string;
  role: 'customer' | 'provider';
  status?: JobStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const take = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const skip = (page - 1) * take;

  const where: Prisma.JobWhereInput = {
    ...(params.role === 'customer' ? { customerId: params.userId } : { providerId: params.userId }),
    ...(params.status ? { status: params.status } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip,
      take,
      orderBy: { datetime: 'desc' },
      include: {
        category: true,
        offer: true,
        address: true,
        customer: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { total, page, pageSize: take, items };
}

export async function acceptJob(params: { jobId: string; providerId: string }) {
  const job = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!job) throw { status: 404, code: 'JOB_NOT_FOUND' };
  if (job.status !== JobStatus.pending) {
    throw { status: 400, code: 'INVALID_STATE', message: 'Job não está pendente' };
  }

  const updated = await prisma.job.update({
    where: { id: params.jobId },
    data: {
      status: JobStatus.accepted,
      providerId: params.providerId,
    },
  });

  // Garante uma conversa
  await prisma.conversation.upsert({
    where: { jobId: params.jobId },
    update: {},
    create: { jobId: params.jobId },
  });

  return updated;
}

export async function startJob(params: { jobId: string; providerId: string }) {
  const job = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!job) throw { status: 404, code: 'JOB_NOT_FOUND' };
  if (job.providerId !== params.providerId) throw { status: 403, code: 'FORBIDDEN' };
  if (job.status !== JobStatus.accepted) throw { status: 400, code: 'INVALID_STATE' };

  return prisma.job.update({
    where: { id: params.jobId },
    data: { status: JobStatus.in_progress },
  });
}

export async function finishJob(params: { jobId: string; providerId: string }) {
  const job = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!job) throw { status: 404, code: 'JOB_NOT_FOUND' };
  if (job.providerId !== params.providerId) throw { status: 403, code: 'FORBIDDEN' };
  if (job.status !== JobStatus.in_progress) throw { status: 400, code: 'INVALID_STATE' };

  // MVP: preço final = estimado (pode ajustar depois)
  return prisma.job.update({
    where: { id: params.jobId },
    data: { status: JobStatus.done, priceFinal: job.priceEstimated, paymentStatus: PaymentStatus.captured },
  });
}

export async function cancelJob(params: { jobId: string; userId: string; role: 'customer' | 'provider'; reason?: string }) {
  const job = await prisma.job.findUnique({ where: { id: params.jobId } });
  if (!job) throw { status: 404, code: 'JOB_NOT_FOUND' };

  if (params.role === 'customer' && job.customerId !== params.userId) {
    throw { status: 403, code: 'FORBIDDEN' };
  }
  if (params.role === 'provider' && job.providerId !== params.userId) {
    throw { status: 403, code: 'FORBIDDEN' };
  }

  // Regras simples de estado
  if (![JobStatus.pending, JobStatus.accepted, JobStatus.in_progress].includes(job.status)) {
    throw { status: 400, code: 'INVALID_STATE', message: 'Não é possível cancelar neste estado' };
  }

  // MVP: só marca como canceled (sem refund real ainda)
  return prisma.job.update({
    where: { id: params.jobId },
    data: { status: JobStatus.canceled, notes: job.notes ? `${job.notes}\n[cancel] ${params.reason ?? ''}` : `[cancel] ${params.reason ?? ''}` },
  });
}

// --- util local (Haversine simplificado) ---
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
