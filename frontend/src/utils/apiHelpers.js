import api from "../api/axios";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB limit
export const CHUNK_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB per chunk (well below Vercel's 4.5 MB body limit)

export const validateFileSize = (fileOrFiles) => {
  if (!fileOrFiles) return null;

  if (Array.isArray(fileOrFiles) || fileOrFiles instanceof FileList) {
    const files = Array.from(fileOrFiles);
    let totalSize = 0;
    for (const f of files) {
      if (f && f.size > MAX_FILE_SIZE_BYTES) {
        return `File "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 20 MB limit. Please choose a smaller file.`;
      }
      if (f) totalSize += f.size;
    }
    if (totalSize > MAX_FILE_SIZE_BYTES) {
      return `Total upload size (${(totalSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 20 MB limit. Please select fewer or smaller files.`;
    }
  } else if (fileOrFiles instanceof File) {
    if (fileOrFiles.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${(fileOrFiles.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 20 MB limit. Please upload a file under 20 MB.`;
    }
  }

  return null;
};

export const formatErrorMessage = (err, defaultMsg = "Processing failed. Please check your input and try again.") => {
  if (!err) return defaultMsg;

  // Handle 413 Payload Too Large
  if (err.response?.status === 413 || (err.message && err.message.includes("413"))) {
    return "File size exceeds server payload limits. Multi-part chunking will handle files up to 20 MB.";
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

// Upload a single file in chunks to /api/upload-chunk/
export const uploadFileInChunks = async (file, onProgress = null) => {
  const uploadId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE_BYTES);

  let assembledFilePath = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE_BYTES;
    const end = Math.min(file.size, start + CHUNK_SIZE_BYTES);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append("upload_id", uploadId);
    formData.append("chunk_index", chunkIndex);
    formData.append("total_chunks", totalChunks);
    formData.append("filename", file.name);
    formData.append("chunk", chunkBlob, file.name);

    const res = await api.post("upload-chunk/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (onProgress) {
      const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
      onProgress(percent, `Uploading "${file.name}" chunk ${chunkIndex + 1}/${totalChunks}...`);
    }

    if (res.data.status === "complete" && res.data.file_path) {
      assembledFilePath = res.data.file_path;
    }
  }

  if (!assembledFilePath) {
    throw new Error(`Failed to complete chunked upload for ${file.name}`);
  }

  return assembledFilePath;
};

// Universal smart API caller: chunks automatically whenever payload > 3MB
export const executeApiCall = async (endpoint, fileOrFiles, extraParams = {}, onProgress = null) => {
  const isArray = Array.isArray(fileOrFiles) || fileOrFiles instanceof FileList;
  const filesList = isArray ? Array.from(fileOrFiles).filter(Boolean) : [fileOrFiles].filter(Boolean);

  let totalSizeBytes = 0;
  for (const f of filesList) {
    totalSizeBytes += f.size;
  }

  // If any single file > 3MB or total size > 3MB, use chunked upload
  const needsChunking = totalSizeBytes > CHUNK_SIZE_BYTES || filesList.some(f => f.size > CHUNK_SIZE_BYTES);

  if (needsChunking) {
    const uploadedPaths = [];
    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i];
      const path = await uploadFileInChunks(f, (pct, statusText) => {
        if (onProgress) {
          const overallPct = Math.round(((i + pct / 100) / filesList.length) * 75);
          onProgress(overallPct, statusText);
        }
      });
      uploadedPaths.push(path);
    }

    if (onProgress) {
      onProgress(85, "Processing file(s) on conversion engine...");
    }

    if (isArray) {
      return await api.post(endpoint, { file_paths: uploadedPaths, ...extraParams });
    } else {
      return await api.post(endpoint, { file_path: uploadedPaths[0], ...extraParams });
    }
  } else {
    // Direct upload for small files under 3MB
    if (onProgress) {
      onProgress(30, "Uploading file(s)...");
    }
    const formData = new FormData();
    if (isArray) {
      filesList.forEach(f => formData.append("files", f));
    } else {
      formData.append("file", filesList[0]);
    }
    for (const key in extraParams) {
      if (extraParams[key] !== undefined && extraParams[key] !== null) {
        formData.append(key, extraParams[key]);
      }
    }

    if (onProgress) {
      onProgress(60, "Processing file(s) on engine...");
    }

    return await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
};
