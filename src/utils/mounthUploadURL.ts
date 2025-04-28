import { Upload } from "@prisma/client";

export default function mounthUploadURL(upload: Upload) {
  return `${process.env.DOMAIN}/api/uploads/${upload.id}`;
}
