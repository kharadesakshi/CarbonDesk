# Carbon Project Management Platform (CarbonDesk CPMS)

A full-stack application for managing carbon offset projects, participants, and monitoring-reporting-verification (MRV) data. Built with React/TypeScript frontend and Node/Express backend, using Supabase PostgreSQL for data storage.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast build and development
- **TailwindCSS** for styling
- **React Hook Form** + **Zod** for form validation
- **Axios** for HTTP client
- **Mapbox GL JS** for GIS mapping
- **Lucide React** for icons

### Backend
- **Node.js** with Express framework
- **TypeScript** with strict mode
- **Sequelize** ORM for database abstraction
- **PostgreSQL** (via Supabase) for data persistence
- **JWT** (jsonwebtoken) for authentication
- **Bcryptjs** for password hashing
- **Multer** for file upload handling
- **Zod** for runtime validation
- **CORS** for cross-origin requests

### Database
- **Supabase PostgreSQL** for production database
- **Migrations** support via Sequelize

## Project Structure

```
carbon_project/
├── frontend/                    # React/Vite application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components (routes)
│   │   ├── services/           # API client services
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript interfaces
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── styles/             # Global styles
│   │   ├── AppNew.tsx          # Main app with routing
│   │   └── main.tsx            # Entry point
│   ├── dist/                   # Built files (production)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Node/Express backend
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API routes
│   │   ├── models/             # Sequelize data models
│   │   ├── migrations/         # Database migrations
│   │   ├── services/           # Business logic (auth, storage)
│   │   ├── middleware/         # Express middleware
│   │   ├── validators/         # Zod validation schemas
│   │   ├── config/             # Configuration
│   │   ├── app.ts              # Express app setup
│   │   └── server.ts           # Entry point
│   ├── dist/                   # Compiled JavaScript (production)
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example                 # Environment template (root)
└── README.md                    # This file
```

## Features

### Authentication
- **User Registration** with email & password
- **JWT-based Login** with access tokens
- **Password Hashing** with bcryptjs
- **Protected Routes** with authentication checks
- **User Profile** endpoint (/me)

### Projects
- **CRUD Operations** - Create, read, update, delete projects
- **Project Metadata** - Name, type, description, location, dates
- **GIS Integration** - Store project boundaries as GeoJSON
- **Participant Tracking** - Link participants to projects
- **Document Storage** - Attach project-level documentation
- **Status Management** - Draft, active, under_review, validated, archived

### Participants
- **Participant Management** - Add/edit/remove participants per project
- **Participant Metadata** - Name, contact info, type, location
- **Enrollment Dates** - Track consent and enrollment dates
- **Document Association** - Link documents to participants
- **Searchable** - Filter by name, email, code, plot ID

### Documents
- **File Upload** - Store documents with Multer
- **Storage Abstraction** - Support for local and S3 storage
- **Document Types** - Project Design Document, Baseline Report, Monitoring Report, etc.
- **Metadata Tracking** - File name, size, MIME type, upload date
- **Project & Participant Hierarchy** - Link to projects and participants
- **Download** - Retrieve documents with signed URLs (S3)

### GIS Mapping
- **Boundary Definition** - Store project boundaries as GeoJSON polygons
- **Map Integration** - Mapbox GL JS for visualization
- **Area Calculation** - Compute project area
- **Coordinate System** - Support WGS84 and other systems
- **Edit History** - Track last edited timestamp

## Getting Started

### Prerequisites
- **Node.js** 16+ (includes npm)
- **PostgreSQL** 12+ (via Supabase or local)
- **Mapbox Account** (free tier available for GIS features)

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd carbon_project

# Frontend
cd frontend
npm install

# Backend
cd ../server
npm install
```

### 2. Environment Setup

#### Frontend (.env file - not in repo)
Create `.env` in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

#### Backend (.env file - in server/)
Copy and configure `server/.env` from `server/.env.example`:

```bash
cp .env.example .env
```

Edit `server/.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host.supabase.co:5432/postgres?schema=public

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d

# Storage
STORAGE_PROVIDER=local  # or 's3'
STORAGE_LOCAL_PATH=./uploads

# S3 (optional, if STORAGE_PROVIDER=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-bucket-name

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

#### Option A: Supabase (Recommended for Production)

1. Create a free Supabase project at https://supabase.com
2. Copy the PostgreSQL connection string
3. Paste into `server/.env` as `DATABASE_URL`
4. Run migrations:

```bash
cd server
npm run migrate
```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally, then:
createdb carbon_project

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://localhost/carbon_project

