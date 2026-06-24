export const HANDOVER_AUTO_COMPLETE_GRACE_DAYS = 3;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getHandoverAutoCompleteDeadline(uploadedAt?: Date | string | null) {
  if (!uploadedAt) {
    return null;
  }

  const uploadedAtDate = uploadedAt instanceof Date ? uploadedAt : new Date(uploadedAt);
  if (Number.isNaN(uploadedAtDate.getTime())) {
    return null;
  }

  return new Date(uploadedAtDate.getTime() + HANDOVER_AUTO_COMPLETE_GRACE_DAYS * DAY_IN_MS);
}

export function isHandoverAutoCompleteDue(
  input: {
    handoverComplaintAt?: Date | string | null;
    handoverProofUploadedAt?: Date | string | null;
    status?: string | null;
  },
  now = new Date(),
) {
  if (input.status !== "lunas" || input.handoverComplaintAt) {
    return false;
  }

  const deadline = getHandoverAutoCompleteDeadline(input.handoverProofUploadedAt);
  return Boolean(deadline && deadline.getTime() <= now.getTime());
}

