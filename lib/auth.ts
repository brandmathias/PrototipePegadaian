import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth, APIError } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import {
  normalizeBuyerNationalId,
  normalizeBuyerPhoneNumber
} from "@/lib/auth/buyer-auth-validation";

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
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          try {
            return {
              data: {
                ...user,
                role: "buyer",
                phoneNumber: normalizeBuyerPhoneNumber(String(user.phoneNumber ?? "")),
                nationalId: normalizeBuyerNationalId(String(user.nationalId ?? ""))
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
