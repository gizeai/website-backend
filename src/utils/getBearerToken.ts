import { Request } from "express";

export default function getBearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
}
