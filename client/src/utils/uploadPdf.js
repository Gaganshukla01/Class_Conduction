import axios from "axios";

const backend_url = import.meta.env.VITE_BACKEND_URI;
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // Cloudinary free plan limit
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const formatBytes = (b = 0) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export function validatePdf(file) {
  if (!file) return "Choose a PDF file first.";
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) return "Only PDF files are allowed.";
  if (file.size > MAX_PDF_BYTES) return `File is ${formatBytes(file.size)}. The limit is 10 MB.`;
  return null;
}

export function validateImage(file) {
  if (!file) return "Choose an image first.";
  const okType = /^image\/(png|jpe?g|gif|webp)$/i.test(file.type) || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
  if (!okType) return "Only PNG, JPG, GIF or WebP images are allowed.";
  if (file.size > MAX_IMAGE_BYTES) return `Image is ${formatBytes(file.size)}. The limit is 5 MB.`;
  return null;
}

// Uploads straight from the browser to Cloudinary using a signature from our
// API (the file never goes through the server). Returns the file descriptor
// the API expects.
async function uploadToCloudinary({ file, purpose, folderId, onProgress }) {
  let sign;
  try {
    const { data } = await axios.post(`${backend_url}/api/upload/sign`, { purpose, folderId });
    sign = data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Could not prepare the upload.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", sign.timestamp);
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  form.append("allowed_formats", sign.allowedFormats);

  return new Promise((resolve, reject) => {
    // XHR (not axios): axios.defaults.withCredentials would send our cookies
    // to Cloudinary and the browser would block the CORS response.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", sign.uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let res = {};
      try { res = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          url: res.secure_url,
          publicId: res.public_id,
          bytes: res.bytes,
          format: res.format,
          resourceType: res.resource_type,
          originalName: file.name,
        });
      } else {
        reject(new Error(res.error?.message || `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(form);
  });
}

export async function uploadPdf({ file, purpose, folderId, onProgress }) {
  const problem = validatePdf(file);
  if (problem) throw new Error(problem);
  return uploadToCloudinary({ file, purpose, folderId, onProgress });
}

// purpose: "question-image" (admin) | "solution-image" (student)
export async function uploadImage({ file, purpose, onProgress }) {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  return uploadToCloudinary({ file, purpose, onProgress });
}
