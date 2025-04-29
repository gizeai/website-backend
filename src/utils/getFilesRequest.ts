import { Request } from "express";

export default function getFilesRequest(req: Request) {
  const files = req.files;

  if (files) {
    if (Array.isArray(files)) {
      return files;
    } else {
      return Object.values(files).flat();
    }
  }

  if (req.file) {
    return [req.file];
  }

  return undefined;
}
