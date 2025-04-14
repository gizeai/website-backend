import { Upload } from "@prisma/client";

export default function mounthUploadURL(upload: Upload) {
  const id = upload.id;

  return `http://localhost:3000/api/uploads/${id}`;
}
