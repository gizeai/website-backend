import { z } from "zod";
import i18next from "@/utils/i18n";

const zodpressets = {
  password: z
    .string()
    .min(8, i18next.t("validators.password_min_8_caracteres"))
    .regex(/(?=.*[A-Z])/, i18next.t("validators.password_uppercase"))
    .regex(/(?=.*[a-z])/, i18next.t("validators.password_lowercase"))
    .regex(/(?=.*\d)/, i18next.t("validators.password_number")),
  email: z
    .string()
    .email(i18next.t("validators.invalid_email"))
    .transform((email) => email.trim().toLowerCase()),
};

export default zodpressets;
