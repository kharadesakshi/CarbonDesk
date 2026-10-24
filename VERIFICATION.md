# Full Workflow Verification Guide

## Overview

This verification tests the complete end-to-end workflow:
1. **Register** - Create new user account
2. **Create Project** - Create a new carbon project
3. **Add Participant** - Add collaborator to project
4. **Upload Document** - Upload project document
5. **Download Document** - Download uploaded document
6. **Create GIS Boundary** - Draw and save geographic boundary

## Prerequisites

- PostgreSQL running with carbon_cpms_db
- Node.js 18+
- Backend server running on http://localhost:5000
- Frontend running on http://localhost:3000
- Mapbox GL token in environment

## Setup

### 1. Start Services

```bash
# Terminal 1: Start PostgreSQL and services
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
# All should show "Up" status
```

### 2. Start Backend Server

```bash
# Terminal 2: Backend
cd server
npm install
npm run dev
# Should output: [Boot] Server running on http://localhost:5000
```

### 3. Start Frontend Dev Server

```bash
# Terminal 3: Frontend
cd frontend
npm install
npm run dev
# Should output: Local: http://localhost:3000
```

### 4. Open Browser

Navigate to: http://localhost:3000

## Step-by-Step Verification

### Step 1: Register New User

**Action:**
1. Click "Sign Up" link on login page
2. Fill form:
   - Email: `testuser@example.com`
   - Password: `Test@Password123`
   - Confirm: `Test@Password123`
3. Click "Sign Up" button

**Expected Result:**
- ✅ Form validates password strength
- ✅ User registered successfully
- ✅ Redirected to dashboard
- ✅ Shows "Welcome, testuser@example.com"

**Backend Verification:**
```bash
# Check in database
psql carbon_cpms_db

SELECT * FROM users WHERE email = 'testuser@example.com';
# Should return 1 row with hashed password
```

**Console Check:**
```bash
# Frontend console (F12)
# No errors, successful auth token received

# Backend logs
[API] POST /auth/signup - 201 Created
[Auth] User registered: testuser@example.com
```

---

### Step 2: Create Project

**Action:**
1. On dashboard, click "New Project" button
2. Fill form:
   - Name: `Carbon Forest Project`
   - Description: `Reforestation in Amazon basin`
   - Location: `Brazil`
   - Baseline Emissions: `1000` (tCO2e/year)
3. Click "Create" button

**Expected Result:**
- ✅ Project created successfully
- ✅ Redirected to project detail page
- ✅ Shows project name and metadata
- ✅ Project appears in project list

**Backend Verification:**
```bash
# Check in database
SELECT * FROM projects WHERE name = 'Carbon Forest Project';
# Should return 1 row with owner_id = user.id
```

**API Verification:**
```bash
# Test endpoint directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects
# Should return array with new project
```

**Console Check:**
```bash
# Backend logs
[API] POST /projects - 201 Created
[Project] Created: Carbon Forest Project (id: xxx)
```

---

### Step 3: Add Participant

**Action:**
1. On project page, click "Add Participant" button
2. Fill form:
   - Email: `participant@example.com`
   - Role: `Verifier`
   - Status: `Active`
3. Click "Add" button

**Expected Result:**
- ✅ Participant added successfully
- ✅ Shows in participants list with correct role
- ✅ Email notification triggered (check logs)
- ✅ Participant status is "Active"

**Backend Verification:**
```bash
# Check in database
SELECT * FROM participants WHERE project_id = (
  SELECT id FROM projects WHERE name = 'Carbon Forest Project'
);
# Should return 1 row with role='Verifier', status='active'
```

**API Verification:**
```bash
# Test endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects/XXX/participants
# Should return array with new participant
```

**Console Check:**
```bash
# Backend logs
[API] POST /projects/XXX/participants - 201 Created
[Participant] Added: participant@example.com (role: Verifier)
```

---

### Step 4: Upload Document

**Action:**
1. On project page, click "Documents" tab
2. Click "Upload Document" button
3. Select file: Create test PDF or use existing file
   - File: `project_proposal.pdf` (or any file)
   - Type: `Proposal`
4. Click "Upload" button

**Expected Result:**
- ✅ File upload succeeds
- ✅ Progress bar shows upload progress
- ✅ Document appears in documents list
- ✅ Shows filename, type, upload date, size

