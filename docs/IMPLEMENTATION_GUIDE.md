# Beginner-Friendly Windows Implementation Guide

> **Current installation:** The standalone implementation is now available in
> `local-app/`. For the shortest supported Windows 11 instructions, use the
> root `SETUP_GUIDE.md`. The material below remains as detailed architectural
> background.

This guide is the production handoff for the interface in this repository. Run
PowerShell as a normal user unless a step explicitly says **Administrator**.
Replace every `<PLACEHOLDER>`; never paste real secrets into source control.

## Phase 1: Prerequisites

1. Open PowerShell and verify tools:

   ```powershell
   node --version
   npm --version
   git --version
   ```

   Install the current Node.js 22 LTS build, Git for Windows, and VS Code if a
   command is missing. Reopen PowerShell after installation.

2. Configure Git identity:

   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "you@example.internal"
   ```

3. In SQL Server Management Studio (SSMS), connect with the same server and
   authentication method intended for the app. Record, without sharing secrets:

   - host and optional instance, such as `localhost\HOTELSQL`;
   - TCP port if fixed;
   - whether SQL Login or Windows Integrated authentication is required;
   - the database containing `GUESTS`;
   - confirmation that `FOApp` contains `Rooms`, `Stays`, `Comments`, `Guests`.

4. In SSMS, verify access:

   ```sql
   SELECT @@SERVERNAME AS ServerName, DB_NAME() AS CurrentDatabase,
          ORIGINAL_LOGIN() AS LoginName, GETDATE() AS ServerLocalTime;
   USE FOApp;
   SELECT TOP (1) RoomNumber FROM dbo.Rooms;
   ```

5. **Administrator/DBA:** open SQL Server Configuration Manager. Under
   **SQL Server Network Configuration → Protocols for the instance**, confirm
   TCP/IP is enabled if Node connects over TCP. Restart only the affected SQL
   Server service after an approved change.

6. Determine the Database Engine service account in SQL Server Configuration
   Manager. Grant that account read permission to the file, not your Node user:

   ```powershell
   Get-Item "C:\ARRIVAL_DATA\ARRIVAL_DATA.csv"
   icacls "C:\ARRIVAL_DATA\ARRIVAL_DATA.csv"
   ```

   In SSMS, run the supplied report manually. `OPENROWSET` configuration and
   bulk permissions must be DBA-approved. Do not broadly grant local
   Administrators or Everyone.

The `mssql` package uses the Tedious JavaScript driver for SQL authentication;
it does not require ODBC. Windows Integrated authentication commonly requires
`msnodesqlv8`, Microsoft ODBC Driver 18 for SQL Server, matching process
architecture, and a package/configuration change. Decide the method before
implementing the connection layer.

## Phase 2: Create the project

From a normal PowerShell window:

```powershell
New-Item -ItemType Directory hotel-operations-reports
Set-Location hotel-operations-reports

npm create vite@latest frontend -- --template react-ts
Set-Location frontend
npm install
npm install react-router-dom lucide-react @tanstack/react-table zod
npm install -D tailwindcss @tailwindcss/vite
Set-Location ..

New-Item -ItemType Directory backend
Set-Location backend
npm init -y
npm install express mssql exceljs zod helmet cors express-rate-limit `
  express-session connect-sqlite3 argon2 csv-stringify
npm install -D typescript tsx @types/node @types/express @types/cors `
  @types/express-session
npx tsc --init
Set-Location ..

npm init -y
npm install -D concurrently
```

Create directories:

```powershell
$dirs = @(
  "frontend/src/components", "frontend/src/layouts", "frontend/src/pages",
  "frontend/src/features/auth", "frontend/src/features/missed-checkout",
  "frontend/src/features/yesterdays-comments", "frontend/src/services",
  "frontend/src/hooks", "frontend/src/types", "frontend/src/utils",
  "backend/src/config", "backend/src/middleware", "backend/src/routes",
  "backend/src/controllers", "backend/src/services",
  "backend/src/repositories", "backend/src/exports", "backend/src/types",
  "backend/scripts", "docs"
)
$dirs | ForEach-Object { New-Item -ItemType Directory -Force $_ }
```

Use `"strict": true` in both TypeScript configurations. Add backend scripts:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "admin:create": "tsx scripts/create-admin.ts"
  }
}
```

