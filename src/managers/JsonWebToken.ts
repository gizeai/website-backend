import jwt from "jsonwebtoken";

const jwt_secret = process.env.JWT_SECRET as string;

if (!jwt_secret) {
  throw new Error("JWT_SECRET is not defined");
}

export default class JsonWebToken {
  public static signUser(data: { [key: string]: unknown }): string {
    const token = jwt.sign(data, jwt_secret, { expiresIn: "90d" });
    return token;
  }

  public static verifyUser(token: string) {
    try {
      const decoded = jwt.verify(token, jwt_secret);
      return decoded;
    } catch {
      return null;
    }
  }

  public static decodeUser(token: string) {
    try {
      const decoded = jwt.decode(token);
      return decoded;
    } catch {
      return null;
    }
  }
}
