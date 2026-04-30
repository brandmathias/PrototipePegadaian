export type AuctionMode = "fixed_price" | "vickrey";

export type Lot = {
  id: string;
  code: string;
  name: string;
  category: string;
  mode: AuctionMode;
  price: number;
  location: string;
  unitName: string;
  city: string;
  condition: string;
  status: string;
  description: string;
  countdown?: string;
  endsAt?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankBranch?: string;
  unitAddress?: string;
  specs: Array<{ label: string; value: string }>;
};