Root scripts:

```json
{
  "scripts": {
    "dev": "concurrently -n API,UI -c blue,green \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\"",
    "build": "npm --prefix frontend run build && npm --prefix backend run build"
  }
}
```

## Phase 3: Configure SQL Server

Create `backend/.env` from `backend/.env.example` and keep it out of Git:

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
SESSION_SECRET=<GENERATE_A_RANDOM_32_BYTE_OR_LONGER_SECRET>
DB_SERVER=<HOST_OR_HOST_BACKSLASH_INSTANCE>
DB_PORT=1433
DB_NAME=FOApp
DB_USER=<LEAST_PRIVILEGE_SQL_LOGIN>
DB_PASSWORD=<PASSWORD>
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
DB_REQUEST_TIMEOUT_MS=120000
ARRIVAL_FILE_PATH=C:\ARRIVAL_DATA\ARRIVAL_DATA.csv
```

Generate a session secret:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

For a local SQL Server using a self-signed certificate, first install/trust the
correct certificate. `DB_TRUST_SERVER_CERTIFICATE=true` is a local workaround,
not a preferred production setting.

The SQL login needs only the report’s required `SELECT` permissions. File access
belongs to the SQL Server service account. Node does not need file access for
the supplied `OPENROWSET` query.

## Phase 4: Implement the backend

### Environment validation

In `backend/src/config/env.ts`, parse `process.env` with Zod. Require the server,
database, session secret, timeout, and either SQL credentials or an explicitly
configured integrated-auth mode. Export a frozen configuration object and never
return it from an API route.

### Connection pool

```ts
// backend/src/config/database.ts
import sql from 'mssql'
import { env } from './env.js'

let pool: sql.ConnectionPool | undefined

export async function getPool() {
  if (!pool) {
    pool = await new sql.ConnectionPool({
      server: env.DB_SERVER,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      options: {
        encrypt: env.DB_ENCRYPT,
        trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      },
      pool: { min: 0, max: 5, idleTimeoutMillis: 30_000 },
      requestTimeout: env.DB_REQUEST_TIMEOUT_MS,
    }).connect()
  }
  return pool
}

