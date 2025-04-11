export const translation = {
  validators: {
    name_min_3_caracteres: "O nome deve ter pelo menos 3 caracteres",
    password_min_8_caracteres: "A senha deve ter pelo menos 8 caracteres",
    password_uppercase: "A senha deve conter pelo menos uma letra maiúscula",
    password_lowercase: "A senha deve conter pelo menos uma letra minúscula",
    password_number: "A senha deve conter pelo menos um número",
    invalid_email: "Esse e-mail é inválido",
    code_min_6_caracteres: "O código deve ter pelo menos 6 caracteres",
  },
  general_erros: {
    internal_server_error: "Ocorreu um erro interno no servidor",
  },
  user: {
    email_exists: "E-mail já cadastrado",
    user_not_found: "Usuário não encontrado",
    invalid_code: "Código de verificação inválido",
    already_verified: "Usuário já verificado",
  },
} as const;
