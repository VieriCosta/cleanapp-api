// src/modules/addresses/service.ts
import { Prisma, JobStatus } from '@prisma/client';
import { prisma } from '../../db/client';

export async function listMine(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export type CreateInput = {
  label?: string;
  street: string;
  number?: string;
  district?: string;
  city: string;
  state: string;
  zip: string;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
};

export async function createMine(userId: string, data: CreateInput) {
  // Se for default, remove default dos outros antes (transação)
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const lat =
      data.lat == null ? null : new Prisma.Decimal(Number(data.lat).toFixed(7));
    const lng =
      data.lng == null ? null : new Prisma.Decimal(Number(data.lng).toFixed(7));

    const created = await tx.address.create({
      data: {
        userId,
        label: data.label,
        street: data.street,
        number: data.number,
        district: data.district,
        city: data.city,
        state: data.state,
        zip: data.zip,
        lat,
        lng,
        isDefault: !!data.isDefault,
      },
    });

    return created;
  });
}

export async function setDefaultMine(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const addr = await tx.address.findUnique({ where: { id: addressId } });
    if (!addr || addr.userId !== userId) {
      throw { status: 404, code: 'ADDRESS_NOT_FOUND' };
    }

    // Remove default dos outros e aplica neste
    await tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const updated = await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    return updated;
  });
}

export async function deleteMine(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const addr = await tx.address.findUnique({ where: { id: addressId } });
    if (!addr || addr.userId !== userId) {
      throw { status: 404, code: 'ADDRESS_NOT_FOUND' };
    }

    // Bloqueia remoção se houver job ativo com esse endereço
    const activeJob = await tx.job.findFirst({
      where: {
        addressId,
        status: { in: [JobStatus.pending, JobStatus.accepted, JobStatus.in_progress] },
      },
      select: { id: true },
    });
    if (activeJob) {
      throw {
        status: 400,
        code: 'ADDRESS_IN_USE',
        message: 'Endereço está vinculado a um job ativo (pending/accepted/in_progress).',
      };
    }

    // Deletar
    await tx.address.delete({ where: { id: addressId } });

    // Se era default, e existir outro, define automaticamente um como default
    if (addr.isDefault) {
      const another = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (another) {
        await tx.address.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    return { deleted: true };
  });
}
