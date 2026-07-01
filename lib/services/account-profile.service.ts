import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { buyerProfiles, users } from "@/lib/db/schema";
import { getIndonesianPhoneNumberVariants } from "@/lib/phone-number";

type AccountProfileRole = "admin_unit" | "super_admin";

export type AccountProfileUpdatePayload = {
  name: string;
  email: string;
  phoneNumber: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readRecord(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Payload profil tidak valid.");
  }

  return input as Record<string, unknown>;
}

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function validateAccountProfileUpdatePayload(input: unknown): AccountProfileUpdatePayload {
  const payload = readRecord(input);
  const name = String(payload.name ?? "").trim();
  const email = normalizeEmail(payload.email);
  const phoneNumber = String(payload.phoneNumber ?? payload.phone ?? "").trim();

  if (name.length < 3) {
    throw new Error("Nama akun minimal 3 karakter.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Format email belum valid.");
  }

  return {
    name,
    email,
    phoneNumber
  };
}

function getRoleNotFoundMessage(role: AccountProfileRole) {
  return role === "super_admin" ? "Akun superadmin tidak ditemukan." : "Akun admin unit tidak ditemukan.";
}

export async function updateAccountProfile(userId: string, role: AccountProfileRole, input: unknown) {
  const payload = validateAccountProfileUpdatePayload(input);

  return db.transaction(async (tx) => {
    const [currentUser] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.role, role)))
      .limit(1);

    if (!currentUser) {
      throw new Error(getRoleNotFoundMessage(role));
    }

    const [existingUserEmail] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, payload.email), ne(users.id, userId)))
      .limit(1);

    if (existingUserEmail) {
      throw new Error("Email sudah digunakan akun lain.");
    }

    const [existingBuyerProfileEmail] = await tx
      .select({ userId: buyerProfiles.userId })
      .from(buyerProfiles)
      .where(and(eq(buyerProfiles.email, payload.email), ne(buyerProfiles.userId, userId)))
      .limit(1);

    if (existingBuyerProfileEmail) {
      throw new Error("Email sudah digunakan profil pembeli lain.");
    }

    const phoneVariants = getIndonesianPhoneNumberVariants(payload.phoneNumber);
    if (phoneVariants.length > 0) {
      const [existingUserPhone] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, role), inArray(users.phoneNumber, phoneVariants), ne(users.id, userId)))
        .limit(1);

      if (existingUserPhone) {
        throw new Error("Nomor telepon sudah digunakan akun lain.");
      }
    }

    const emailChanged = currentUser.email !== payload.email;
    const [updated] = await tx
      .update(users)
      .set({
        name: payload.name,
        email: payload.email,
        emailVerified: emailChanged ? false : currentUser.emailVerified,
        phoneNumber: payload.phoneNumber || null,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, userId), eq(users.role, role)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        updatedAt: users.updatedAt
      });

    if (!updated) {
      throw new Error(getRoleNotFoundMessage(role));
    }

    return updated;
  });
}
