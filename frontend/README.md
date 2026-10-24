# CarbonDesk CPMS frontend

React + TypeScript + Vite conversion of the approved CarbonDesk Stitch screens. The original exported HTML and PNG references remain unchanged in `stitch_carbondesk_cpms_platform/`.

## Stack

- React, TypeScript, Vite, React Router
- Locally compiled Tailwind CSS
- Lucide icons
- Typed local fixtures only

## Run

```bash
npm install
npm run dev
npm run build
```

## Routes

- `/`, `/login`, `/dashboard`, `/projects`, `/projects/new`
- `/projects/:projectId`, `/participants`, `/gis`, `/mrv`, `/mrv/new`
- Placeholder-only routes: `/documents`, `/reports`, `/audit`, `/settings`, `/users`, `/notifications`

## Demo limitations

This is a frontend prototype. Login is explicitly demo mode; no authentication, session, RBAC enforcement, API, database, storage, Mapbox, real geographic persistence, notifications, document persistence, or audit persistence has been implemented. File selection and GIS changes are browser-local prototype interactions only.
