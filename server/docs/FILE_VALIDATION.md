# File Validation Guide

## Overview

The Carbon Project Management Platform implements multi-layer file validation to prevent malicious or oversized uploads:

1. **Pre-upload validation** — Check Content-Length header
2. **MIME type validation** — Verify file type matches extension
3. **Extension validation** — Whitelist approved file types
4. **Size validation** — Enforce individual and batch limits
5. **Filename sanitization** — Prevent directory traversal attacks

## Configuration

### File Size Limits

```typescript
// server/src/middleware/fileValidator.ts

// Single file maximum: 10 MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Batch upload maximum: 100 MB
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
```

To adjust limits, update these constants:

```typescript
// For 50 MB single file limit
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// For 500 MB batch limit
export const MAX_TOTAL_SIZE = 500 * 1024 * 1024;
```

### Allowed File Types

```typescript
export const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',

  // Spreadsheets
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',

  // Presentations
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',

  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',

  // GIS Data
  'application/json': 'json',      // GeoJSON
  'application/geo+json': 'geojson',

  // Archive
  'application/zip': 'zip',
};
```

To add a file type:

```typescript
export const ALLOWED_MIME_TYPES = {
  // ... existing types ...
  'application/vnd.ms-access': 'mdb',  // Microsoft Access database
};
```

## Validation Layers

### 1. Pre-upload Check

Before multer processes the file, `checkFileSizeLimit` middleware validates the Content-Length header:

```typescript
// Attached to routes
router.post(
  '/upload',
  checkFileSizeLimit,  // ← Checks Content-Length header
  upload.single('file'),
  fileValidator('file'),
  controller
);
```

Returns **413 Payload Too Large** if file exceeds limit.

### 2. MIME Type Validation

Checks the file's MIME type against the whitelist:

```typescript
function validateMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

// Returns 400 Bad Request if not allowed
```

### 3. Extension Validation

Checks the filename extension against allowed types:

```typescript
function validateExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.has(ext) : false;
}

// Prevents: .exe, .bat, .sh, .php, etc.
```

### 4. Size Validation

Checks file size against limits:

```typescript
if (file.size > MAX_FILE_SIZE) {
  throw new AppError(`File too large. Maximum size: 10MB`, 400);
}

if (file.size === 0) {
  throw new AppError(`File is empty`, 400);
}
```

### 5. Filename Sanitization

Removes dangerous characters and prevents directory traversal:

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\]/g, '_')      // Remove path separators
    .replace(/\0/g, '')           // Remove null bytes
    .replace(/^\.+/, '')          // Remove leading dots
    .replace(/[^a-zA-Z0-9._\-]/g, '_')  // Remove special chars
    .replace(/_+/g, '_')          // Collapse underscores
    .substring(0, 255);           // Filesystem limit
}

// "../../malicious.exe" → "malicious.exe"
// "file@#$%.pdf" → "file______.pdf"
```

## Usage

### Single File Upload

```typescript
import { fileValidator, checkFileSizeLimit } from '../middleware/fileValidator';

router.post(
  '/upload',
  checkFileSizeLimit,           // Pre-check Content-Length
  upload.single('file'),        // Multer middleware
  fileValidator('file'),        // Validate MIME, extension, size
  controller                    // Handle upload
);
```

### Multiple File Upload

```typescript
import { batchFileValidator, checkFileSizeLimit } from '../middleware/fileValidator';

router.post(
  '/batch-upload',
  checkFileSizeLimit,
  upload.array('files', 10),    // Max 10 files per request
  batchFileValidator('files'),  // Validate all files
  controller
);
```

### Manual Validation

For custom validation logic:

```typescript
import {
  validateFileForStorage,
  formatFileSize,
} from '../middleware/fileValidator';

// In controller
const result = validateFileForStorage('document.pdf', 'application/pdf', 5242880);

if (!result.isValid) {
  throw new AppError(`Upload rejected: ${result.error}`, 400);
}

