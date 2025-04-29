import { Upload } from "@prisma/client";
import supabase from "./supabase";
import { buckets } from "@/services/UploadService";

export default function mounthUploadURL(upload: Upload, bucket: buckets) {
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(upload.storedLocation);
  return publicUrl.data.publicUrl;
}
