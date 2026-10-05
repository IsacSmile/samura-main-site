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

/**
 * Local file system storage provider.
 * Saves to public/uploads directory and serves directly via Next.js static assets.
 */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

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

    await this.ensureDir();

    // 3. Sanitize and rename file
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
 * Cloudinary Storage Provider (Ready to plug credentials into .env)
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
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      // Fallback to local if Cloudinary credentials are not present
      console.warn("Cloudinary credentials missing, falling back to local storage.");
      const local = new LocalStorageProvider();
      return local.upload(file, filename, mimeType);
    }

    const formData = new FormData();
    formData.append("file", new Blob([file as unknown as BlobPart], { type: mimeType }));
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

// Select provider based on configuration
export const storage: StorageProvider =
  process.env.STORAGE_PROVIDER === "cloudinary"
    ? new CloudinaryStorageProvider()
    : new LocalStorageProvider();

export async function uploadImageFile(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return storage.upload(buffer, file.name, file.type);
}
