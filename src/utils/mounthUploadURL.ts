import { Upload } from "@prisma/client";

export default function mounthUploadURL(upload: Upload) {
  return `http://localhost:3000/api/uploads/${upload.id}`;
}
