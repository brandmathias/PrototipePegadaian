import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { and, eq, gt, isNull, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import {
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber
} from "@/lib/auth/buyer-auth-validation";
import { ensureBuyerRegistrationIdentityIsAvailable } from "@/lib/auth/buyer-registration-guard";

export const auth = betterAuth({
  appName: "Pegadaian Lelang",
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
              const [existingUser] = await db
                .select({ id: schema.users.id })
                .from(schema.users)
                .where(
                  or(
                    eq(schema.users.email, identity.email),
                    eq(schema.users.phoneNumber, identity.phoneNumber),
                    eq(schema.users.nationalId, identity.nationalId)
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
          throw new APIError("FORBIDDEN", {
            message: "Akun ini sudah dinonaktifkan. Hubungi super admin untuk bantuan akses."
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
