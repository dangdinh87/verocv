export type CloudflareD1PreparedStatement = {
  bind: (...values: unknown[]) => CloudflareD1PreparedStatement
  all: <T = Record<string, unknown>>() => Promise<{ results: T[]; success: boolean }>
  first: <T = Record<string, unknown>>() => Promise<T | null>
  run: () => Promise<{ success: boolean; meta?: { changes?: number } }>
}

export type CloudflareD1Binding = {
  prepare: (query: string) => CloudflareD1PreparedStatement
  batch?: <T = unknown>(statements: CloudflareD1PreparedStatement[]) => Promise<T[]>
}

export type CloudflareAiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>
}

export type AppServerEnv = {
  DB?: CloudflareD1Binding
  AI?: CloudflareAiBinding
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_D1_DATABASE_ID?: string
  CLOUDFLARE_API_TOKEN?: string
  CLOUDFLARE_AI_MODEL?: string
  SESSION_SECRET?: string
  VIETQR_BANK_BIN?: string
  VIETQR_BANK_SHORT_NAME?: string
  VIETQR_ACCOUNT_NO?: string
  VIETQR_ACCOUNT_NAME?: string
  VIETQR_WEBHOOK_SECRET?: string
  NODE_ENV?: string
}

const CF_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

export function getServerEnv(): AppServerEnv {
  const g = globalThis as Record<PropertyKey, unknown>
  const cfCtx = g[CF_CONTEXT_SYMBOL] as { env?: AppServerEnv } | undefined
  const runtimeEnv = cfCtx?.env ?? (g.__cf_env__ as AppServerEnv | undefined) ?? {}
  const pEnv = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {}

  return {
    DB: runtimeEnv.DB,
    AI: runtimeEnv.AI,
    CLOUDFLARE_ACCOUNT_ID: runtimeEnv.CLOUDFLARE_ACCOUNT_ID ?? pEnv.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_D1_DATABASE_ID: runtimeEnv.CLOUDFLARE_D1_DATABASE_ID ?? pEnv.CLOUDFLARE_D1_DATABASE_ID,
    CLOUDFLARE_API_TOKEN: runtimeEnv.CLOUDFLARE_API_TOKEN ?? pEnv.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_AI_MODEL: runtimeEnv.CLOUDFLARE_AI_MODEL ?? pEnv.CLOUDFLARE_AI_MODEL ?? '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    SESSION_SECRET: runtimeEnv.SESSION_SECRET ?? pEnv.SESSION_SECRET ?? 'hsx-dev-session-secret-change-in-production',
    VIETQR_BANK_BIN: runtimeEnv.VIETQR_BANK_BIN ?? pEnv.VIETQR_BANK_BIN ?? '970422',
    VIETQR_BANK_SHORT_NAME: runtimeEnv.VIETQR_BANK_SHORT_NAME ?? pEnv.VIETQR_BANK_SHORT_NAME ?? 'MBBank',
    VIETQR_ACCOUNT_NO: runtimeEnv.VIETQR_ACCOUNT_NO ?? pEnv.VIETQR_ACCOUNT_NO ?? '0123456789',
    VIETQR_ACCOUNT_NAME: runtimeEnv.VIETQR_ACCOUNT_NAME ?? pEnv.VIETQR_ACCOUNT_NAME ?? 'VEROCV SAAS',
    VIETQR_WEBHOOK_SECRET: runtimeEnv.VIETQR_WEBHOOK_SECRET ?? pEnv.VIETQR_WEBHOOK_SECRET,
    NODE_ENV: runtimeEnv.NODE_ENV ?? pEnv.NODE_ENV,
  }
}

export function getInfraMode(env = getServerEnv()): {
  d1Mode: 'worker-binding' | 'd1-rest-api' | 'local-store'
  aiMode: 'worker-binding' | 'workers-ai-rest' | 'local-engine'
} {
  const d1Mode = env.DB
    ? 'worker-binding'
    : env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_D1_DATABASE_ID && env.CLOUDFLARE_API_TOKEN
      ? 'd1-rest-api'
      : 'local-store'

  const aiMode = env.AI
    ? 'worker-binding'
    : env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN
      ? 'workers-ai-rest'
      : 'local-engine'

  return { d1Mode, aiMode }
}
