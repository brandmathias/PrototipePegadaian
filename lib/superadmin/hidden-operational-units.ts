export const HIDDEN_OPERATIONAL_UNIT_IDS = [
  "8842237d-f5fb-4788-9744-8a48f6eb740d",
  "0e5aba2a-1d55-4870-a88d-f67b2750c34c",
  "f0c291c9-7c8f-4ce5-bdc0-5aeb1caea8ad",
] as const;

export const HIDDEN_OPERATIONAL_UNIT_CODES = [
  "CP-MKS-09",
  "CP-TST-7933",
  "CP-FIN-1776908883473",
] as const;

const hiddenUnitIds = new Set<string>(HIDDEN_OPERATIONAL_UNIT_IDS);
const hiddenUnitCodes = new Set<string>(HIDDEN_OPERATIONAL_UNIT_CODES);

export function isHiddenOperationalUnit(unit: {
  code?: string | null;
  id?: string | null;
}) {
  return Boolean(
    (unit.id && hiddenUnitIds.has(unit.id)) ||
      (unit.code && hiddenUnitCodes.has(unit.code)),
  );
}
