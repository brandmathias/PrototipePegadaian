import { createHash } from "node:crypto";

type BidIntegrityInput = {
  pemasaranId: string;
  userId: string;
  amount: string | number;
  salt: string;
};

function normalizeBidAmount(amount: string | number) {
  return String(Number(amount));
}

export function createBidIntegrityHash(input: BidIntegrityInput) {
  return createHash("sha256")
    .update(`${input.pemasaranId}:${input.userId}:${normalizeBidAmount(input.amount)}:${input.salt}`)
    .digest("hex");
}

export function verifyBidIntegrityHash(input: BidIntegrityInput & { bidHash: string }) {
  const computedHash = createBidIntegrityHash(input);

  return {
    computedHash,
    isMatch: computedHash === input.bidHash
  };
}
