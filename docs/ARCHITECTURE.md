# Hotel Operations Reports — Production Architecture

## Deliverable status

The Make project contains the complete interactive interface and all visual
states. It uses representative data so every table interaction can be reviewed
without exposing hotel records. The production deployment described below must
replace the prototype login and sample report adapter with the protected local
API. Do not treat browser-only prototype authentication as a security boundary.

The Make runtime is Next.js/Payload. The requested Windows deployment can use
React/Vite plus Express as shown in `IMPLEMENTATION_GUIDE.md`; the UI and API
contracts remain the same.

## System boundary

```text
Browser (React)
  └─ same-origin HTTPS/localhost requests, credentials included
      └─ Express API bound to 127.0.0.1
          ├─ authentication/session middleware
          ├─ report service + execution lock
          ├─ export service (CSV / ExcelJS)
          └─ mssql connection pool
              └─ SQL Server / FOApp / ARRIVAL_DATA.csv
```

SQL credentials, password hashes, session secrets, report SQL, and full report
results stay on the server. The browser receives only authorized response rows.

## Recommended source structure

```text
hotel-operations-reports/
├─ frontend/
│  └─ src/
│     ├─ components/       reusable controls and data table
│     ├─ features/         auth and two report modules
│     ├─ layouts/          authenticated shell
│     ├─ pages/            login, dashboard, reports, settings
│     ├─ services/         typed HTTP client
│     ├─ types/            API and row types
│     └─ utils/            dates and download helpers
├─ backend/
│  ├─ scripts/             one-time admin bootstrap
│  └─ src/
│     ├─ config/            validated environment
│     ├─ middleware/        auth, CSRF, rate limit, errors
│     ├─ routes/            REST route declarations
│     ├─ controllers/       HTTP mapping only
│     ├─ services/          report and export workflows
│     ├─ repositories/      predefined SQL and database access
│     ├─ exports/           CSV and ExcelJS
│     └─ server.ts          lifecycle and graceful shutdown
└─ docs/
```

## API contract

All report, export, and settings routes require a valid administrator session.
Mutating routes require a CSRF token when SameSite alone is not sufficient.

### Login

`POST /api/auth/login`

```json
{
  "email": "admin@hotel.local",
  "password": "<entered by administrator>"
}
```

Success:

```json
{
  "user": { "id": "usr_01", "email": "admin@hotel.local", "role": "admin" },
  "sessionExpiresAt": "2025-05-19T16:02:00.000Z"
}
```

Use one generic `401` message for unknown users and wrong passwords. Return
`403` with code `ACCOUNT_DISABLED` only after authentication logic determines
that state.

### Run report

`POST /api/reports/missed-checkout/run` and
`POST /api/reports/yesterdays-comments/run`

```json
{
  "executionId": "rpt_01JVC68B4N",
  "report": "missed-checkout",
  "status": "success",
  "rows": [
    {
      "roomNumber": "204",
      "arrivalDate": "2025-05-15",
      "departureDate": "2025-05-18",
      "confirmationId": "CNF-78491",
      "profileId": "P-104882"
    }
  ],
  "rowCount": 1,
  "durationMs": 1842,
  "executedAt": "2025-05-19T08:31:22.104-04:00"
}
```

Errors use a safe reference, never a SQL message:

```json
{
  "error": {
    "code": "REPORT_TIMEOUT",
    "message": "The report did not complete in time.",
    "reference": "RPT-7S82KD"
  }
}
```

### Export

`POST /api/reports/:report/export`

```json
{ "executionId": "rpt_01JVC68B4N", "format": "xlsx", "scope": "all" }
```

The server looks up an execution owned by the current session or securely
reruns the predefined report. It must never accept report rows from the browser.

### Health and settings

- `GET /api/health`: minimal process status; no credentials or server names.
- `GET /api/settings/status`: protected, sanitized database/file/session status.
- `POST /api/settings/test-database`: protected and rate limited.
- `POST /api/settings/test-arrival-file`: asks SQL Server to verify access.

## SQL correctness review

The exact initial SQL is preserved in `src/server/report-sql.ts`.

1. `OPENROWSET` reads from the SQL Server machine and security context, not from
   Node.js. The SQL Server Database Engine service account needs read access to
   `C:\ARRIVAL_DATA\ARRIVAL_DATA.csv`.
2. The supplied parser is tab-delimited despite the `.csv` extension. It does
   not safely support quoted delimiters, embedded newlines, or every escaped
   quote case. Confirm the producer’s actual format before changing it.
3. `STRING_SPLIT` order is not guaranteed in older compatibility levels. SQL
   Server 2022 can use the ordinal option; otherwise use a format-aware staging
   import. The header skip can be wrong if line ordering changes.
4. `NOT IN` returns unknown when its subquery includes `NULL`. After output is
   validated, prefer:

   ```sql
   AND NOT EXISTS (
       SELECT 1
       FROM CSVData csv
       WHERE csv.ProfileID = a.ProfileID
   )
   ```

   Decide explicitly whether a `NULL` guest `ProfileID` should be reported.
5. `CAST(ActualCommentDate AS DATE)` can prevent an index seek. An equivalent
   candidate is:

   ```sql
   b.ActualCommentDate >= DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()) - 1, 0)
   AND b.ActualCommentDate <  DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0)
   ```

   SQL Server’s local clock defines “yesterday.”
6. Validate duplicate behavior using `StayID`, room occupancy, multiple active
   stays, and grouped guest rows before approving any join change.

## Security baseline

- Bind to `127.0.0.1`, not `0.0.0.0`, unless remote access is deliberate.
- Store only an Argon2id or bcrypt hash. Bootstrap from a prompt or temporary
  environment variable, then remove the plaintext input.
- Use a cryptographically random session secret of at least 32 bytes.
- Cookies: `HttpOnly`, `SameSite=Lax` or `Strict`, `Secure` under HTTPS,
  narrow path, fixed expiry, and server-side invalidation on logout.
- Regenerate the session identifier after login.
- Rate-limit login by IP and normalized account identifier.
- Validate every request with Zod. Reject unknown properties.
- Keep report SQL predefined. Parameterize every future dynamic value.
- Use a database principal with only `CONNECT`, required `SELECT`, and the
  minimum bulk-read capability approved by the DBA.
- Never log passwords, cookies, connection strings, full comments, profile IDs,
  or confirmation IDs.
- Set Helmet headers, a strict same-origin CORS policy, body limits, timeouts,
  and graceful error handling.
- Formula-protect CSV/Excel text beginning with `=`, `+`, `-`, or `@`.

Local does not mean public. A loopback-bound app is reachable only from the PC;
a publicly deployed app requires TLS, network controls, secret management,
monitoring, patching, backups, and a broader threat review.
