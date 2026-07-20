import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import {
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber
} from "@/lib/auth/buyer-auth-validation";
import { ensureBuyerRegistrationIdentityIsAvailable } from "@/lib/auth/buyer-registration-guard";
import { getLevelThreeLoginSuspensionMessage } from "@/lib/auth/login-suspension";
import { getIndonesianPhoneNumberVariants } from "@/lib/phone-number";

export const auth = betterAuth({
  appName: "Ruang Agunan",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true
  }),
  plugins: [nextCookies()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        try {
          await ensureBuyerRegistrationIdentityIsAvailable(ctx.body ?? {}, {
            async findExistingIdentity(identity) {
              const phoneVariants = getIndonesianPhoneNumberVariants(identity.phoneNumber);
              const [existingUser] = await db
                .select({ id: schema.users.id })
                .from(schema.users)
                .where(
                  or(
                    eq(schema.users.email, identity.email),
                    and(eq(schema.users.role, "buyer"), inArray(schema.users.phoneNumber, phoneVariants)),
                    and(eq(schema.users.role, "buyer"), eq(schema.users.nationalId, identity.nationalId))
                  )
                )
                .limit(1);

              return Boolean(existingUser);
            },
            async findActiveBlacklistByNationalId(nationalId) {
              const [activeBlacklist] = await db
                .select({ id: schema.blacklists.id })
                .from(schema.blacklists)
                .innerJoin(schema.users, eq(schema.users.id, schema.blacklists.userId))
                .where(
                  and(
                    eq(schema.blacklists.isActive, true),
                    or(isNull(schema.blacklists.blockedUntil), gt(schema.blacklists.blockedUntil, new Date())),
                    or(eq(schema.blacklists.nationalId, nationalId), eq(schema.users.nationalId, nationalId))
                  )
                )
                .limit(1);

              return Boolean(activeBlacklist);
            }
          });
        } catch (error) {
          throw new APIError("BAD_REQUEST", {
            message: error instanceof Error ? error.message : "Data registrasi pembeli belum valid."
          });
        }

        return;
      }

      if (ctx.path === "/sign-in/email") {
        const email = String(ctx.body?.email ?? "")
          .trim()
          .toLowerCase();

        if (!email) {
          return;
        }

        const [existingUser] = await db
          .select({
            id: schema.users.id,
            isActive: schema.users.isActive
          })
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);

        if (existingUser && existingUser.isActive === false) {
          const [activeBlacklist] = await db
            .select({
              blockedUntil: schema.blacklists.blockedUntil,
              isActive: schema.blacklists.isActive,
              totalViolations: schema.blacklists.totalViolations
            })
            .from(schema.blacklists)
            .where(and(eq(schema.blacklists.userId, existingUser.id), eq(schema.blacklists.isActive, true)))
            .limit(1);
          const violationRows = activeBlacklist
            ? await db
                .select({
                  createdAt: schema.pelanggaranUser.createdAt,
                  escalationEligible: schema.pelanggaranUser.escalationEligible,
                  paymentDeadline: schema.transaksi.paymentDeadline
                })
                .from(schema.pelanggaranUser)
                .leftJoin(schema.transaksi, eq(schema.transaksi.id, schema.pelanggaranUser.transaksiId))
                .where(eq(schema.pelanggaranUser.userId, existingUser.id))
                .orderBy(desc(schema.pelanggaranUser.createdAt))
            : [];
          const suspensionMessage = getLevelThreeLoginSuspensionMessage({
            blacklist: activeBlacklist ?? null,
            traces: violationRows.map((row) => ({
              createdAt: row.paymentDeadline ?? row.createdAt,
              escalationEligible: row.escalationEligible,
              occurredAt: row.paymentDeadline ?? row.createdAt
            }))
          });

          throw new APIError("FORBIDDEN", {
            message:
              suspensionMessage ??
              "Akun ini sudah dinonaktifkan. Hubungi super admin untuk bantuan akses."
          });
        }
      }
    })
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
        returned: true
      },
      phoneNumber: {
        type: "string",
        required: false,
        returned: true
      },
      nationalId: {
        type: "string",
        required: false,
        returned: false
      },
      unitId: {
        type: "string",
        required: false,
        input: false,
        returned: true
      },
      isActive: {
        type: "boolean",
        required: false,
        input: false,
        returned: true
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const role = typeof user.role === "string" ? user.role : "buyer";
          try {
            return {
              data: {
                ...user,
                role,
                isActive: typeof user.isActive === "boolean" ? user.isActive : true,
                phoneNumber:
                  role === "buyer"
                    ? normalizeBuyerPhoneNumber(String(user.phoneNumber ?? ""))
                    : user.phoneNumber ?? null,
                nationalId:
                  role === "buyer"
                    ? normalizeBuyerNationalId(String(user.nationalId ?? ""))
                    : user.nationalId ?? null
              }
            };
          } catch (error) {
            throw new APIError("BAD_REQUEST", {
              message:
                error instanceof Error ? error.message : "Data registrasi pembeli belum valid."
            });
          }
        },
        async after(user) {
          if (user.role !== "buyer") {
            return;
          }

          await db.insert(schema.buyerProfiles).values({
            id: crypto.randomUUID(),
            userId: user.id,
            fullName: user.name,
            email: user.email,
            phoneNumber: String(user.phoneNumber ?? ""),
            nationalId: String(user.nationalId ?? ""),
            status: "active"
          });
        }
      }
    }
  }
});
