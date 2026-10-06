import fs from "node:fs/promises";
import path from "node:path";

export interface UploadResult {
  url: string;
  key: string;
  sizeBytes?: number;
  mimeType?: string;
}

export interface StorageProvider {
  upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<boolean>;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validates file magic bytes against the declared MIME type.
 * Ensures an attacker cannot bypass validation by renaming a script/binary to .png or .jpg.
 */
export function validateMagicBytes(buffer: Buffer | Uint8Array, mimeType: string): boolean {
  if (!buffer || buffer.byteLength < 12) {
    return false;
  }

  const b = buffer;

  // JPEG: FF D8 FF
  if (mimeType === "image/jpeg") {
    return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mimeType === "image/png") {
    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (mimeType === "image/webp") {
    const isRiff = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
    const isWebp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

/**
 * Local file system storage provider.
 * Saves to public/uploads directory.
 */
export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), "public/uploads");
  }

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<UploadResult> {
    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(
        `Invalid file type "${mimeType}". Only JPG, PNG, and WebP images are allowed.`
      );
    }

    // 2. Validate max file size
    if (file.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size exceeds 2MB limit. (Received ${(file.byteLength / (1024 * 1024)).toFixed(2)} MB)`
      );
    }

    // 3. Verify magic bytes signature
    if (!validateMagicBytes(file, mimeType)) {
      throw new Error(
        "Invalid image signature: file contents do not match declared image format."
      );
    }

    await this.ensureDir();

    // 4. Sanitize and rename file
    const ext = path.extname(filename).toLowerCase() || (mimeType === "image/webp" ? ".webp" : ".png");
    const base = path
      .basename(filename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const uniqueName = `samaura-${base}-${uniqueSuffix}${ext}`;
    const destination = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(destination, Buffer.from(file));

    return {
      url: `/uploads/${uniqueName}`,
      key: uniqueName,
      sizeBytes: file.byteLength,
      mimeType,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const sanitizedKey = path.basename(key);
      const filePath = path.join(this.uploadDir, sanitizedKey);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Cloudinary Storage Provider (Selected when STORAGE_PROVIDER="cloudinary")
 * Cloud storage designed for serverless platforms like Vercel with ephemeral filesystems.
 */
export class CloudinaryStorageProvider implements StorageProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    this.apiKey = process.env.CLOUDINARY_API_KEY || "";
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  }

  async upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<UploadResult> {
    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(
        `Invalid file type "${mimeType}". Only JPG, PNG, and WebP images are allowed.`
      );
    }

    // 2. Validate max file size
    if (file.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File size exceeds 2MB limit. (Received ${(file.byteLength / (1024 * 1024)).toFixed(2)} MB)`
      );
    }

    // 3. Verify magic bytes signature
    if (!validateMagicBytes(file, mimeType)) {
      throw new Error(
        "Invalid image signature: file contents do not match declared image format."
      );
    }

    if (!this.cloudName || !this.apiKey) {
      console.warn("[Storage] Cloudinary credentials missing, falling back to local filesystem storage.");
      const local = new LocalStorageProvider();
      return local.upload(file, filename, mimeType);
    }

    const formData = new FormData();
    formData.append("file", new Blob([file as unknown as BlobPart], { type: mimeType }), filename);
    formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "samaura_uploads");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Cloudinary upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      url: data.secure_url,
      key: data.public_id,
      sizeBytes: data.bytes,
      mimeType,
    };
  }

  async delete(_key: string): Promise<boolean> {
    void _key;
    return true;
  }
}

// Select provider based on environment configuration
export const storage: StorageProvider =
  process.env.STORAGE_PROVIDER === "cloudinary"
    ? new CloudinaryStorageProvider()
    : new LocalStorageProvider();

export async function uploadImageFile(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return storage.upload(buffer, file.name, file.type);
}
