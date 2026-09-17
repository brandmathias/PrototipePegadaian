export type FixedPriceAvailabilityStatus = "available" | "reserved" | "sold";
export type FixedPriceReservationOwner = "self" | "other" | null;

export type FixedPriceAvailability = {
  status: FixedPriceAvailabilityStatus;
  owner: FixedPriceReservationOwner;
  expiresAt: string | null;
  canContinue?: boolean;
  buyerActiveInvoice?: {
    transactionId: string;
    expiresAt: string | null;
  } | null;
};

export const DEFAULT_FIXED_PRICE_AVAILABILITY: FixedPriceAvailability = {
  status: "available",
  owner: null,
  expiresAt: null,
  canContinue: false,
  buyerActiveInvoice: null
};
