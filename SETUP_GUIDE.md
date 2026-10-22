# Operations Report — Windows 11 Setup Guide

This guide explains how to run Operations Report on a Windows 11 PC and connect
it to a remote Microsoft SQL Server using:

- SQL Server IP address
- TCP port
- SQL username
- SQL password
- Database name

## Important current status

The GitHub repository currently contains the complete interactive user
interface, but it still uses demonstration authentication and representative
report rows. The server-side SQL integration must be completed before the
application can execute real reports.

Do not enter real SQL credentials into the current browser interface. Database
credentials belong only in the server-side environment file described below.

The intended connection is:

```text
Windows 11 application
    ↓ TCP
Remote SQL Server IP and port
    ↓ SQL Server authentication
Username and password
    ↓
FOApp database
```

SQL authentication does not require Windows Integrated Authentication or
domain configuration.

## 1. Collect the SQL Server connection details

Obtain the following values from the SQL Server administrator:

```text
SQL Server IP:     Example: 192.168.1.50
SQL Server port:   Example: 1433
SQL username:      Example: reports_app
SQL password:      Do not share or commit this
Database:          FOApp
```

Use a dedicated, least-privilege reporting login. Do not use `sa`.

The account needs read access to:

- `FOApp.dbo.Rooms`
- `FOApp.dbo.Stays`
- `FOApp.dbo.Comments`
- `FOApp.dbo.Guests`
- The database and `GUESTS` table used by the Missed Check-Out report

The Missed Check-Out query reads:

```text
C:\ARRIVAL_DATA\ARRIVAL_DATA.csv
```

This file must exist on the machine running SQL Server. The SQL Server Database
Engine service account needs read permission. Your Windows 11 user and the
Node.js process do not read this file directly.

## 2. Install the required software

Open **PowerShell as Administrator**.

Install Git:

```powershell
winget install --id Git.Git -e
```

Install Node.js 22 LTS:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Install SQL Server Management Studio:

```powershell
winget install --id Microsoft.SQLServerManagementStudio -e
```

Close PowerShell, open a new PowerShell window, and verify:

```powershell
node --version
npm --version
git --version
```

Each command should print a version number.

## 3. Test the SQL Server network connection

Replace the example IP and port:

```powershell
Test-NetConnection -ComputerName 192.168.1.50 -Port 1433
```

The expected result is:

```text
TcpTestSucceeded : True
```

If it is `False`, check:

- SQL Server IP address
- SQL Server TCP port
- Required hotel/company network or VPN
- SQL Server service status
- TCP/IP configuration
- Server firewall

The application cannot connect until this test succeeds.

## 4. Test the credentials with SSMS

Open **SQL Server Management Studio** and enter:

```text
Server type:       Database Engine
Server name:       192.168.1.50,1433
Authentication:    SQL Server Authentication
Login:             <YOUR_SQL_USERNAME>
Password:          <YOUR_SQL_PASSWORD>
```

SQL Server uses a comma between the address and port:

```text
192.168.1.50,1433
```

After connecting, select **New Query** and run:

```sql
SELECT
    @@SERVERNAME AS ServerName,
    DB_NAME() AS CurrentDatabase,
    ORIGINAL_LOGIN() AS LoginName,
    GETDATE() AS ServerDateTime;
```

Test `FOApp`:

```sql
USE FOApp;

SELECT TOP (5)
    RoomNumber
FROM dbo.Rooms;
```

If both queries work, the Node.js backend can use the same connection details.

## 5. Enable SQL authentication when required

Only a SQL Server administrator should perform this step.

If a valid SQL login cannot connect because the server supports Windows
Authentication only:

1. Open SSMS with an administrator account.
2. Right-click the SQL Server instance.
3. Select **Properties**.
4. Open **Security**.
5. Select **SQL Server and Windows Authentication mode**.
6. Restart the SQL Server service.

## 6. Verify TCP/IP and the SQL Server port

On the SQL Server machine:

1. Open **SQL Server Configuration Manager**.
2. Open **SQL Server Network Configuration**.
3. Open **Protocols for the SQL Server instance**.
4. Enable **TCP/IP**.
5. Open TCP/IP **Properties**.
6. Select **IP Addresses**.
7. Under `IPAll`, verify the approved fixed port.

For port 1433:

```text
TCP Dynamic Ports:
TCP Port: 1433
```

Leave `TCP Dynamic Ports` blank when using a fixed port. Restart the SQL Server
service after changing the configuration.

If approved by the network administrator, add an inbound firewall rule on the
SQL Server machine:

