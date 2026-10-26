import crypto from "crypto";

// Cloudinary is used with *signed direct uploads*: the browser uploads the PDF
// straight to Cloudinary using a signature produced here, so the file never
// passes through this server. That matters because the API is hosted on Vercel
// serverless, which rejects request bodies larger than ~4.5 MB.

const MAX_BYTES = 10 * 1024 * 1024; // Cloudinary free plan limit is 10 MB / file
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_FORMATS = ["png", "jpg", "jpeg", "gif", "webp"];
const formatsFor = (kind) => (kind === "image" ? IMAGE_FORMATS.join(",") : "pdf");

const cfg = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = cfg();
  return Boolean(cloudName && apiKey && apiSecret);
};

const sha1 = (text) => crypto.createHash("sha1").update(text).digest("hex");

export const signParams = (params) => {
  const { apiSecret } = cfg();
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1(toSign + apiSecret);
};

export const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "folder";

export const ROOT_FOLDER = process.env.CLOUDINARY_ROOT_FOLDER || "classwave";

export function createUploadSignature(folder, kind = "pdf") {
  const { cloudName, apiKey } = cfg();
  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = formatsFor(kind);
  const params = { allowed_formats: allowedFormats, folder, timestamp };
  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    allowedFormats,
    signature: signParams(params),
    // PDFs are uploaded as the "image" resource type: that is the type
    // Cloudinary documents for PDF delivery and it serves them inline.
    resourceType: "image",
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    maxBytes: kind === "image" ? IMAGE_MAX_BYTES : MAX_BYTES,
  };
}

// The browser tells us what it uploaded; never trust it blindly.
export function validateUploadedFile(file, expectedFolder, kind = "pdf") {
  const { cloudName } = cfg();
  if (!file || typeof file !== "object") {
    throw new Error("File details are missing.");
  }
  const url = file.url || file.secureUrl || file.secure_url;
  const publicId = file.publicId || file.public_id;
  if (!url || !publicId) throw new Error("Uploaded file details are incomplete.");
  if (!String(url).startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
    throw new Error("File URL does not belong to this Cloudinary account.");
  }
  if (!String(publicId).startsWith(`${expectedFolder}/`)) {
    throw new Error("File was not uploaded to the expected folder.");
  }
  const format = String(file.format || (kind === "image" ? "" : "pdf")).toLowerCase();
  const allowed = kind === "image" ? IMAGE_FORMATS : ["pdf"];
  if (!allowed.includes(format)) {
    throw new Error(kind === "image" ? "Only PNG, JPG, GIF or WebP images are allowed." : "Only PDF files are allowed.");
  }
  const limit = kind === "image" ? IMAGE_MAX_BYTES : MAX_BYTES;
  if (file.bytes && Number(file.bytes) > limit) {
    throw new Error(`File is larger than the ${limit / 1024 / 1024} MB limit.`);
  }
  return {
    url: String(url),
    publicId: String(publicId),
    resourceType: "image",
    format,
    bytes: Number(file.bytes) || 0,
    originalName: String(file.originalName || file.original_filename || "document.pdf").slice(0, 150),
  };
}

export async function destroyAsset(publicId, resourceType = "image") {
  if (!cloudinaryConfigured()) return { skipped: true };
  const { cloudName, apiKey } = cfg();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { invalidate: "true", public_id: publicId, timestamp };
  const body = new URLSearchParams({
    ...params,
    api_key: apiKey,
    signature: signParams(params),
  });
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: "POST", body }
  );
  return res.json().catch(() => ({}));
}

// "…/upload/v123/x.pdf" -> "…/upload/fl_attachment:My-Notes/v123/x.pdf"
export const buildDownloadUrl = (url, name) => {
  if (!url) return url;
  const safe =
    String(name || "notes")
      .replace(/[^A-Za-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "notes";
  return url.replace("/upload/", `/upload/fl_attachment:${safe}/`);
};

// Adds the two URLs the UI needs. Works on plain objects or mongoose docs.
export const withFileUrls = (doc, titleKey = "title") => {
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  if (obj.file?.url) {
    obj.file = {
      ...obj.file,
      viewUrl: obj.file.url,
      downloadUrl: buildDownloadUrl(obj.file.url, obj[titleKey]),
    };
  }
  return obj;
};

// Adds a resized thumbnail URL for images ("…/upload/…" -> "…/upload/w_900,c_limit,q_auto,f_auto/…").
export const withImageUrls = (file, width = 900) => {
  if (!file?.url) return file;
  const plain = typeof file.toObject === "function" ? file.toObject() : { ...file };
  return {
    ...plain,
    viewUrl: plain.url,
    thumbUrl: plain.url.replace("/upload/", `/upload/w_${width},c_limit,q_auto,f_auto/`),
  };
};
