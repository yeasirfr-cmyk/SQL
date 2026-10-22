import express, { type NextFunction, type Request, type Response } from 'express'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'
import { changeAdminCredentials, readAdmin, verifyAdmin } from './admin-store.js'
import { clearSession, issueSession, requireCsrf, requireSession } from './auth.js'
import { env, isProduction } from './config.js'
import { closePool, runReport, testArrivalFile, testDatabase, type ReportName, type ReportRow } from './database.js'
import { createCsv, createExcel } from './exports.js'

const app = express()
app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }))
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'LOGIN_RATE_LIMIT', message: 'Too many login attempts. Try again in 15 minutes.' } },
})

const loginSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(1).max(200),
  keepLoggedIn: z.boolean().default(false),
}).strict()

app.post('/api/auth/login', loginLimiter, async (request, response) => {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Enter a valid username and password.' } })
  const admin = await verifyAdmin(parsed.data.username, parsed.data.password)
  if (!admin) return response.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } })
  const session = await issueSession(response, {
    username: admin.username,
    sessionVersion: admin.sessionVersion,
    keepLoggedIn: parsed.data.keepLoggedIn,
  })
  return response.json({ user: { username: admin.username }, ...session })
})

app.get('/api/auth/me', requireSession, (request, response) => {
  response.json({ user: { username: request.session!.username }, csrf: request.session!.csrf })
})

app.post('/api/auth/logout', requireSession, requireCsrf, (_request, response) => {
  clearSession(response)
  response.status(204).end()
})

const changeCredentialsSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newUsername: z.string().trim().min(3).max(100).optional(),
  newPassword: z.string().min(12).max(200).optional(),
}).strict().refine((value) => value.newUsername || value.newPassword, {
  message: 'Enter a new username or password.',
})

app.post('/api/settings/credentials', requireSession, requireCsrf, async (request, response) => {
  const parsed = changeCredentialsSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid values.' } })
  try {
    const admin = await changeAdminCredentials(parsed.data)
    const session = await issueSession(response, {
      username: admin.username,
      sessionVersion: admin.sessionVersion,
      keepLoggedIn: request.session!.keepLoggedIn,
    })
    response.json({ user: { username: admin.username }, ...session })
  } catch (error) {
    if (error instanceof Error && error.message === 'CURRENT_PASSWORD_INVALID') {
      return response.status(400).json({ error: { code: 'CURRENT_PASSWORD_INVALID', message: 'Current password is incorrect.' } })
    }
    throw error
  }
})

type Execution = {
  id: string
  username: string
  report: ReportName
  rows: ReportRow[]
  rowCount: number
  durationMs: number
  executedAt: string
}

const executions = new Map<string, Execution>()
const running = new Set<string>()

function isReportName(value: string): value is ReportName {
  return value === 'missed-checkout' || value === 'yesterdays-comments'
}

app.get('/api/activity', requireSession, (request, response) => {
  const items = [...executions.values()]
    .filter((execution) => execution.username === request.session!.username)
    .sort((left, right) => right.executedAt.localeCompare(left.executedAt))
    .slice(0, 10)
    .map((execution) => ({
      id: execution.id,
      report: execution.report,
      rowCount: execution.rowCount,
      durationMs: execution.durationMs,
      executedAt: execution.executedAt,
      status: 'success',
    }))
  response.json({ items })
})

app.post('/api/reports/:report/run', requireSession, requireCsrf, async (request, response) => {
  const report = Array.isArray(request.params.report) ? request.params.report[0] : request.params.report
  if (!isReportName(report)) return response.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } })
  const lock = `${request.session!.username}:${report}`
  if (running.has(lock)) return response.status(409).json({ error: { code: 'REPORT_ALREADY_RUNNING', message: 'This report is already running.' } })
  running.add(lock)
  const started = performance.now()
  try {
    const rows = await runReport(report)
    const execution: Execution = {
      id: randomUUID(),
      username: request.session!.username,
      report,
      rows,
      rowCount: rows.length,
      durationMs: Math.round(performance.now() - started),
      executedAt: new Date().toISOString(),
    }
    executions.set(execution.id, execution)
    response.json(execution)
  } finally {
    running.delete(lock)
  }
})

const exportSchema = z.object({
  executionId: z.string().uuid(),
  format: z.enum(['csv', 'xlsx']),
}).strict()

app.post('/api/reports/:report/export', requireSession, requireCsrf, async (request, response) => {
  const report = Array.isArray(request.params.report) ? request.params.report[0] : request.params.report
  if (!isReportName(report)) return response.status(404).json({ error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } })
  const parsed = exportSchema.safeParse(request.body)
  if (!parsed.success) return response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid export request.' } })
  const execution = executions.get(parsed.data.executionId)
  if (!execution || execution.username !== request.session!.username || execution.report !== report) {
    return response.status(404).json({ error: { code: 'EXECUTION_NOT_FOUND', message: 'Run the report again before exporting.' } })
  }
  const file = parsed.data.format === 'csv'
    ? createCsv(report, execution.rows)
    : await createExcel(report, execution.rows)
  response.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
  response.setHeader('Content-Type', parsed.data.format === 'csv'
    ? 'text/csv; charset=utf-8'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  response.send(file.buffer)
})

app.get('/api/settings/status', requireSession, async (_request, response) => {
  const admin = await readAdmin()
  response.json({
    database: {
      server: env.DB_SERVER,
      port: env.DB_PORT,
      database: env.DB_DATABASE,
      status: 'configured',
    },
    arrivalFile: { path: env.ARRIVAL_FILE_PATH, status: 'not-tested' },
    user: { username: admin?.username ?? '' },
    version: '1.0.0',
  })
})

app.post('/api/settings/test-database', requireSession, requireCsrf, async (_request, response) => {
  response.json({ ok: true, ...(await testDatabase()) })
})

app.post('/api/settings/test-arrival-file', requireSession, requireCsrf, async (_request, response) => {
  response.json({ ok: true, ...(await testArrivalFile()) })
})

app.get('/api/health', async (_request, response) => {
  response.json({ ok: true, adminConfigured: Boolean(await readAdmin()) })
})

if (isProduction) {
  const publicDirectory = path.resolve(process.cwd(), 'dist')
  app.use(express.static(publicDirectory, { index: false }))
  app.use((request, response, next) => {
    if (request.method === 'GET' && request.accepts('html')) {
      return response.sendFile(path.join(publicDirectory, 'index.html'))
    }
    next()
  })
}

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const reference = `ERR-${randomUUID().slice(0, 8).toUpperCase()}`
  console.error(`[${reference}]`, error instanceof Error ? error.message : 'Unexpected server error')
  response.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: 'The request could not be completed. Check the local server log.',
      reference,
    },
  })
})

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`Operations Report API listening at http://${env.HOST}:${env.PORT}`)
})

async function shutdown() {
  server.close(async () => {
    await closePool()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
