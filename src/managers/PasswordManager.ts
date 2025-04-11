export default class PasswordManager {
  public static hashPassword(password: string): string {
    return password;
  }

  public static comparePassword(password: string, hash: string): boolean {
    return password === hash;
  }
}
