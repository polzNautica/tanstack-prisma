# QR Attendance System - Setup Complete! ✅

## What's Been Built

Your QR-based attendance system is now fully set up with the following features:

### 1. **Database Schema**

- `Candidate` model with: id, name, email, organization, invited_by, attendance tracking
- Automatically tracks attendance status and timestamp

### 2. **Excel Import/Export**

- **Import**: Upload Excel files with candidate data (id, name, email, organization, invited_by)
- **Export**: Download all candidate data with attendance status to Excel

### 3. **QR Code Generation**

- Each candidate gets a unique encrypted QR code
- QR codes contain encrypted candidate IDs (using AES encryption)
- Downloadable as PNG images

### 4. **QR Code Scanner**

- Real-time scanning using device camera
- Instantly decrypts and identifies candidates
- Marks attendance automatically
- Prevents duplicate check-ins

### 5. **Admin Dashboard**

- Access at: `/admin/attendance`
- Search and filter candidates
- View attendance statistics
- Generate individual QR codes
- Import/Export candidate data

## How to Use

### Step 1: Prepare Your Candidate Data

Create an Excel file with these columns:

```
id          | name        | email              | organization    | invited_by
CAND001     | John Doe    | john@example.com   | Company A       | HR Manager
CAND002     | Jane Smith  | jane@example.com   | Company B       | HR Manager
```

### Step 2: Import Candidates

1. Go to `/admin/attendance`
2. Click "Import from Excel"
3. Select your Excel file
4. System will automatically parse and import candidates

### Step 3: Generate & Send QR Codes

1. In the candidate list, click "Show QR" for each candidate
2. Download the QR code image
3. Email QR codes to individual candidates
4. **Alternative**: Export candidate list and mail merge QR codes into emails

### Step 4: Event Day - Scan Attendance

1. Open `/admin/attendance` on event day
2. Click "Start Scanning"
3. Allow camera access
4. Point camera at candidate's QR code
5. System automatically:
   - Decrypts the QR code
   - Identifies the candidate
   - Marks them as attended
   - Shows confirmation

## API Endpoints

- `GET /api/candidates` - List all candidates (with pagination & search)
- `POST /api/candidates/import` - Import from Excel
- `GET /api/candidates/export` - Export to Excel
- `POST /api/candidates/qr/generate` - Generate QR code for candidate
- `POST /api/candidates/qr/scan` - Process scanned QR code

## Security Features

✅ **AES Encryption**: Candidate IDs are encrypted in QR codes  
✅ **Validation**: Only valid, decrypted IDs are accepted  
✅ **Duplicate Prevention**: System prevents double check-ins  
✅ **Timestamp Tracking**: All attendance is logged with timestamps

## Excel File Format

Your Excel file should have these headers (case-insensitive):

- `id` or `ID` - Unique candidate identifier
- `name` or `Name` - Candidate full name
- `email` or `Email` - Candidate email address
- `organization` or `Organization` - Candidate organization
- `invited_by` or `Invited By` - Who invited/invited this candidate

## Next Steps

1. **Set Environment Variable**: Add `QR_ENCRYPTION_KEY` to your `.env.local` file for production

   ```
   QR_ENCRYPTION_KEY=your-super-secret-key-here
   ```

2. **Test the System**:
   - Create a small test Excel file
   - Import a few candidates
   - Generate QR codes
   - Test scanning with your phone

3. **Deploy**: When ready for production, update the encryption key

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── badge.tsx
│   ├── CandidateList.tsx
│   ├── QRScanner.tsx
│   └── QRCodeModal.tsx
├── lib/
│   └── encryption.ts
├── routes/
│   ├── admin/
│   │   └── attendance.tsx
│   └── api/
│       ├── candidates.ts
│       ├── candidates.import.ts
│       ├── candidates.export.ts
│       ├── candidates.qr.generate.ts
│       └── candidates.qr.scan.ts
└── db.ts
```

## Tips

- Test QR codes before the event
- Have backup candidate list printed
- Ensure good lighting for scanning
- Use tablets/phones with good cameras
- Keep encryption key secure!