export async function closePool() {
  if (pool) await pool.close()
  pool = undefined
}
```

Keep the two complete SQL strings in a repository file. This Make project
preserves them in `src/server/report-sql.ts`. Execute only those constants:

```ts
const started = performance.now()
const result = await (await getPool()).request().query(MISSED_CHECKOUT_SQL)
return {
  rows: result.recordset,
  rowCount: result.recordset.length,
  durationMs: Math.round(performance.now() - started),
  executedAt: new Date().toISOString(),
}
```

Use an in-memory `Map<sessionId, Set<reportName>>` for duplicate execution
prevention on one local Node process. Add before execution and remove in
`finally`. Return `409 REPORT_ALREADY_RUNNING` for duplicates.

### Authentication

Create the first admin with `npm --prefix backend run admin:create`. The script
must prompt for email/password without echoing the password, hash with:

```ts
await argon2.hash(password, { type: argon2.argon2id })
```

Store only the hash. Do not ship a default account. Login must use
`argon2.verify`, regenerate the session, and return a generic invalid-credentials
response. Use `express-session` with a persistent local store, `HttpOnly`,
`SameSite: 'lax'`, eight-hour expiry, and `secure: true` when HTTPS is used.
Apply a strict login limiter. Every protected route checks `req.session.userId`
and active/admin status.

For state-changing cookie-authenticated requests, issue a per-session CSRF token
and require it in `X-CSRF-Token`. Verify `Origin` as defense in depth.

### CSV export

Use `csv-stringify/sync`. Convert `null` to an empty value and prefix any text
beginning with `=`, `+`, `-`, or `@` with an apostrophe. Add UTF-8 BOM:

```ts
const output = '\uFEFF' + stringify(protectedRows, {
  header: true,
  columns: reportColumns,
  record_delimiter: 'windows',
})
```

Set `Content-Type: text/csv; charset=utf-8` and a filename with the execution
date.

### ExcelJS export

Create a real `Workbook`; add title, generated timestamp, and row count in the
first three rows. Put headers on row 5, freeze at row 6, and set the autofilter
over row 5. Use navy header fill, white bold text, thin borders, alternating
fills, typed JavaScript `Date` values, and Excel date formats. Set Comment width
near 60, `wrapText: true`, and a sensible capped row height. Use a visible
“No records returned” row when empty. Formula-protect untrusted strings before
assigning cell values.

### Express lifecycle

Initialize Helmet, JSON body limits, same-origin CORS with
`credentials: true`, session middleware, CSRF, routes, then the centralized
error handler. Bind to `127.0.0.1`. On `SIGINT`/`SIGTERM`, stop accepting
requests, close the SQL pool, and exit. Log request ID, route, status, and
duration only—never report rows.

Routes:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/health
POST /api/reports/missed-checkout/run
POST /api/reports/yesterdays-comments/run
POST /api/reports/missed-checkout/export
POST /api/reports/yesterdays-comments/export
GET  /api/settings/status
POST /api/settings/test-database
POST /api/settings/test-arrival-file
```

## Phase 5: Implement the frontend

The working visual implementation is in
`src/components/hotel-reports-app.tsx`. When moving it to Vite:

1. Move reusable controls into `components/`.
2. Move each report and its strict row type into its feature folder.
3. Replace sample arrays with the typed API service.
4. Keep the table’s search, sort, pagination, null display, loading skeleton,
   error recovery, long-comment modal, responsive shell, and focus styles.
5. Keep previous successful rows in state when a refresh fails.
6. Download exports as blobs from the protected endpoint. Do not generate Excel
   from browser-submitted rows.

The API client uses:

```ts
fetch(path, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(130_000),
})
```

On `401`, clear authenticated UI state and show the session-expired login
notice. On `403`, show authorization or CSRF guidance. Do not display raw server
errors.

## Phase 6: Connect frontend and backend

In `frontend/vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false }
  }
}
```

Use relative `/api/...` URLs. The browser sees one Vite origin in development,
and Vite forwards API traffic. Cookies are still sent with
`credentials: 'include'`. Test:

```powershell
Invoke-WebRequest http://127.0.0.1:3001/api/health
Invoke-WebRequest http://127.0.0.1:3001/api/auth/me -SessionVariable s
```

A `401` before login is correct. A `403` usually means role/CSRF/origin failure.
A `500` should include only a safe reference; inspect the local server log. CORS
errors indicate an origin mismatch. Timeouts require checking SQL execution
first, not merely increasing the browser timeout.

## Phase 7: Run and test locally

```powershell
Set-Location <PATH>\hotel-operations-reports
npm run dev
```

Open `http://localhost:5173`, sign in, run both reports, search/sort/page,
open a full comment, export CSV and Excel, then sign out.

Checklist:

- [ ] Blank/invalid login is rejected; limiter activates after repeated failure.
- [ ] Protected endpoints return `401` without a session.
- [ ] Duplicate report clicks produce one query.
- [ ] Empty reports show a clear state and valid empty exports.
- [ ] A large result remains usable and exports every row.
- [ ] Database failure preserves previous rows and shows a safe error.
- [ ] Session expiration returns to login with a notice.
- [ ] CSV handles commas, quotes, newlines, Unicode, and `=SUM(...)`.
- [ ] Excel opens without repair warnings; dates, filters, freeze panes, widths,
      wraps, and empty state are correct.
- [ ] Logout invalidates the server session.

