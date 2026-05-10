export const convertFileToBase64 = (file: File, chunkSize = 1024 * 1024) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    let offset = 0;
    let base64String = "";

    reader.onload = (event) => {
      if (event.target?.result) {
        base64String += (event.target.result as string).split(",")[1]; // Remove `data:...;base64,`
      }

      offset += chunkSize;
      if (offset < file.size) {
        readChunk();
      } else {
        resolve(`data:${file.type};base64,${base64String}`);
      }
    };

    reader.onerror = (error) => reject(error);

    function readChunk() {
      const blob = file.slice(offset, offset + chunkSize);
      reader.readAsDataURL(blob);
    }

    readChunk();
  });
};
