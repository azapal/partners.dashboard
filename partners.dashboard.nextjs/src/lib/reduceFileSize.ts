export const reduceFileSize = async (
  file: File,
  maxSizeMB = 1
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      // For non-image files, just check size
      if (file.size / 1024 / 1024 > maxSizeMB) {
        reject(new Error("File is too large"));
      } else {
        resolve(file);
      }
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        // Set new width & height (reduce by 50% for better compression)
        const scaleFactor = Math.sqrt((maxSizeMB * 1024 * 1024) / file.size);
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert back to Blob (JPEG for better compression)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          0.7 // 70% quality
        );
      };
    };

    reader.onerror = (error) => reject(error);
  });
};