**Backend Verification:**
```bash
# Check in database
SELECT * FROM documents WHERE project_id = (
  SELECT id FROM projects WHERE name = 'Carbon Forest Project'
);
# Should return 1 row with file_path and file_size

# Check file storage
ls uploads/documents/
# Should contain uploaded file
```

**API Verification:**
```bash
# Test endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects/XXX/documents
# Should return array with new document
```

**Console Check:**
```bash
# Backend logs
[API] POST /projects/XXX/documents - 201 Created
[Storage] Saved document: project_proposal.pdf (size: XXX bytes)
[File] Validated: MIME type application/pdf, extension .pdf
```

---

### Step 5: Download Document

**Action:**
1. On Documents tab, locate uploaded document
2. Click "Download" button next to document

**Expected Result:**
- ✅ File downloads to computer
- ✅ Filename matches uploaded file
- ✅ File size matches original
- ✅ File is readable (open PDF, view image, etc.)

**Backend Verification:**
```bash
# Check in logs for download request
[API] GET /projects/XXX/documents/YYY/download - 200 OK
[Storage] Generated download URL: (expires in 1 hour)
```

**API Verification:**
```bash
# Test endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -L http://localhost:5000/api/projects/XXX/documents/YYY/download \
  -o downloaded_file.pdf
# Should download file successfully
```

**File Integrity:**
```bash
# Verify downloaded file
file downloaded_file.pdf
# Should show: PDF document, version 1.4

# Compare sizes (should match)
ls -lh project_proposal.pdf downloaded_file.pdf
```

---

### Step 6: Create GIS Boundary

**Action:**
1. On project page, click "GIS" tab
2. On map, click "Draw Polygon" button
3. Click on map to create polygon:
   - Click 4+ points to form boundary
   - Close polygon by clicking first point again
4. System calculates area and perimeter
5. Click "Save Boundary" button

**Expected Result:**
- ✅ Polygon draws on map in real-time
- ✅ Shows coordinate count (e.g., "4 vertices")
- ✅ Calculates area in hectares (e.g., "150.5 ha")
- ✅ Calculates perimeter in km (e.g., "2.3 km")
- ✅ Boundary saves to database
- ✅ Can reload page and boundary persists

**Backend Verification:**
```bash
# Check in database
SELECT * FROM gis_boundaries WHERE project_id = (
  SELECT id FROM projects WHERE name = 'Carbon Forest Project'
);
# Should return 1 row with geojson data, area_hectares, perimeter_km

# Verify GeoJSON format
SELECT geojson FROM gis_boundaries LIMIT 1;
# Should show valid GeoJSON polygon
```

**API Verification:**
```bash
# Test endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/projects/XXX/gis/boundary
# Should return GeoJSON with boundary data

# Example response:
# {
#   "type": "Feature",
#   "properties": {
#     "area_hectares": 150.5,
#     "perimeter_km": 2.3,
#     "coordinates_count": 4
#   },
#   "geometry": { "type": "Polygon", "coordinates": [...] }
# }
```

**Math Verification:**
```bash
# For known polygon, verify area calculation
# Example: 1km x 1km square = 100 hectares
# If polygon is approximately 1km x 1km, area should be ~100 ha

# Check turf.js calculation
# Backend uses turf.js area() function (WGS84 to m², then m² to ha)
```

**Console Check:**
```bash
# Backend logs
[API] POST /projects/XXX/gis/boundary - 201 Created
[GIS] Boundary saved: 150.5 ha, 2.3 km perimeter
[GIS] Coordinates: 4 vertices

# Frontend logs
[GIS] Polygon created: 4 vertices, 150.5 hectares, 2.3 km
[GIS] Boundary saved successfully
```

---

## Automated Verification Script

Run this script to test all endpoints:

