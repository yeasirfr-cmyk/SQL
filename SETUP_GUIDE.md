# Operations Report — Simple Windows 11 Installation

This guide is written for someone who is not a developer. Follow the steps in
order.

The working standalone application is in the `local-app` folder. It includes:

- Real Microsoft SQL Server connectivity using IP, port, username, and password
- Secure administrator login
- No default or demo password
- A first-administrator setup command
- Username and password changes from Settings
- Real Missed Check-Out and Yesterday’s Comments reports
- Server-generated CSV and Excel downloads
- Database and arrival-file connection tests
- Localhost-only operation by default

## What you need before starting

Ask the SQL Server administrator for:

```text
SQL Server IP address
SQL Server TCP port
SQL Server username
SQL Server password
Database name
```

Example:

```text
IP:       192.168.1.50
Port:     1433
Username: reports_app
Database: FOApp
```

Do not send the real SQL password through email, chat, or GitHub.

## Step 1 — Install Node.js

1. Click the Windows Start button.
2. Type `PowerShell`.
3. Right-click **Windows PowerShell**.
4. Click **Run as administrator**.
5. Run:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Wait for the installation to finish. Close PowerShell and open it again.

Verify:

```powershell
node --version
npm --version
```

Both commands must display version numbers.

## Step 2 — Install SQL Server Management Studio

Open PowerShell as Administrator and run:

```powershell
winget install --id Microsoft.SQLServerManagementStudio -e
```

SQL Server Management Studio, or SSMS, is used to confirm that the connection
information works before configuring the application.

## Step 3 — Test the SQL Server network connection

Open normal PowerShell. Replace the example IP and port:

```powershell
Test-NetConnection -ComputerName 192.168.1.50 -Port 1433
```

You need:

```text
TcpTestSucceeded : True
```

If it says `False`, stop and ask the SQL Server or network administrator to
check:

- The IP address and port
- SQL Server TCP/IP
- SQL Server service status
- Windows Firewall on the SQL Server machine
- Your company network or VPN connection

The application cannot connect until this test succeeds.

## Step 4 — Test the username and password in SSMS

Open SQL Server Management Studio.

Enter:

```text
Server type:       Database Engine
Server name:       YOUR_IP,YOUR_PORT
Authentication:    SQL Server Authentication
Login:             YOUR_SQL_USERNAME
Password:          YOUR_SQL_PASSWORD
```

For example:

```text
Server name: 192.168.1.50,1433
```

SQL Server uses a comma between the IP and port.

Click **Connect**, then click **New Query** and run:

```sql
USE FOApp;

SELECT
    @@SERVERNAME AS ServerName,
    DB_NAME() AS DatabaseName,
    ORIGINAL_LOGIN() AS LoginName,
    GETDATE() AS ServerDateTime;

SELECT TOP (5)
    RoomNumber
FROM dbo.Rooms;
```

Do not continue until this succeeds.

## Step 5 — Download the application

1. Open https://github.com/yeasirfr-cmyk/SQL
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Open your Downloads folder.
5. Right-click the ZIP file.
6. Click **Extract All**.
7. Extract it to:

```text
C:\OperationsReport
```

Depending on how Windows extracts it, the folder may be:

```text
C:\OperationsReport\SQL-main
```

Open that folder. You should see a folder named:

```text
local-app
```

## Step 6 — Open PowerShell in `local-app`

Open the `local-app` folder in File Explorer.

Click the File Explorer address bar, type:

```text
powershell
```

Press Enter.

Confirm that you are in the correct folder:

```powershell
Get-ChildItem
```

You should see:

```text
INSTALL_WINDOWS.ps1
START_WINDOWS.cmd
package.json
.env.example
server
src
```

## Step 7 — Run the installer

