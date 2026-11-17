const MAX_EDGE = 1600;
const MAX_SOURCE_BYTES = 24 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function prepareListingPhoto(file) {
  if (!(file instanceof File) || !PHOTO_TYPES.has(file.type)) {
    throw new Error("invalid_photo");
  }
  if (!file.size || file.size > MAX_SOURCE_BYTES) {
    throw new Error("photo_too_large");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("photo_processing_failed"));
      element.src = sourceUrl;
    });
    const longest = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longest) throw new Error("photo_processing_failed");
    const scale = Math.min(1, MAX_EDGE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("photo_processing_failed");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob || blob.type !== "image/jpeg" || !blob.size) {
      throw new Error("photo_processing_failed");
    }
    if (longest <= MAX_EDGE && file.size <= MAX_UPLOAD_BYTES && file.size <= blob.size) {
      return file;
    }
    if (blob.size > MAX_UPLOAD_BYTES) throw new Error("photo_too_large");
    const stem = (file.name || "photo").replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], stem + ".jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
