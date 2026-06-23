const NON_DIGIT_PATTERN = /\D/g;

export function getPhoneNumberDigits(phoneNumber: string) {
  return phoneNumber.replace(NON_DIGIT_PATTERN, "");
}

export function getIndonesianPhoneNumberVariants(phoneNumber: string) {
  const digits = getPhoneNumberDigits(phoneNumber);

  if (!digits) {
    return [];
  }

  const variants = new Set<string>([digits]);

  if (digits.startsWith("0")) {
    variants.add(`62${digits.slice(1)}`);
  } else if (digits.startsWith("62")) {
    variants.add(`0${digits.slice(2)}`);
  }

  return [...variants];
}
