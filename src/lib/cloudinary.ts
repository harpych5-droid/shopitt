/**
 * Cloudinary unsigned upload helper.
 *
 * SECURITY: only cloud_name + upload_preset are used from the browser.
 * The API_SECRET must NEVER be shipped to the client — if signed uploads
 * are ever needed, they must go through an edge function.
 */

export const CLOUDINARY_CLOUD_NAME = "ddyzz3hho";
export const CLOUDINARY_UPLOAD_PRESET = "shopitt_preset";

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video" | "raw" | "auto";
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  format: string;
};

export async function uploadToCloudinary(
  file: File | Blob,
  opts: { resourceType?: "image" | "video" | "auto"; folder?: string } = {},
): Promise<CloudinaryUploadResult> {
  const resourceType = opts.resourceType ?? "auto";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  if (opts.folder) form.append("folder", opts.folder);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }
  return (await res.json()) as CloudinaryUploadResult;
}

export async function uploadManyToCloudinary(
  files: (File | Blob)[],
  opts: { resourceType?: "image" | "video" | "auto"; folder?: string } = {},
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(files.map((f) => uploadToCloudinary(f, opts)));
}
