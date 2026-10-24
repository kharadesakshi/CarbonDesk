#!/bin/bash

# Automated Workflow Verification Script
# Carbon Project Management Platform
# 
# Tests: Register → Create Project → Add Participant → Upload Doc → Download → GIS
# Usage: bash verify-workflow.sh

set -e

# Configuration
API="http://localhost:5000/api"
EMAIL="testuser-$(date +%s)@example.com"
PASSWORD="Test@Password123"
TIMEOUT=30

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_step() {
  echo ""
  echo -e "${YELLOW}$1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

check_server() {
  log_step "Checking if backend is running..."
  if ! curl -s "$API/health" > /dev/null 2>&1; then
    log_error "Backend server not running at $API"
    echo "Start backend with: cd server && npm run dev"
    exit 1
  fi
  log_success "Backend is running"
}

# Main Verification
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Verification: Carbon Project Management Platform          ║"
echo "║  Testing: Register → Project → Participant → Doc → GIS     ║"
echo "╚════════════════════════════════════════════════════════════╝"

check_server

# Step 1: Register
log_step "Step 1️⃣  - User Registration"
echo "Registering user: $EMAIL"

REGISTER_RESPONSE=$(curl -s -X POST "$API/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  --max-time $TIMEOUT)

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty' 2>/dev/null)
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
  log_error "Registration failed"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

log_success "User registered successfully"
echo "  Email: $EMAIL"
echo "  User ID: $USER_ID"
echo "  Token: ${TOKEN:0:20}..."

# Step 2: Create Project
log_step "Step 2️⃣  - Project Creation"
echo "Creating project: Carbon Forest Project"

PROJECT_RESPONSE=$(curl -s -X POST "$API/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Carbon Forest Project",
    "description":"Reforestation in Amazon basin",
    "location":"Brazil",
    "baseline_emissions":1000
  }' \
  --max-time $TIMEOUT)

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id // empty' 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
  log_error "Project creation failed"
  echo "Response: $PROJECT_RESPONSE"
  exit 1
fi

log_success "Project created successfully"
echo "  Project ID: $PROJECT_ID"
echo "  Name: Carbon Forest Project"

# Step 3: Add Participant
log_step "Step 3️⃣  - Add Participant"
echo "Adding participant: participant@example.com"

PARTICIPANT_RESPONSE=$(curl -s -X POST "$API/projects/$PROJECT_ID/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"participant-'$(date +%s)'@example.com",
    "role":"Verifier",
    "status":"active"
  }' \
  --max-time $TIMEOUT)

PARTICIPANT_ID=$(echo "$PARTICIPANT_RESPONSE" | jq -r '.id // empty' 2>/dev/null)

if [ -z "$PARTICIPANT_ID" ]; then
  log_error "Participant addition failed"
  echo "Response: $PARTICIPANT_RESPONSE"
  exit 1
fi

log_success "Participant added successfully"
echo "  Participant ID: $PARTICIPANT_ID"
echo "  Role: Verifier"

# Step 4: Upload Document
log_step "Step 4️⃣  - Upload Document"
echo "Creating and uploading test document..."

# Create test file
TEST_FILE="test_document_$(date +%s).txt"
echo "Test document content - $(date)" > "$TEST_FILE"
TEST_FILE_SIZE=$(wc -c < "$TEST_FILE")

DOCUMENT_RESPONSE=$(curl -s -X POST "$API/projects/$PROJECT_ID/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_FILE" \
  -F "type=Proposal" \
  --max-time $TIMEOUT)

DOCUMENT_ID=$(echo "$DOCUMENT_RESPONSE" | jq -r '.id // empty' 2>/dev/null)

if [ -z "$DOCUMENT_ID" ]; then
  log_error "Document upload failed"
  echo "Response: $DOCUMENT_RESPONSE"
  rm -f "$TEST_FILE"
  exit 1
fi

log_success "Document uploaded successfully"
echo "  Document ID: $DOCUMENT_ID"
echo "  File: $TEST_FILE"
echo "  Size: $TEST_FILE_SIZE bytes"

# Step 5: Download Document
log_step "Step 5️⃣  - Download Document"
echo "Downloading uploaded document..."

DOWNLOAD_FILE="downloaded_$(date +%s).txt"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$DOWNLOAD_FILE" \
  -H "Authorization: Bearer $TOKEN" \
  "$API/projects/$PROJECT_ID/documents/$DOCUMENT_ID/download" \
  --max-time $TIMEOUT)

if [ "$HTTP_CODE" -ne 200 ]; then
  log_error "Document download failed (HTTP $HTTP_CODE)"
  rm -f "$TEST_FILE" "$DOWNLOAD_FILE"
  exit 1
fi

DOWNLOADED_SIZE=$(wc -c < "$DOWNLOAD_FILE")

if [ "$TEST_FILE_SIZE" -ne "$DOWNLOADED_SIZE" ]; then
  log_error "Downloaded file size mismatch (original: $TEST_FILE_SIZE, downloaded: $DOWNLOADED_SIZE)"
  rm -f "$TEST_FILE" "$DOWNLOAD_FILE"
  exit 1
fi

log_success "Document downloaded successfully"
echo "  File: $DOWNLOAD_FILE"
echo "  Size: $DOWNLOADED_SIZE bytes"
echo "  Integrity: ✓ Size matches original"

# Step 6: Create GIS Boundary
log_step "Step 6️⃣  - Create GIS Boundary"
echo "Creating GIS boundary polygon..."

BOUNDARY_RESPONSE=$(curl -s -X POST "$API/projects/$PROJECT_ID/gis/boundary" \
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
  }' \
  --max-time $TIMEOUT)

BOUNDARY_ID=$(echo "$BOUNDARY_RESPONSE" | jq -r '.id // empty' 2>/dev/null)
AREA=$(echo "$BOUNDARY_RESPONSE" | jq -r '.area_hectares // empty' 2>/dev/null)
PERIMETER=$(echo "$BOUNDARY_RESPONSE" | jq -r '.perimeter_km // empty' 2>/dev/null)

if [ -z "$BOUNDARY_ID" ]; then
  log_error "GIS boundary creation failed"
  echo "Response: $BOUNDARY_RESPONSE"
  rm -f "$TEST_FILE" "$DOWNLOAD_FILE"
  exit 1
fi

log_success "GIS boundary created successfully"
echo "  Boundary ID: $BOUNDARY_ID"
echo "  Area: $AREA hectares"
echo "  Perimeter: $PERIMETER km"

# Cleanup
log_step "Cleanup"
rm -f "$TEST_FILE" "$DOWNLOAD_FILE"
log_success "Test files cleaned up"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ VERIFICATION PASSED                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "All workflow steps completed successfully:"
echo "  1. ✅ User Registration"
echo "  2. ✅ Project Creation"
echo "  3. ✅ Participant Addition"
echo "  4. ✅ Document Upload"
echo "  5. ✅ Document Download"
echo "  6. ✅ GIS Boundary Creation"
echo ""
echo "Summary:"
echo "  Users: 1 registered"
echo "  Projects: 1 created"
echo "  Participants: 1 added"
echo "  Documents: 1 uploaded, 1 downloaded"
echo "  GIS Boundaries: 1 created"
echo ""
echo "🎉 Platform is production-ready!"
echo ""
