"use server";

import { getSupabaseClient } from "./supabase";
import { isSupabaseConfigured } from "./env";
import { requireAdmin } from "./auth/adminSession";
import { randomUUID } from "crypto";
import { enforceRateLimit } from "./security/rateLimit";

const BUCKET_NAME = "vehicle-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type SupportedImageMimeType = (typeof ALLOWED_MIME_TYPES)[number];

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Image storage is not configured on this deployment.");
  }
  return getSupabaseClient();
}

export async function uploadImage(file: File): Promise<string> {
  await requireAdmin();
  await enforceRateLimit("image-upload", 20, 60 * 60);
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum limit of 5MB");
  }

  if (!isSupportedImageMimeType(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed");
  }

  const detectedType = detectImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!detectedType || detectedType !== file.type) {
    throw new Error("File content does not match the declared image type");
  }

  const supabase = requireSupabase();
  const fileExt = detectedType === "image/jpeg" ? "jpg" : detectedType.split("/")[1];
  const fileName = `${randomUUID()}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return getPublicUrl(filePath);
}

export async function deleteImage(filePath: string): Promise<void> {
  await requireAdmin();
  await enforceRateLimit("image-delete", 50, 60 * 60);
  if (!/^public\/[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/.test(filePath)) {
    throw new Error("Invalid image path");
  }
  const supabase = requireSupabase();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

function isSupportedImageMimeType(value: string): value is SupportedImageMimeType {
  return ALLOWED_MIME_TYPES.some((mimeType) => mimeType === value);
}

function detectImageType(bytes: Uint8Array): SupportedImageMimeType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return "image/png";
  const ascii = String.fromCharCode(...bytes);
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "image/gif";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

function getPublicUrl(filePath: string): string {
  const supabase = requireSupabase();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}
