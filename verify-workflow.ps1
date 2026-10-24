# Automated Workflow Verification Script
# Carbon Project Management Platform (PowerShell)
# 
# Tests: Register → Create Project → Add Participant → Upload Doc → Download → GIS
# Usage: pwsh verify-workflow.ps1

$API = "http://localhost:5000/api"
$EMAIL = "testuser-$(Get-Random)@example.com"
$PASSWORD = "Test@Password123"
$TIMEOUT = 30

# Function to log steps
function Log-Step {
    param([string]$Message)
    Write-Host "`n$Message" -ForegroundColor Yellow
}

function Log-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Check-Server {
    Log-Step "Checking if backend is running..."
    try {
        $response = Invoke-WebRequest -Uri "$API/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        Log-Success "Backend is running"
    }
    catch {
        Log-Error "Backend server not running at $API"
        Write-Host "Start backend with: cd server; npm run dev"
        exit 1
    }
}

# Main Verification
Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Verification: Carbon Project Management Platform          ║" -ForegroundColor Cyan
Write-Host "║  Testing: Register → Project → Participant → Doc → GIS     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Check-Server

# Step 1: Register
Log-Step "Step 1️⃣  - User Registration"
Write-Host "Registering user: $EMAIL"

try {
    $registerBody = @{
        email = $EMAIL
        password = $PASSWORD
    } | ConvertTo-Json

    $registerResponse = Invoke-WebRequest -Uri "$API/auth/signup" `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $registerBody `
        -TimeoutSec $TIMEOUT `
        -ErrorAction Stop

    $registerData = $registerResponse.Content | ConvertFrom-Json
    $TOKEN = $registerData.token
    $USER_ID = $registerData.user.id

    if (-not $TOKEN) {
        Log-Error "Registration failed"
        Write-Host "Response: $($registerResponse.Content)"
        exit 1
    }

    Log-Success "User registered successfully"
    Write-Host "  Email: $EMAIL"
    Write-Host "  User ID: $USER_ID"
    Write-Host "  Token: $($TOKEN.Substring(0, 20))..."
}
catch {
    Log-Error "Registration request failed: $_"
    exit 1
}

# Step 2: Create Project
Log-Step "Step 2️⃣  - Project Creation"
Write-Host "Creating project: Carbon Forest Project"

try {
    $projectBody = @{
        name = "Carbon Forest Project"
        description = "Reforestation in Amazon basin"
        location = "Brazil"
        baseline_emissions = 1000
    } | ConvertTo-Json

    $projectResponse = Invoke-WebRequest -Uri "$API/projects" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $projectBody `
        -TimeoutSec $TIMEOUT `
        -ErrorAction Stop

    $projectData = $projectResponse.Content | ConvertFrom-Json
    $PROJECT_ID = $projectData.id

    if (-not $PROJECT_ID) {
        Log-Error "Project creation failed"
        Write-Host "Response: $($projectResponse.Content)"
        exit 1
    }

    Log-Success "Project created successfully"
    Write-Host "  Project ID: $PROJECT_ID"
    Write-Host "  Name: Carbon Forest Project"
}
catch {
    Log-Error "Project creation failed: $_"
    exit 1
}

# Step 3: Add Participant
Log-Step "Step 3️⃣  - Add Participant"
Write-Host "Adding participant"

try {
    $participantEmail = "participant-$(Get-Random)@example.com"
    $participantBody = @{
        email = $participantEmail
        role = "Verifier"
        status = "active"
    } | ConvertTo-Json

    $participantResponse = Invoke-WebRequest -Uri "$API/projects/$PROJECT_ID/participants" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $participantBody `
        -TimeoutSec $TIMEOUT `
        -ErrorAction Stop

    $participantData = $participantResponse.Content | ConvertFrom-Json
    $PARTICIPANT_ID = $participantData.id

    if (-not $PARTICIPANT_ID) {
        Log-Error "Participant addition failed"
        Write-Host "Response: $($participantResponse.Content)"
        exit 1
    }

    Log-Success "Participant added successfully"
    Write-Host "  Participant ID: $PARTICIPANT_ID"
    Write-Host "  Email: $participantEmail"
    Write-Host "  Role: Verifier"
}
catch {
    Log-Error "Participant addition failed: $_"
    exit 1
}

# Step 4: Upload Document
Log-Step "Step 4️⃣  - Upload Document"
Write-Host "Creating and uploading test document..."

try {
    $testFile = "test_document_$(Get-Random).txt"
    "Test document content - $(Get-Date)" | Out-File -FilePath $testFile -Encoding UTF8
    $testFileSize = (Get-Item $testFile).Length

    $documentResponse = Invoke-WebRequest -Uri "$API/projects/$PROJECT_ID/documents" `
        -Method Post `
        -Headers @{"Authorization" = "Bearer $TOKEN"} `
        -Form @{file = Get-Item $testFile; type = "Proposal"} `
        -TimeoutSec $TIMEOUT `
        -ErrorAction Stop

    $documentData = $documentResponse.Content | ConvertFrom-Json
    $DOCUMENT_ID = $documentData.id

    if (-not $DOCUMENT_ID) {
        Log-Error "Document upload failed"
        Write-Host "Response: $($documentResponse.Content)"
        Remove-Item $testFile -ErrorAction SilentlyContinue
        exit 1
    }

    Log-Success "Document uploaded successfully"
    Write-Host "  Document ID: $DOCUMENT_ID"
    Write-Host "  File: $testFile"
    Write-Host "  Size: $testFileSize bytes"
}
catch {
    Log-Error "Document upload failed: $_"
    Remove-Item $testFile -ErrorAction SilentlyContinue
    exit 1
}

