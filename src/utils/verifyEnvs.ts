const envs = [
  "NODE_ENV",
  "DOMAIN",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_USER",
  "POSTGRES_DB",
  "POSTGRES_PASSWORD",
  "DATABASE_URL",
  "EXPRESS_PORT",
  "JWT_SECRET",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_SECURE",
  "EMAIL_FROM",
  "STRIPE_API_KEY",
  "STRIPE_SUCCESS_CALLBACK",
  "STRIPE_FAILURE_CALLBACK",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_SECRET_KEY",
  "MERCADO_PAGO_SUCCESS_CALLBACK",
  "MERCADO_PAGO_PENDING_CALLBACK",
  "MERCADO_PAGO_FAILURE_CALLBACK",
  "OPENAI_API_KEYS",
  "MAX_QUEUE_PROCCESSING",
  "REDIS_HOST",
  "REDIS_PORT",
  "REDIS_PASSWORD",
  "REDIS_TLS",
  "SUPABASE_ENDPOINT",
  "SUPABASE_SECRET_KEY",
];

const notfound: string[] = [];

for (const env of envs) {
  if (!process.env[env]) {
    notfound.push(env);
  }
}

if (notfound.length > 0) {
  throw new Error(`As seguintes variáveis de ambiente não foram definidas: ${notfound.join(", ")}`);
}
