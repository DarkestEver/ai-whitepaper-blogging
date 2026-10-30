import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { FeatureUnavailableError, RequestValidationError } from "@/lib/admin-http";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_PDF_BYTES = 20 * 1024 * 1024;
const MEDIA_DIRECTORY = path.join(process.cwd(), ".data", "media");
const SOURCE_DIRECTORY = path.join(process.cwd(), ".data", "sources");
const DOWNLOAD_DIRECTORY = path.join(process.cwd(), ".data", "downloads");

type SupportedImage = {
  extension: "jpg" | "png" | "webp";
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

function identifyImage(bytes: Buffer): SupportedImage | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return undefined;
}

function assetPath(asset: string): string | undefined {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/.test(asset)) {
    return undefined;
  }
  return path.join(MEDIA_DIRECTORY, asset);
}

function sourcePath(asset: string): string | undefined {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/.test(asset)) {
    return undefined;
  }
  return path.join(SOURCE_DIRECTORY, asset);
}

function downloadPath(asset: string): string | undefined {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$/.test(asset)) return undefined;
  return path.join(DOWNLOAD_DIRECTORY, asset);
}

export async function saveDownloadPdf(file: File): Promise<string> {
  if (process.env.NODE_ENV === "production") throw new FeatureUnavailableError("Local downloadable PDFs are disabled in production until approved private object storage and malware scanning are configured.");
  if (file.size < 5 || file.size > MAX_SOURCE_PDF_BYTES) throw new RequestValidationError("Download PDF must be between 5 bytes and 20 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") throw new RequestValidationError("Uploaded download does not have a valid PDF signature.");
  await mkdir(DOWNLOAD_DIRECTORY, { recursive: true });
  const asset = `${randomUUID()}.pdf`;
  await writeFile(path.join(DOWNLOAD_DIRECTORY, asset), bytes, { flag: "wx", mode: 0o600 });
  return `/api/admin/download-files/${asset}`;
}

export async function readDownloadPdf(asset: string): Promise<Buffer | undefined> {
  const filePath = downloadPath(asset);
  if (!filePath) return undefined;
  try { const bytes = await readFile(filePath); return bytes.subarray(0, 5).toString("ascii") === "%PDF-" ? bytes : undefined; }
  catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined; throw error; }
}

export async function removeDownloadPdf(url: string): Promise<void> {
  const asset = url.startsWith("/api/admin/download-files/") ? url.slice("/api/admin/download-files/".length) : "";
  const filePath = downloadPath(asset);
  if (!filePath) return;
  try { await unlink(filePath); } catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
}

export async function saveCoverImage(file: File): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new FeatureUnavailableError("Local image uploads are disabled in production until approved object storage is configured.");
  }
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    throw new RequestValidationError("Cover image must be smaller than 5 MB.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = identifyImage(bytes);
  if (!image) {
    throw new RequestValidationError("Unsupported image content. Upload a valid JPEG, PNG, or WebP image.");
  }

  await mkdir(MEDIA_DIRECTORY, { recursive: true });
  const asset = `${randomUUID()}.${image.extension}`;
  await writeFile(path.join(MEDIA_DIRECTORY, asset), bytes, { flag: "wx", mode: 0o600 });
  return `/api/media/${asset}`;
}

export async function readCoverImage(asset: string): Promise<{ bytes: Buffer; contentType: string } | undefined> {
  const filePath = assetPath(asset);
  if (!filePath) return undefined;
  try {
    const bytes = await readFile(filePath);
    const image = identifyImage(bytes);
    return image ? { bytes, contentType: image.contentType } : undefined;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function removeCoverImage(url: string): Promise<void> {
  const asset = url.startsWith("/api/media/") ? url.slice("/api/media/".length) : "";
  const filePath = assetPath(asset);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}

export async function saveSourcePdf(file: File): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new FeatureUnavailableError("Local source PDF uploads are disabled in production until approved private object storage and malware scanning are configured.");
  }
  if (file.size < 5 || file.size > MAX_SOURCE_PDF_BYTES) {
    throw new RequestValidationError("Source PDF must be between 5 bytes and 20 MB.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new RequestValidationError("Uploaded source does not have a valid PDF signature.");
  }
  await mkdir(SOURCE_DIRECTORY, { recursive: true });
  const asset = `${randomUUID()}.pdf`;
  await writeFile(path.join(SOURCE_DIRECTORY, asset), bytes, { flag: "wx", mode: 0o600 });
  return `/api/admin/source-files/${asset}`;
}

export async function readSourcePdf(asset: string): Promise<Buffer | undefined> {
  const filePath = sourcePath(asset);
  if (!filePath) return undefined;
  try {
    const bytes = await readFile(filePath);
    return bytes.subarray(0, 5).toString("ascii") === "%PDF-" ? bytes : undefined;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function removeSourcePdf(url: string): Promise<void> {
  const asset = url.startsWith("/api/admin/source-files/") ? url.slice("/api/admin/source-files/".length) : "";
  const filePath = sourcePath(asset);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
}