```powershell
New-NetFirewallRule `
  -DisplayName "SQL Server TCP 1433" `
  -Direction Inbound `
  -Protocol TCP `
  -LocalPort 1433 `
  -Action Allow
```

Use the actual approved port. Restrict the rule to the required local network or
client addresses where possible.

## 7. Download the application

Open a normal PowerShell window:

```powershell
Set-Location C:\
New-Item -ItemType Directory -Path C:\Apps -Force
Set-Location C:\Apps

git clone https://github.com/yeasirfr-cmyk/SQL.git operations-report
Set-Location C:\Apps\operations-report
```

Enable pnpm:

```powershell
corepack enable
corepack prepare pnpm@10.34.3 --activate
```

Install dependencies:

```powershell
pnpm install
```

Check TypeScript:

```powershell
pnpm exec tsc --noEmit
```

## 8. Create the SQL Server environment file

After the real backend integration has been added, create:

```text
C:\Apps\operations-report\.env.local
```

Paste:

```dotenv
DB_SERVER=192.168.1.50
DB_PORT=1433
DB_DATABASE=FOApp
DB_USER=reports_app
DB_PASSWORD=REPLACE_WITH_REAL_PASSWORD

DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
DB_REQUEST_TIMEOUT_MS=120000
```

Replace the IP, port, username, and password with the real values.

Never place these values in a React component or a variable beginning with
`NEXT_PUBLIC_`. Do not commit `.env.local`.

Verify that it is ignored:

```powershell
git status
```

`.env.local` should not appear as an untracked file.

### TLS configuration

An internal SQL Server with a self-signed certificate commonly requires:

```dotenv
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

When SQL Server uses a certificate trusted by Windows, prefer:

```dotenv
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

Do not disable encryption as the first solution.

## 9. Node.js SQL connection

The server-side connection uses the official `mssql` package:

```ts
import sql from 'mssql'

const pool = await sql.connect({
  server: process.env.DB_SERVER!,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    min: 0,
    max: 5,
    idleTimeoutMillis: 30000,
  },
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS),
})
```

For SQL Server authentication, `mssql` uses its JavaScript driver and does not
require an ODBC driver.

The React frontend must call protected backend API endpoints. It must never
receive the database password or connection string.

## 10. Start the application

After the backend integration is complete:

```powershell
Set-Location C:\Apps\operations-report
pnpm dev
```

Open the address displayed by the terminal, normally:

```text
http://localhost:3000
```

Stop the application by pressing `Ctrl+C` in PowerShell.

The production server should bind to `127.0.0.1` so it is accessible only from
the local PC.

## 11. Update the application

```powershell
Set-Location C:\Apps\operations-report
git pull
pnpm install
pnpm exec tsc --noEmit
```

Restart the application after updating.

## 12. Troubleshooting

### `TcpTestSucceeded : False`

The SQL Server cannot be reached. Verify the IP, port, network/VPN, SQL Server
service, TCP/IP configuration, and firewall.

### `Login failed for user`

Verify:

- SQL Server Authentication is enabled
- Username and password are correct
- The login is not disabled
- The login has access to `FOApp`

### `Cannot open database FOApp`

The login exists but is not mapped to `FOApp`, or it lacks permission. Ask the
DBA to map the login and grant only the required read permissions.

### Certificate error

For an approved internal self-signed SQL Server, configure:

```dotenv
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

### `OPENROWSET` or arrival-file access error

SQL Server itself cannot read:

```text
C:\ARRIVAL_DATA\ARRIVAL_DATA.csv
```

Grant read permission to the SQL Server Database Engine service account on the
SQL Server machine. Giving permission to the Windows 11 application user will
not fix the SQL query.

### Empty report

Run the exact report query in SSMS. Confirm:

- The selected database is correct
- The arrival file is current
- SQL Server’s date and time are correct
- The source tables contain matching records

### Report timeout

Run the exact query in SSMS and measure its execution time. Investigate the SQL
query, indexes, arrival-file parsing, and SQL Server load before only increasing
the timeout.

## 13. Remaining production implementation

Before using real guest data, the repository still needs:

1. A server-only `mssql` connection pool.
2. Protected report API endpoints.
3. Real API responses in place of representative rows.
4. Secure server-side administrator authentication.
5. Server-authorized CSV and Excel exports.
6. Working database and arrival-file tests in Settings.
7. Safe server error handling that does not expose credentials or SQL details.

Until those items are implemented, the application remains a UI prototype and
does not query the remote SQL Server.