## Phase 8: Build a local production version

```powershell
npm run build
```

Copy `frontend/dist` into `backend/public` during the build. In Express, serve
that directory after API routes and return `index.html` for non-API GET routes.
Then:

```powershell
$env:NODE_ENV = "production"
npm --prefix backend start
```

Keep `HOST=127.0.0.1`. A browser URL does not make the app public; the loopback
binding keeps it on the PC.

Create `start-hotel-reports.cmd`:

```bat
@echo off
cd /d C:\Apps\hotel-operations-reports
set NODE_ENV=production
call npm --prefix backend start
```

Create a Windows shortcut to that file. For unattended startup, use Task
Scheduler under a dedicated least-privilege account; set **Start in** to the
project directory. Restrict `.env` ACLs with `icacls`. Back up `.env.example`
and documentation, not plaintext production secrets. Rotate the admin password
with a dedicated authenticated CLI command and rotate the session secret during
a maintenance window (all sessions will end).

Development includes hot reload and source maps. Production uses built,
optimized files, production cookie behavior, and no development error overlay.

## Phase 9: Troubleshooting

| Problem | Verify | Safe fix |
|---|---|---|
| `node`/`npm` not recognized | `Get-Command node` | Install Node 22 LTS; reopen PowerShell |
| Frontend compile error | first Vite error and file | Fix that TypeScript/import error; do not suppress strict mode |
| Port in use | `Get-NetTCPConnection -LocalPort 3001` | Stop the known process or configure a free local port |
| SQL connection failure | SSMS with same host/auth | Correct instance/port, TCP, firewall, TLS, or login |
| Incorrect credentials | SSMS login audit | Reset through DBA process; never log the password |
| Windows auth failure | app identity and ODBC 18 | Install approved driver; grant that identity; configure `msnodesqlv8` |
| `OPENROWSET` failure | run exact SQL in SSMS | DBA checks bulk configuration and bulk permission |
| CSV permission denied | SQL service identity + `icacls` | Grant read to that service identity only |
| Invalid CSV/encoding | inspect producer specification | Fix producer or approve a proper parser/staging import |
| Incorrect report dates | `SELECT GETDATE()` | Correct SQL Server clock/time zone; range filter uses server-local date |
| Empty report | run exact SQL in SSMS | Confirm empty is valid; inspect file freshness and filters |
| Duplicate rows | query by StayID and join cardinality | Document and approve join correction; do not add blind `DISTINCT` |
| Login failure | generic browser error, server request ID | Check account state/hash/session store without exposing details |
| Cookie absent | browser dev tools, origin, flags | Match origin; use HTTPS for Secure cookies; include credentials |
| Excel layout issue | open generated workbook | Correct widths, wrap, types, formats, freeze pane, filter range |
| CSV columns broken | inspect raw file in editor | Use library escaping, CRLF, UTF-8 BOM |
| Large report timeout | SQL duration/plan | Tune approved query/index, stream export, then adjust timeout |
| Missing dependency | `npm install`, lockfile | Install from the correct project directory; commit lockfile |
| Wrong production API path | network tab | Use relative `/api`; serve frontend and API from one origin |

## Phase 10: Final verification

- [ ] Password hash only; secure bootstrap and rotation tested.
- [ ] HTTP-only expiring session, logout, rate limit, CSRF, and authorization work.
- [ ] Unauthenticated users cannot run or export reports.
- [ ] Both exact SQL queries execute against the intended database.
- [ ] SQL Server, not Node, can read the arrival file.
- [ ] Displayed columns, nulls, dates, long comments, search, sorting, and paging work.
- [ ] CSV and Excel contain all authorized rows and resist formula injection.
- [ ] Excel is professionally formatted and opens without warnings.
- [ ] No credential, connection string, stack trace, or guest data appears in browser source or logs.
- [ ] Production binds only to localhost.
- [ ] The startup shortcut works after a restart.
- [ ] A second administrator can follow this guide without undocumented steps.