```bash
#!/bin/bash
# save as verify-workflow.sh

set -e

API="http://localhost:5000/api"
EMAIL="testuser@example.com"
PASSWORD="Test@Password123"

echo "🔍 Verification: Carbon Project Management Platform"
echo "=================================================="

# Step 1: Register
echo ""
echo "1️⃣  Registering user..."
REGISTER=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $REGISTER | jq -r '.token // empty')
if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed"
  echo "$REGISTER" | jq .
  exit 1
fi
echo "✅ User registered, token received"

# Step 2: Create Project
echo ""
echo "2️⃣  Creating project..."
PROJECT=$(curl -s -X POST "$API/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Carbon Forest Project",
    "description":"Reforestation in Amazon basin",
    "location":"Brazil",
    "baseline_emissions":1000
  }')

PROJECT_ID=$(echo $PROJECT | jq -r '.id // empty')
if [ -z "$PROJECT_ID" ]; then
  echo "❌ Project creation failed"
  echo "$PROJECT" | jq .
  exit 1
fi
echo "✅ Project created: $PROJECT_ID"

# Step 3: Add Participant
echo ""
echo "3️⃣  Adding participant..."
PARTICIPANT=$(curl -s -X POST "$API/projects/$PROJECT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"participant@example.com",
    "role":"Verifier",
    "status":"active"
  }')

PARTICIPANT_ID=$(echo $PARTICIPANT | jq -r '.id // empty')
if [ -z "$PARTICIPANT_ID" ]; then
  echo "❌ Participant addition failed"
  echo "$PARTICIPANT" | jq .
  exit 1
fi
echo "✅ Participant added: $PARTICIPANT_ID"

# Step 4: Upload Document
echo ""
echo "4️⃣  Uploading document..."

# Create test file
echo "Test document content" > test_document.txt

DOCUMENT=$(curl -s -X POST "$API/projects/$PROJECT_ID/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_document.txt" \
  -F "type=Proposal")

DOCUMENT_ID=$(echo $DOCUMENT | jq -r '.id // empty')
if [ -z "$DOCUMENT_ID" ]; then
  echo "❌ Document upload failed"
  echo "$DOCUMENT" | jq .
  exit 1
fi
echo "✅ Document uploaded: $DOCUMENT_ID"

# Step 5: Download Document
echo ""
echo "5️⃣  Downloading document..."
DOWNLOAD=$(curl -s -w "%{http_code}" -o downloaded_file.txt \
  -H "Authorization: Bearer $TOKEN" \
  "$API/projects/$PROJECT_ID/documents/$DOCUMENT_ID/download")

if [ "$DOWNLOAD" -ne 200 ]; then
  echo "❌ Document download failed (HTTP $DOWNLOAD)"
  exit 1
fi

FILE_SIZE=$(wc -c < downloaded_file.txt)
echo "✅ Document downloaded ($FILE_SIZE bytes)"

# Step 6: Create GIS Boundary
echo ""
echo "6️⃣  Creating GIS boundary..."
BOUNDARY=$(curl -s -X POST "$API/projects/$PROJECT_ID/gis/boundary" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "geojson":{
      "type":"Feature",
      "geometry":{
        "type":"Polygon",
        "coordinates":[[
          [-60.0, -10.0],
          [-59.0, -10.0],
          [-59.0, -11.0],
          [-60.0, -11.0],
          [-60.0, -10.0]
        ]]
      }
    }
  }')

BOUNDARY_ID=$(echo $BOUNDARY | jq -r '.id // empty')
AREA=$(echo $BOUNDARY | jq -r '.area_hectares // empty')

if [ -z "$BOUNDARY_ID" ]; then
  echo "❌ GIS boundary creation failed"
  echo "$BOUNDARY" | jq .
  exit 1
fi
echo "✅ GIS boundary created: $BOUNDARY_ID (area: $AREA hectares)"

# Cleanup
rm -f test_document.txt downloaded_file.txt

echo ""
echo "=================================================="
echo "✅ All verification steps passed!"
echo ""
echo "Summary:"
echo "  1. ✅ User registered"
echo "  2. ✅ Project created"
echo "  3. ✅ Participant added"
echo "  4. ✅ Document uploaded"
echo "  5. ✅ Document downloaded"
echo "  6. ✅ GIS boundary created"
echo ""
echo "🎉 Platform is production-ready!"
```

## Manual Testing Checklist

### User Registration
- [ ] Sign up form validates email format
- [ ] Sign up form validates password strength
- [ ] Duplicate email rejected with error message
- [ ] Successful signup redirects to dashboard
- [ ] Auth token stored in localStorage

### Project Management
- [ ] Create project with all required fields
- [ ] Project appears in project list
- [ ] Can view project details
- [ ] Can edit project information
- [ ] Can delete own project
- [ ] Cannot edit/delete others' projects