# Step 5: Download Document
Log-Step "Step 5️⃣  - Download Document"
Write-Host "Downloading uploaded document..."

try {
    $downloadFile = "downloaded_$(Get-Random).txt"

    Invoke-WebRequest -Uri "$API/projects/$PROJECT_ID/documents/$DOCUMENT_ID/download" `
        -Method Get `
        -Headers @{"Authorization" = "Bearer $TOKEN"} `
        -OutFile $downloadFile `
        -TimeoutSec $TIMEOUT `
        -ErrorAction Stop

    $downloadedSize = (Get-Item $downloadFile).Length

    if ($testFileSize -ne $downloadedSize) {
        Log-Error "Downloaded file size mismatch (original: $testFileSize, downloaded: $downloadedSize)"
        Remove-Item $testFile, $downloadFile -ErrorAction SilentlyContinue
        exit 1
    }

    Log-Success "Document downloaded successfully"
    Write-Host "  File: $downloadFile"
    Write-Host "  Size: $downloadedSize bytes"
    Write-Host "  Integrity: ✓ Size matches original"
}
catch {
    Log-Error "Document download failed: $_"
    Remove-Item $testFile, $downloadFile -ErrorAction SilentlyContinue
    exit 1
}

# Step 6: Create GIS Boundary
Log-Step "Step 6️⃣  - Create GIS Boundary"
Write-Host "Creating GIS boundary polygon..."

try {
    $boundaryBody = @{
        geojson = @{
            type = "Feature"
            geometry = @{
                type = "Polygon"
                coordinates = @(@(
                    @(-60.0, -10.0),
                    @(-59.0, -10.0),
                    @(-59.0, -11.0),
                    @(-60.0, -11.0),
                    @(-60.0, -10.0)
                ))
            }
        }
    } | ConvertTo-Json -Depth 10

    $boundaryResponse = Invoke-WebRequest -Uri "$API/projects/$PROJECT_ID/gis/boundary" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $TOKEN"
            "Content-Type" = "application/json"
        } `
        -Body $boundaryBody `
        -TimeoutSec $TIMEOUT `
        -ErrorAction Stop

    $boundaryData = $boundaryResponse.Content | ConvertFrom-Json
    $BOUNDARY_ID = $boundaryData.id
    $AREA = $boundaryData.area_hectares
    $PERIMETER = $boundaryData.perimeter_km

    if (-not $BOUNDARY_ID) {
        Log-Error "GIS boundary creation failed"
        Write-Host "Response: $($boundaryResponse.Content)"
        Remove-Item $testFile, $downloadFile -ErrorAction SilentlyContinue
        exit 1
    }

    Log-Success "GIS boundary created successfully"
    Write-Host "  Boundary ID: $BOUNDARY_ID"
    Write-Host "  Area: $AREA hectares"
    Write-Host "  Perimeter: $PERIMETER km"
}
catch {
    Log-Error "GIS boundary creation failed: $_"
    Remove-Item $testFile, $downloadFile -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup
Log-Step "Cleanup"
Remove-Item $testFile, $downloadFile -ErrorAction SilentlyContinue
Log-Success "Test files cleaned up"

# Summary
Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    ✅ VERIFICATION PASSED                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "All workflow steps completed successfully:" -ForegroundColor Green
Write-Host "  1. ✅ User Registration"
Write-Host "  2. ✅ Project Creation"
Write-Host "  3. ✅ Participant Addition"
Write-Host "  4. ✅ Document Upload"
Write-Host "  5. ✅ Document Download"
Write-Host "  6. ✅ GIS Boundary Creation"
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Users: 1 registered"
Write-Host "  Projects: 1 created"
Write-Host "  Participants: 1 added"
Write-Host "  Documents: 1 uploaded, 1 downloaded"
Write-Host "  GIS Boundaries: 1 created"
Write-Host ""
Write-Host "🎉 Platform is production-ready!" -ForegroundColor Green
Write-Host ""
