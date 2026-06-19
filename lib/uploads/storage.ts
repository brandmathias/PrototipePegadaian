import path from "node:path";

export const UPLOAD_PUBLIC_PREFIX = "/uploads";

export const UPLOAD_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska"
};

function defaultUploadsRoot() {
  return path.join(process.cwd(), "public", "uploads");
}

function assertSafeSegment(segment: string) {
  if (!segment || segment === "." || segment === ".." || /[\\/]/.test(segment)) {
    throw new Error("Path upload tidak valid.");
  }

  return segment;
}

function assertInsideUploads(filePath: string, root = getUploadsRoot()) {
  const normalizedRoot = path.resolve(root);
  const normalizedPath = path.resolve(filePath);

  if (normalizedPath !== normalizedRoot && !normalizedPath.startsWith(`${normalizedRoot}${path.sep}`)) {
    throw new Error("Path upload berada di luar direktori upload.");
  }

  return normalizedPath;
}

export function getUploadsRoot() {
  const configuredRoot = process.env.UPLOADS_DIR?.trim();
  return path.resolve(configuredRoot || defaultUploadsRoot());
}

export function getUploadDirectory(...segments: string[]) {
  const safeSegments = segments.map(assertSafeSegment);
  return assertInsideUploads(path.resolve(getUploadsRoot(), ...safeSegments));
}

export function getPublicUploadUrl(...segments: string[]) {
  const safeSegments = segments.map(assertSafeSegment);
  return `${UPLOAD_PUBLIC_PREFIX}/${safeSegments.join("/")}`;
}

export function sanitizeUploadFileName(fileName: string, timestamp = Date.now()) {
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${timestamp}-${normalized}`;
}

export function createUploadWriteTarget(subdir: string, fileName: string, timestamp = Date.now()) {
  const storedFileName = sanitizeUploadFileName(fileName, timestamp);
  const directory = getUploadDirectory(subdir);

  return {
    directory,
    fileName: storedFileName,
    filePath: assertInsideUploads(path.join(directory, storedFileName)),
    publicUrl: getPublicUploadUrl(subdir, storedFileName)
  };
}

export function getUploadMimeType(filePath: string) {
  return UPLOAD_MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

export function resolvePublicUploadPath(segments: string[] | undefined) {
  if (!segments?.length) {
    return null;
  }

  let decodedSegments: string[];
  try {
    decodedSegments = segments.map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }

  try {
    const safeSegments = decodedSegments.map(assertSafeSegment);
    const filePath = assertInsideUploads(path.resolve(getUploadsRoot(), ...safeSegments));
    const isAllowedFileType = path.extname(filePath).toLowerCase() in UPLOAD_MIME_TYPES;
    return isAllowedFileType ? filePath : null;
  } catch {
    return null;
  }
}
