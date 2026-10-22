import 'dotenv/config'
import { z } from 'zod'

const booleanString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')

const schema = z.object({
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECURE: booleanString.default(false),
  DB_SERVER: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(1433),
  DB_DATABASE: z.string().min(1).default('FOApp'),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_ENCRYPT: booleanString.default(true),
  DB_TRUST_SERVER_CERTIFICATE: booleanString.default(true),
  DB_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(5000).max(600000).default(120000),
  ARRIVAL_FILE_PATH: z.string().min(1).default('C:\\ARRIVAL_DATA\\ARRIVAL_DATA.csv'),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Missing or invalid environment settings: ${names}. Copy .env.example to .env and fill in the values.`)
}

export const env = Object.freeze(result.data)
export const isProduction = process.env.NODE_ENV === 'production'