In the PowerShell window, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\INSTALL_WINDOWS.ps1
```

The installer will:

1. Install the application packages.
2. Create a private `.env` settings file.
3. Generate a random session secret.
4. Open the settings file in Notepad.
5. Check the application code.
6. Ask you to create the first administrator.
7. Build the application.

## Step 8 — Enter the SQL Server information

The installer opens `.env` in Notepad.

Find:

```dotenv
DB_SERVER=192.168.1.50
DB_PORT=1433
DB_DATABASE=FOApp
DB_USER=reports_app
DB_PASSWORD=REPLACE_WITH_REAL_SQL_PASSWORD
```

Replace the values with the connection details that already worked in SSMS.

Example:

```dotenv
DB_SERVER=10.10.20.15
DB_PORT=1433
DB_DATABASE=FOApp
DB_USER=operations_reports
DB_PASSWORD=<YOUR_SQL_PASSWORD>
```

Also review:

```dotenv
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
DB_REQUEST_TIMEOUT_MS=120000
ARRIVAL_FILE_PATH=C:\ARRIVAL_DATA\ARRIVAL_DATA.csv
```

For an internal SQL Server using a self-signed certificate,
`DB_TRUST_SERVER_CERTIFICATE=true` is normally required.

Do not change:

```dotenv
HOST=127.0.0.1
PORT=3001
COOKIE_SECURE=false
```

`127.0.0.1` keeps the application local to this Windows PC.

Save the file and close Notepad.

The `.env` file contains the SQL password. Never upload it to GitHub.

## Step 9 — Create the administrator

The installer asks:

```text
Choose administrator username:
Choose administrator password:
Type the password again:
```

Choose your own username.

The password must contain at least 12 characters. Nothing appears on screen
while you type the password. This is normal.

There is no default username or password.

The password is stored only as a bcrypt hash in:

```text
local-app\data\admin.json
```

The original password is not stored.

## Step 10 — Start Operations Report

After installation finishes, double-click:

```text
START_WINDOWS.cmd
```

A black command window opens. Keep it open while using the application.

Your browser should open:

```text
http://127.0.0.1:3001
```

Sign in with the administrator username and password you created.

To stop the application:

1. Click the black command window.
2. Press `Ctrl+C`.
3. Close the window.

## Step 11 — Test the real SQL connection

After signing in:

1. Open **Settings**.
2. Click **Test connection**.
3. You should see `Database connection succeeded`.
4. Click **Test file access**.
5. You should see `SQL Server can read the arrival file`.

If both tests work, open each report and click **Run report**.

The application now:

1. Sends a protected request to the local Express server.
2. Reads SQL settings from `.env`.
3. Connects to SQL Server using the configured IP and port.
4. Authenticates with the SQL username and password.
5. Runs the predefined report SQL.
6. Returns real rows to the browser.

## Step 12 — Change the application username or password

1. Sign in.
2. Open **Settings**.
3. Find **Change administrator credentials**.
4. Enter the current password.
5. Enter a new username, a new password, or both.
6. For a new password, type it again in the confirmation field.
7. Click **Update credentials**.

Changing credentials invalidates older sessions. The current browser receives a
new secure session automatically.

This changes only the Operations Report administrator account. It does not
change the SQL Server username or password.

To change SQL Server credentials:

1. Stop the application.
2. Open `local-app\.env` in Notepad.
3. Change `DB_USER` and `DB_PASSWORD`.
4. Save the file.
5. Start the application again.

## Step 13 — Arrival CSV requirement

The Missed Check-Out query reads:

```text
C:\ARRIVAL_DATA\ARRIVAL_DATA.csv
```

This path is on the computer running SQL Server, not necessarily the Windows 11
PC running Operations Report.

The SQL Server Database Engine service account must have permission to read the
file.

If **Test file access** fails:

1. Confirm that the file exists on the SQL Server computer.
2. Open SQL Server Configuration Manager on that computer.
3. Identify the Database Engine service account.
4. Grant that service account read permission to the file and folder.
5. Run the test again.

## Step 14 — Update after downloading a newer ZIP

Before replacing the application, back up:

```text
local-app\.env
local-app\data\admin.json
```

Download and extract the new ZIP. Copy those two items into the new
`local-app` folder, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\INSTALL_WINDOWS.ps1
```

The installer keeps an existing administrator account.

## Troubleshooting

### Node or npm is not recognized

Install Node.js:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

Close and reopen PowerShell.

### `TcpTestSucceeded : False`

The PC cannot reach SQL Server. Check the IP, port, VPN/network, SQL Server
TCP/IP, and firewall.

### Login failed for SQL Server

Confirm the same IP, port, username, and password work in SSMS using SQL Server
Authentication.

### Application administrator login fails

Use the username and password created by `INSTALL_WINDOWS.ps1`. SQL Server
credentials do not sign in to the application.

### Certificate error

For an approved internal self-signed server, use:

```dotenv
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

Restart the application.

### `OPENROWSET` or file access error

SQL Server cannot read the arrival file. Fix the file path and SQL Server
service-account permission on the SQL Server computer.

### Port 3001 is already in use

Close another Operations Report window or change:

```dotenv
PORT=3002
```

Then open:

```text
http://127.0.0.1:3002
```

Update `START_WINDOWS.cmd` if you permanently change the port.

### Report returns no rows

Run the same SQL query in SSMS. An empty result can be correct. Also check the
SQL Server date, source data, and arrival file.

## Security notes

- The application listens on `127.0.0.1` by default.
- SQL credentials are kept only in the local `.env` file.
- The browser never receives the SQL password.
- Administrator passwords are bcrypt-hashed.
- Sessions use signed HTTP-only SameSite cookies.
- Protected POST requests require a CSRF token.
- Login attempts are rate-limited.
- SQL text is predefined on the server.
- Export requests use server-held authorized results.
- CSV and Excel text are protected against spreadsheet formula injection.
