import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { unitAccounts, units } from "@/lib/db/schema";
import { serializeUnitAccount } from "@/lib/superadmin/serializers";
import { validateUnitAccountPayload } from "@/lib/superadmin/validation";

export function activateAccountSelection<T extends { id: string; isActive: boolean }>(
  accounts: T[],
  targetId: string
) {
  return accounts.map((account) => ({
    ...account,
    isActive: account.id === targetId
  }));
}

async function ensureUnitExists(unitId: string) {
  const [unit] = await db.select().from(units).where(eq(units.id, unitId)).limit(1);

  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  return unit;
}

export async function listUnitAccounts(unitId: string) {
  await ensureUnitExists(unitId);

  const accounts = await db
    .select()
    .from(unitAccounts)
    .where(eq(unitAccounts.unitId, unitId))
    .orderBy(desc(unitAccounts.isActive), desc(unitAccounts.createdAt));

  return accounts.map(serializeUnitAccount);
}

export async function createUnitAccount(
  unitId: string,
  input: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchName?: string;
    isActive?: boolean;
  }
) {
  await ensureUnitExists(unitId);
  const payload = validateUnitAccountPayload(input);

  await db.transaction(async (tx) => {
    if (payload.isActive) {
      await tx
        .update(unitAccounts)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(unitAccounts.unitId, unitId));
    }

    await tx.insert(unitAccounts).values({
      id: crypto.randomUUID(),
      unitId,
      bankName: payload.bankName,
      accountNumber: payload.accountNumber,
      accountHolderName: payload.accountHolderName,
      branchName: payload.branchName,
      isActive: payload.isActive
    });
  });

  return listUnitAccounts(unitId);
}

export async function updateUnitAccount(
  unitId: string,
  accountId: string,
  input: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchName?: string;
    isActive?: boolean;
  }
) {
  await ensureUnitExists(unitId);
  const payload = validateUnitAccountPayload(input);

  const [account] = await db
    .select()
    .from(unitAccounts)
    .where(and(eq(unitAccounts.id, accountId), eq(unitAccounts.unitId, unitId)))
    .limit(1);

  if (!account) {
    throw new Error("Rekening unit belum ditemukan.");
  }

  await db.transaction(async (tx) => {
    if (payload.isActive) {
      await tx
        .update(unitAccounts)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(unitAccounts.unitId, unitId));
    }

    await tx
      .update(unitAccounts)
      .set({
        bankName: payload.bankName,
        accountNumber: payload.accountNumber,
        accountHolderName: payload.accountHolderName,
        branchName: payload.branchName,
        isActive: payload.isActive,
        updatedAt: new Date()
      })
      .where(eq(unitAccounts.id, accountId));
  });

  return listUnitAccounts(unitId);
}
