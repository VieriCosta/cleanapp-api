import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';

export type AddressPayload = {
  label?: string | null;
  street: string;
  number?: string | null;
  district?: string | null;
  city: string;
  state: string;
  zip: string;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
};

export async function listMine(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function create(userId: string, payload: AddressPayload) {
  return prisma.$transaction(async (tx) => {
    if (payload.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const address = await tx.address.create({
      data: {
        userId,
        label: payload.label ?? null,
        street: payload.street,
        number: payload.number ?? null,
        district: payload.district ?? null,
        city: payload.city,
        state: payload.state,
        zip: payload.zip,
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        isDefault: !!payload.isDefault,
      },
    });
    return address;
  });
}

export async function setDefault(userId: string, addressId: string) {
  return prisma.$transaction(async (tx) => {
    const exists = await tx.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
    if (!exists) throw { status: 404, code: 'ADDRESS_NOT_FOUND' };

    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.update({ where: { id: addressId }, data: { isDefault: true } });

    return { ok: true };
  });
}

export async function remove(userId: string, addressId: string) {
  const res = await prisma.address.deleteMany({ where: { id: addressId, userId } });
  if (res.count === 0) throw { status: 404, code: 'ADDRESS_NOT_FOUND' };
  return { ok: true };
}
