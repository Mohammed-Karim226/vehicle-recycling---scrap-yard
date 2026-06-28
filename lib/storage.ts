"use server";

import { getSupabaseClient } from "./supabase";
import { isSupabaseConfigured } from "./env";

const BUCKET_NAME = "vehicle-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Image storage is not configured on this deployment.");
  }
  return getSupabaseClient();
}

export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum limit of 10MB");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed");
  }

  const supabase = requireSupabase();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
  const supabase = requireSupabase();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

function getPublicUrl(filePath: string): string {
  const supabase = requireSupabase();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}