console.log(`Sanitized name: ${result.sanitizedName}`);
```

## Error Responses

### Single File Validation Error

```json
{
  "error": "File type not allowed: application/x-executable. Allowed types: application/pdf, application/msword, ...",
  "code": "APP_ERROR",
  "requestId": "err-...",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

### Batch Validation Error

```json
{
  "error": "File validation failed:\nFile 1 (virus.exe): Invalid type application/x-executable\nFile 3 (huge.bin): Too large (max 10MB)\nTotal upload size too large (max 100MB, current 125MB)",
  "code": "APP_ERROR",
  "requestId": "err-...",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

### Pre-upload Size Check Error

```json
{
  "error": "Request too large. Maximum file size: 10MB (request: 15.5MB)",
  "code": "APP_ERROR",
  "requestId": "err-...",
  "timestamp": "2024-08-21T10:00:00Z"
}
```

## Security Considerations

### MIME Type Spoofing

Attackers can spoof MIME types. The validator checks both:

1. **MIME type** — Declared by client (can be spoofed)
2. **Extension** — From filename (harder to spoof)

Both must pass. Example:

```
❌ Rejected: application/pdf file named "virus.exe"
❌ Rejected: application/x-executable file named "document.pdf"
✅ Accepted: application/pdf file named "document.pdf"
```

### Directory Traversal Prevention

```typescript
// Attempted attack
filename: "../../etc/passwd.pdf"

// After sanitization
sanitized: "___etcpasswd.pdf"

// Safe to store
```

### Null Byte Injection

```typescript
// Attempted attack (older systems)
filename: "document.pdf\0.php"

// After sanitization
sanitized: "document.pdf.php"  // Still rejected by extension check

// Note: Modern filesystems ignore null bytes, but we remove them anyway
```

### ZIP Bomb Prevention

ZIP bombs can appear small but extract to massive sizes. Currently:

- ZIP files are allowed (extension `.zip`)
- No decompression happens server-side
- Recommend virus scanning before processing ZIP contents

To disable ZIP uploads:

```typescript
// In fileValidator.ts
delete ALLOWED_MIME_TYPES['application/zip'];
delete ALLOWED_MIME_TYPES['application/x-zip-compressed'];
```

## Best Practices

### 1. Always Validate Before Processing

```typescript
// ❌ Bad
const file = req.file;
await saveToStorage(file);  // No validation!

// ✅ Good
const file = req.file;
// fileValidator middleware already ran
await saveToStorage(file);  // Safe
```

### 2. Sanitize Filenames When Storing

```typescript
// ❌ Bad
const filename = req.file.originalname;
await storage.upload(file, filename);

// ✅ Good
const filename = req.file.sanitizedName;  // Already sanitized by middleware
await storage.upload(file, filename);
```

### 3. Implement Virus Scanning (Optional)

For production with user uploads, consider adding virus scanning:

```typescript
import NodeClam from 'clamscan';

const clamscan = new NodeClam().init({ clamdscan: { host: 'localhost' } });

export async function scanFile(filepath: string): Promise<boolean> {
  const { isInfected } = await clamscan.scanFile(filepath);
  return !isInfected;
}

// In upload controller
if (!await scanFile(file.path)) {
  throw new AppError('File failed security scan', 400);
}
```

### 4. Log File Uploads

```typescript
console.log(`[UPLOAD] User: ${user.id}, File: ${file.sanitizedName}, Size: ${formatFileSize(file.size)}, Type: ${file.mimetype}`);
```

### 5. Consider Content Validation

For mission-critical documents, consider parsing and validating content:

```typescript
import pdfjsLib from 'pdfjs-dist';

export async function validatePDF(filepath: string): Promise<boolean> {
  try {
    const pdf = await pdfjsLib.getDocument(filepath).promise;
    // PDF is readable
    return pdf.numPages > 0;
  } catch {
    return false; // Corrupted PDF
  }
}
```

## Testing

### Test Allowed Upload

```bash
curl -X POST http://localhost:3000/api/documents/project/123 \
  -H "Authorization: Bearer token" \
  -F "file=@document.pdf"
# Expected: 200 OK
```

### Test Invalid MIME Type

```bash
# Upload executable with .pdf extension
curl -X POST http://localhost:3000/api/documents/project/123 \
  -H "Authorization: Bearer token" \
  -F "file=@virus.exe"
# Expected: 400 Bad Request (Invalid MIME type)
```

### Test Size Limit

```bash
# Create 15 MB file
dd if=/dev/zero of=large.bin bs=1M count=15

curl -X POST http://localhost:3000/api/documents/project/123 \
  -H "Authorization: Bearer token" \
  -F "file=@large.bin"
# Expected: 413 Payload Too Large
```

### Test Empty File

```bash
touch empty.txt

curl -X POST http://localhost:3000/api/documents/project/123 \
  -H "Authorization: Bearer token" \
  -F "file=@empty.txt"
# Expected: 400 Bad Request (Empty file)
```

## Troubleshooting

### "File type not allowed" for valid file

**Problem:** Client sends wrong MIME type.

**Solution:** Browser developer tools → Network tab → Request Headers → Check Content-Type

**Debug:** Add logging to fileValidator.ts:
```typescript
console.log(`[DEBUG] File: ${file.originalname}, MIME: ${file.mimetype}`);
```

### "File too large" for small file

**Problem:** Content-Length header mismatch.

**Solution:** Verify actual file size:
```bash
ls -lh filename.pdf
```

### Filename becomes corrupted after upload

**Problem:** Special characters not handled.

**Solution:** Verify sanitization worked:
```typescript
console.log(`Sanitized: ${file.sanitizedName}`);
```

## References

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [MIME Types Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
