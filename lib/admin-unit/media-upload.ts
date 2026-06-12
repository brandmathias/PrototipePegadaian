import { ADMIN_BARANG_MEDIA_LIMIT } from "@/lib/admin-unit/validation";
import { saveUserUploadFile } from "@/lib/storage/user-upload-storage";

export async function saveAdminBarangMediaFiles(files: File[]) {
  if (files.length > ADMIN_BARANG_MEDIA_LIMIT) {
    throw new Error(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);
  }

  const invalidFile = files.find((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
  if (invalidFile) {
    throw new Error("Media hanya boleh berupa foto atau video.");
  }

  return Promise.all(
    files.map(async (file, index) => {
      const savedFile = await saveUserUploadFile({
        file,
        folder: "barang"
      });

      return {
        type: file.type.startsWith("video/") ? "video" : "foto",
        url: savedFile.url,
        fileName: file.name,
        sizeBytes: file.size,
        sortOrder: index
      };
    })
  );
}