# Run migrations
cd server
npm run migrate
```

### 4. Start Development Servers

#### Terminal 1 - Backend (http://localhost:3000)
```bash
cd server
npm run dev
```

#### Terminal 2 - Frontend (http://localhost:5173)
```bash
cd frontend
npm run dev
```

### 5. Test the Application

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Create a project
4. Add participants
5. Upload documents
6. Configure GIS boundaries

## Available Scripts

### Frontend

```bash
npm run dev        # Start dev server on http://localhost:5173
npm run build      # Build for production (Vite)
npm run preview    # Preview production build
npm run lint       # Run ESLint (if configured)
```

### Backend

```bash
npm run dev        # Start dev server with ts-node (watches changes)
npm run build      # Compile TypeScript to JavaScript (dist/)
npm run start      # Run compiled backend
npm run migrate    # Run Sequelize migrations
```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Routes
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login & receive JWT
- `GET /auth/me` - Get current user (requires token)

### Projects Routes
- `GET /projects` - List all projects (paginated)
- `GET /projects/:id` - Get project details
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Participants Routes
- `GET /projects/:projectId/participants` - List participants
- `GET /projects/:projectId/participants/:id` - Get participant
- `POST /projects/:projectId/participants` - Create participant
- `PUT /participants/:id` - Update participant
- `DELETE /participants/:id` - Delete participant

### Documents Routes
- `GET /projects/:projectId/documents` - List project documents
- `GET /participants/:participantId/documents` - List participant documents
- `POST /participants/:participantId/documents/upload` - Upload participant document
- `POST /projects/:projectId/documents/upload` - Upload project document
- `GET /documents/:id` - Get document metadata
- `GET /documents/:id/download` - Download document
- `DELETE /documents/:id` - Delete document

### GIS Routes
- `GET /projects/:projectId/gis` - Get project GIS data
- `POST /projects/:projectId/gis` - Save/update GIS data
- `DELETE /projects/:projectId/gis` - Delete GIS data

### Error Handling

All endpoints return JSON with consistent error format:

```json
{
  "error": "Error message here"
}
```

Validation errors include details array:

```json
{
  "error": "Validation failed.",
  "details": ["field: error message", ...]
}
```

## Authentication

### JWT Token Flow

1. **Register**: POST `/auth/register` with email & password → returns token
2. **Login**: POST `/auth/login` with email & password → returns token
3. **Protected Requests**: Include `Authorization: Bearer <token>` header
4. **Token Expiry**: Default 7 days (configurable via JWT_EXPIRY)

### Example Request

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Storage

### Local Storage (Development)
- Files stored in `./server/uploads` directory
- Fast for development/testing
- No external dependencies

### S3 Storage (Production)
- Files stored in AWS S3 bucket
- Set `STORAGE_PROVIDER=s3` in .env
- Configure AWS credentials
- Supports signed URLs for downloads

## Deployment

### Frontend (Vercel/Netlify)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel/Netlify
```

### Backend (Heroku/Render)

```bash
cd server
npm run build
npm start
# Deploy with DATABASE_URL and JWT_SECRET env vars
```

### Database (Supabase)
- Already hosted and managed
- Just point `DATABASE_URL` to Supabase connection string

## Development Workflow

### Adding a New Feature

1. **Backend First**
   - Create Sequelize model (if needed)
   - Create migration
   - Create controller with business logic
   - Create routes
   - Add Zod validators

2. **Frontend Next**
   - Create API service method
   - Create TypeScript types/interfaces
   - Create Zod schema for forms
   - Create React component
   - Add routes in AppNew.tsx

3. **Test**
   - Manual testing via UI
   - Verify API responses
   - Check database state

### TypeScript Strict Mode

The backend uses TypeScript with `"strict": true` to catch type errors early. Always:
- Define explicit types for function parameters
- Return explicit types from functions
- Avoid `any` types when possible
- Cast route params: `const id = req.params.id as string`

## Troubleshooting

### Cannot connect to database
- Verify `DATABASE_URL` in `.env`
- Check Supabase connection limit (free tier: 10)
- Ensure PostgreSQL service is running (local)

### CORS errors
- Verify `CORS_ORIGIN` in backend .env matches frontend URL
- Check `VITE_API_URL` in frontend .env

### Mapbox not showing
- Verify `VITE_MAPBOX_ACCESS_TOKEN` in frontend .env
- Get token from https://account.mapbox.com/tokens/

### File upload fails
- Verify `STORAGE_LOCAL_PATH` directory exists and is writable
- For S3: check AWS credentials and bucket permissions
- Multer has 10MB default file size limit

### Port already in use
- Backend: change `PORT` in `.env` and update CORS_ORIGIN
- Frontend: Vite usually picks next port (5174, 5175...)

## License

Proprietary - Carbon Project Management Platform

## Support

For issues or questions, contact the development team.
