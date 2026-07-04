import { extractUnitNumber } from "@/lib/locations/indonesia-provinces";

function unitShortName(value: string) {
  return value
    .trim()
    .replace(/^(?:pegadaian\s+)?(?:upc|cp)\s+/i, "")
    .trim();
}

function escaped(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function rewriteSbgUnitNumber(code: string, unitCode: string) {
  const unitNumber = extractUnitNumber(unitCode);
  const match = /^SBG-\d{5}(\d{11})$/.exec(code);

  return unitNumber && match ? `SBG-${unitNumber}${match[1]}` : code;
}

export function syncAdminUnitDisplayName(currentName: string, unitName: string) {
  if (!/^admin\s+(?:unit|upc|cp)\b/i.test(currentName.trim())) {
    return currentName;
  }

  return `Admin Unit ${unitShortName(unitName)}`;
}

export function syncUnitReferenceText(
  value: string,
  previousUnitName: string,
  nextUnitName: string,
) {
  const previousShortName = unitShortName(previousUnitName);
  const nextShortName = unitShortName(nextUnitName);
  const withFullName = value.replace(
    new RegExp(escaped(previousUnitName), "gi"),
    nextUnitName,
  );

  return previousShortName
    ? withFullName.replace(
        new RegExp(`\\b${escaped(previousShortName)}\\b`, "gi"),
        nextShortName,
      )
    : withFullName;
}
