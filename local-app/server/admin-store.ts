import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'

export type AdminRecord = {
  username: string
  passwordHash: string
  sessionVersion: number
  updatedAt: string
}

const dataDirectory = path.resolve(process.cwd(), 'data')
const adminPath = path.join(dataDirectory, 'admin.json')

export async function readAdmin(): Promise<AdminRecord | null> {
  try {
    return JSON.parse(await readFile(adminPath, 'utf8')) as AdminRecord
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function writeAdmin(record: AdminRecord): Promise<void> {
  await mkdir(dataDirectory, { recursive: true })
  const temporaryPath = `${adminPath}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  })
  await rename(temporaryPath, adminPath)
}

export async function createAdmin(username: string, password: string): Promise<void> {
  if (await readAdmin()) {
    throw new Error('An administrator already exists. Change credentials from the authenticated Settings page.')
  }
  await writeAdmin({
    username: normalizeUsername(username),
    passwordHash: await bcrypt.hash(password, 12),
    sessionVersion: 1,
    updatedAt: new Date().toISOString(),
  })
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export async function verifyAdmin(username: string, password: string): Promise<AdminRecord | null> {
  const admin = await readAdmin()
  if (!admin || admin.username !== normalizeUsername(username)) return null
  return (await bcrypt.compare(password, admin.passwordHash)) ? admin : null
}

export async function changeAdminCredentials(input: {
  currentPassword: string
  newUsername?: string
  newPassword?: string
}): Promise<AdminRecord> {
  const admin = await readAdmin()
  if (!admin || !(await bcrypt.compare(input.currentPassword, admin.passwordHash))) {
    throw new Error('CURRENT_PASSWORD_INVALID')
  }
  const next: AdminRecord = {
    username: input.newUsername ? normalizeUsername(input.newUsername) : admin.username,
    passwordHash: input.newPassword ? await bcrypt.hash(input.newPassword, 12) : admin.passwordHash,
    sessionVersion: admin.sessionVersion + 1,
    updatedAt: new Date().toISOString(),
  }
  await writeAdmin(next)
  return next
}
