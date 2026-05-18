import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

type EscrowContext = {
  pemasaranId: string;
  userId: string;
  bidHash: string;
};

type EscrowPayload = {
  amount: number;
  salt: string;
};

const ESCROW_VERSION = "v1";

function getEscrowSecret() {
  const secret =
    process.env.VICKREY_ESCROW_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("VICKREY_ESCROW_SECRET wajib diatur untuk membuka escrow Vickrey.");
  }

  return "dev-only-vickrey-escrow-secret";
}

function getEscrowKey() {
  return createHash("sha256").update(getEscrowSecret()).digest();
}

function getAad(context: EscrowContext) {
  return Buffer.from(`${context.pemasaranId}:${context.userId}:${context.bidHash}`, "utf8");
}

export function encryptVickreyBidPayload(payload: EscrowPayload, context: EscrowContext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEscrowKey(), iv);
  cipher.setAAD(getAad(context));

  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    ESCROW_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(":");
}

export function decryptVickreyBidPayload(value: string, context: EscrowContext): EscrowPayload {
  const [version, ivRaw, tagRaw, encryptedRaw] = value.split(":");

  if (version !== ESCROW_VERSION || !ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Payload escrow bid tidak valid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEscrowKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAAD(getAad(context));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final()
  ]);
  const payload = JSON.parse(decrypted.toString("utf8")) as EscrowPayload;

  if (!Number.isFinite(payload.amount) || payload.amount <= 0 || typeof payload.salt !== "string" || !payload.salt) {
    throw new Error("Isi escrow bid tidak valid.");
  }

  return payload;
}
