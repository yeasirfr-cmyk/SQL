import { SignJWT, jwtVerify } from 'jose'
import type { NextFunction, Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
import { env } from './config.js'
import { readAdmin } from './admin-store.js'

const COOKIE_NAME = 'operations-session'
const secret = new TextEncoder().encode(env.SESSION_SECRET)

export type Session = {
  username: string
  csrf: string
  sessionVersion: number
  keepLoggedIn: boolean
}

declare global {
  namespace Express {
    interface Request {
      session?: Session
    }
  }
}

export async function issueSession(
  response: Response,
  input: Omit<Session, 'csrf'>,
): Promise<{ csrf: string; expiresAt: string }> {
  const csrf = randomBytes(24).toString('base64url')
  const seconds = input.keepLoggedIn ? 30 * 24 * 60 * 60 : 8 * 60 * 60
  const token = await new SignJWT({ ...input, csrf })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(secret)
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: seconds * 1000,
  })
  return { csrf, expiresAt: new Date(Date.now() + seconds * 1000).toISOString() }
}

export function clearSession(response: Response): void {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.COOKIE_SECURE,
    path: '/',
  })
}

export async function requireSession(request: Request, response: Response, next: NextFunction) {
  try {
    const token = request.cookies?.[COOKIE_NAME] as string | undefined
    if (!token) return response.status(401).json({ error: { code: 'SESSION_REQUIRED', message: 'Please sign in.' } })
    const { payload } = await jwtVerify(token, secret)
    const session = payload as unknown as Session
    const admin = await readAdmin()
    if (!admin || admin.username !== session.username || admin.sessionVersion !== session.sessionVersion) {
      clearSession(response)
      return response.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Your session has expired.' } })
    }
    request.session = session
    next()
  } catch {
    clearSession(response)
    return response.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Your session has expired.' } })
  }
}

export function requireCsrf(request: Request, response: Response, next: NextFunction) {
  const supplied = request.get('x-csrf-token')
  if (!request.session || !supplied || supplied !== request.session.csrf) {
    return response.status(403).json({ error: { code: 'CSRF_INVALID', message: 'The request could not be verified.' } })
  }
  next()
}
