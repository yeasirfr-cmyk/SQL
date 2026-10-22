# Operations Report

A standalone Windows 11 application for securely running two predefined
Microsoft SQL Server reports.

## Windows installation

The real local application is in [`local-app`](local-app).

Start with [`SETUP_GUIDE.md`](SETUP_GUIDE.md). The short version is:

1. Download the GitHub repository ZIP.
2. Extract it and open `local-app`.
3. Run `INSTALL_WINDOWS.ps1`.
4. Enter the SQL Server IP, port, database, username, and password in `.env`.
5. Create the first administrator when prompted.
6. Double-click `START_WINDOWS.cmd`.
7. Open `http://127.0.0.1:3001`.

There are no demo or default login credentials.

## Security

- SQL credentials remain in the local server-side `.env` file.
- Administrator passwords are stored as bcrypt hashes.
- Sessions use signed HTTP-only cookies and CSRF tokens.
- Report SQL is predefined and cannot be entered from the browser.
- Exports are generated from authorized server-held results.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the API and SQL review.
