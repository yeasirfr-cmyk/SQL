import sql from 'mssql'
import { env } from './config.js'
import { MISSED_CHECKOUT_SQL, YESTERDAYS_COMMENTS_SQL } from './report-sql.js'

let pool: sql.ConnectionPool | null = null

export type ReportName = 'missed-checkout' | 'yesterdays-comments'
export type ReportRow = Record<string, string | null>

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool({
      server: env.DB_SERVER,
      port: env.DB_PORT,
      database: env.DB_DATABASE,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      options: {
        encrypt: env.DB_ENCRYPT,
        trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      },
      pool: { min: 0, max: 5, idleTimeoutMillis: 30000 },
      requestTimeout: env.DB_REQUEST_TIMEOUT_MS,
    }).connect()
  }
  return pool
}

export async function closePool(): Promise<void> {
  if (pool) await pool.close()
  pool = null
}

function value(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export async function runReport(name: ReportName): Promise<ReportRow[]> {
  const arrivalPath = env.ARRIVAL_FILE_PATH.replaceAll("'", "''")
  const query = name === 'missed-checkout'
    ? MISSED_CHECKOUT_SQL.replace('C:\\ARRIVAL_DATA\\ARRIVAL_DATA.csv', arrivalPath)
    : YESTERDAYS_COMMENTS_SQL
  const result = await (await getPool()).request().query(query)
  if (name === 'missed-checkout') {
    return result.recordset.map((row) => ({
      room: value(row.RoomNumber),
      arrival: value(row.ArrivalDate),
      departure: value(row.DepartureDate),
      confirmation: value(row.confirmationID),
      profile: value(row.ProfileID),
    }))
  }
  return result.recordset.map((row) => ({
    room: value(row['Room No']),
    confirmation: value(row['Conf No']),
    type: value(row.CommentType),
    comment: value(row.Comment),
    commentDate: value(row.CommentDate),
    submitted: value(row['Comment Submitted Date']),
    commentBy: value(row.CommentBy),
    gsa: value(row.GSA),
    updatedBy: value(row.CommentUpdatedBy),
    updated: value(row.CommentUpdateDate),
    arrival: value(row.ArrivalDate),
    departure: value(row.DepartureDate),
  }))
}

export async function testDatabase(): Promise<{ serverTime: string }> {
  const result = await (await getPool()).request().query('SELECT GETDATE() AS ServerTime')
  return { serverTime: new Date(result.recordset[0].ServerTime).toISOString() }
}

export async function testArrivalFile(): Promise<{ bytes: number }> {
  const escaped = env.ARRIVAL_FILE_PATH.replaceAll("'", "''")
  const result = await (await getPool()).request().query(`
    SELECT DATALENGTH(BulkColumn) AS FileBytes
    FROM OPENROWSET(BULK '${escaped}', SINGLE_NCLOB) AS ArrivalFile
  `)
  return { bytes: Number(result.recordset[0].FileBytes ?? 0) }
}
