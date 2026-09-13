export const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB Vercel limit

export const validateFileSize = (fileOrFiles) => {
  if (!fileOrFiles) return null;

  if (Array.isArray(fileOrFiles) || fileOrFiles instanceof FileList) {
    const files = Array.from(fileOrFiles);
    let totalSize = 0;
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        return `File "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 4.5 MB server limit. Please choose a smaller file.`;
      }
      totalSize += f.size;
    }
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      return `Total upload size (${(totalSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 4.5 MB server limit. Please select fewer or smaller files.`;
    }
  } else if (fileOrFiles instanceof File) {
    if (fileOrFiles.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(fileOrFiles.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 4.5 MB server limit. Please upload a smaller file (under 4.5 MB).`;
    }
  }

  return null;
};

export const formatErrorMessage = (err, defaultMsg = "Processing failed. Please check your input and try again.") => {
  if (!err) return defaultMsg;

  // Handle 413 Payload Too Large (Vercel edge limit)
  if (err.response?.status === 413 || (err.message && err.message.includes("413"))) {
    return "File size exceeds the 4.5 MB Vercel server limit. Please upload a smaller file.";
  }

  // Handle 500 Server Error
  if (err.response?.status === 500) {
    const serverErr = err.response?.data?.error;
    if (typeof serverErr === "string") return serverErr;
    return "Engine error (500): The server encountered an issue processing this file. Try a smaller file or different format.";
  }

  const rawErr = err.response?.data?.error || err.response?.data?.detail || err.response?.data || err.message;

  if (typeof rawErr === "string") {
    if (rawErr.startsWith("<!DOCTYPE") || rawErr.startsWith("<html")) {
      return `Server Error (${err.response?.status || 500}). Please try again later.`;
    }
    return rawErr;
  }

  if (typeof rawErr === "object" && rawErr !== null) {
    if (typeof rawErr.message === "string") return rawErr.message;
    if (typeof rawErr.error === "string") return rawErr.error;
    try {
      return JSON.stringify(rawErr);
    } catch {
      return defaultMsg;
    }
  }

  return defaultMsg;
};

export const getDownloadUrl = (filePath) => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  return filePath.startsWith("/") ? filePath : "/" + filePath;
};