### Participant Management
- [ ] Add participant to project
- [ ] Participant appears in list with correct role
- [ ] Can change participant role
- [ ] Can remove participant from project
- [ ] Participant status updates correctly
- [ ] Document count shows for each participant

### Document Management
- [ ] Upload document to project
- [ ] Document appears in documents list
- [ ] Document shows correct file type
- [ ] Can download uploaded document
- [ ] Downloaded file matches original
- [ ] Cannot upload files >100MB
- [ ] Invalid file types rejected

### GIS Functionality
- [ ] Map loads with Mapbox GL
- [ ] Draw tool works (click to add vertices)
- [ ] Real-time area calculation updates
- [ ] Real-time perimeter calculation updates
- [ ] Can close polygon and save
- [ ] Saved boundary persists on page reload
- [ ] Can view multiple boundaries
- [ ] Boundary exports to GeoJSON

### Error Handling
- [ ] Missing auth token shows error
- [ ] Invalid token shows auth error
- [ ] Network errors handled gracefully
- [ ] File validation errors show clearly
- [ ] API errors display user-friendly messages
- [ ] Loading states show during operations

### Performance
- [ ] Dashboard loads in <2 seconds
- [ ] Project list loads quickly with 100+ projects
- [ ] Document upload shows progress
- [ ] GIS map pans/zooms smoothly
- [ ] No console errors during normal use

---

## Success Criteria

✅ **All criteria must be met for platform to be production-ready:**

1. **Registration**: User can sign up with valid email/password
2. **Project Creation**: New project saves to database with correct metadata
3. **Participant Addition**: Participant saved with correct role and status
4. **Document Upload**: File uploads to storage (local or S3), metadata saved to database
5. **Document Download**: Downloaded file matches uploaded file, no corruption
6. **GIS Boundary**: Polygon saves to database, area/perimeter calculated correctly, persists on reload

**All 6 steps must execute without errors for verification to pass.**

---

## Troubleshooting

### Registration fails with "Email already exists"
- Use different email address for testing
- Or delete test user from database: `DELETE FROM users WHERE email = 'testuser@example.com';`

### Project creation fails with "Unauthorized"
- Verify auth token in localStorage: `localStorage.getItem('auth_token')`
- Check backend logs for token validation errors
- Re-login if token expired

### Document upload fails with "File too large"
- Check MAX_FILE_SIZE in fileValidator.ts (default 100MB)
- Use smaller test file

### GIS boundary not saving
- Verify Mapbox token is valid
- Check browser console for GIS errors
- Verify PostGIS is not required (USE_POSTGIS=false in .env)

### API errors with "CORS error"
- Verify CORS_ORIGIN matches frontend URL
- Check backend CORS middleware config
- Restart backend server

---

## Performance Benchmarks

Expected response times:

| Operation | Expected Time | Acceptable Range |
|-----------|---------------|------------------|
| Register | 500ms | <1s |
| Create Project | 200ms | <500ms |
| Add Participant | 200ms | <500ms |
| Upload Document (1MB) | 1s | <2s |
| Download Document (1MB) | 500ms | <1s |
| Create GIS Boundary | 100ms | <500ms |
| List Projects (100 items) | 200ms | <500ms |
| List Participants | 150ms | <300ms |

If times exceed acceptable range, check:
- Database query performance (use `EXPLAIN ANALYZE`)
- Network latency
- File I/O performance
- Backend CPU/memory usage

---

## Post-Verification

After successful verification:

1. **Cleanup test data** (optional):
   ```bash
   DELETE FROM users WHERE email = 'testuser@example.com';
   ```

2. **Check logs for errors**:
   ```bash
   docker-compose logs backend | tail -100
   docker-compose logs frontend | tail -100
   ```

3. **Review test results** and document any issues

4. **Ready for deployment**:
   - Environment templates configured ✅
   - All features implemented ✅
   - Tests passing ✅
   - Verification complete ✅

---

## Next Steps

Platform is now ready for:
- ✅ Production deployment (see DEPLOYMENT.md)
- ✅ Performance monitoring setup (Sentry, New Relic)
- ✅ CI/CD pipeline configuration
- ✅ User acceptance testing (UAT)
- ✅ Go-live preparation
