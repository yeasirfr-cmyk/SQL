# Hotel Operations Reports

A polished interactive design and implementation handoff for two local SQL
Server hotel reports.

## Run this Make project

The development server is managed by Figma Make. Open the preview, enter any
non-empty values in the prototype login, and use the sidebar to review every
screen and interaction.

The current UI uses representative records and browser state for safe design
review. It does **not** expose hotel SQL credentials or guest records and its
prototype login is **not** production authentication.

## Production handoff

- `docs/ARCHITECTURE.md` — trust boundaries, API contract, SQL review, security.
- `docs/IMPLEMENTATION_GUIDE.md` — sequential Windows setup through production.
- `src/server/report-sql.ts` — preserved predefined SQL strings.
- `src/components/hotel-reports-app.tsx` — interactive responsive UI.

Before using real data, complete the protected Express/Payload server adapter
described in the guide and remove the sample report adapter.
