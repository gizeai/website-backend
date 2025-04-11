import { z } from "zod";

const zodpressets = {
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/(?=.*[A-Z])/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/(?=.*[a-z])/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/(?=.*\d)/, "A senha deve conter pelo menos um número"),
  email: z
    .string()
    .email("E-mail inválido")
    .transform((email) => email.trim().toLowerCase()),
};

export default zodpressets;
