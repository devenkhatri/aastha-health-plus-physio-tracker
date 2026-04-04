# Migrate Image Storage from Firebase to Cloudinary

## Context
The app currently uploads images client-side to Firebase Storage (base64 via `uploadString`), gets back a download URL, and stores that URL in Google Sheets via Netlify functions. The Netlify functions never touch Firebase Storage — they only receive and store the URL string. So this migration only requires changing the upload utility and removing Firebase Storage config. Everything downstream (URL stored in Google Sheets, displayed via `<Avatar src={url}/>`) stays the same.

---

## Part 1: New Uploads → Cloudinary

### Upload flow after migration
```
base64Data (already in usePhotoGallery.tsx)
  → POST to https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
  → { secure_url } returned
  → URL stored in Google Sheets (unchanged)
  → Displayed via Avatar/ProfilePhoto (unchanged)
```

### Cloudinary Setup (One-Time)
1. Create a Cloudinary account / use existing
2. In Cloudinary dashboard → Settings → Upload → Add upload preset
3. Set preset to **Unsigned** (so client-side upload works without exposing API secret)
4. Note the `cloud_name` and `preset_name`

### Files to Change

#### 1. `src/utils/index.tsx` — Replace upload function
Remove Firebase imports and `uploadFileToFirebase`. Add `uploadFileToCloudinary`:

```typescript
export const uploadFileToCloudinary = async (pathprefix: string, file: any): Promise<string | undefined> => {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file.base64Data);           // base64 data_url string
  formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET!);
  formData.append('folder', pathprefix);               // e.g. gymmembers, wellnesspatient, inquires

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  return data.secure_url;
};
```

#### 2. `src/firebaseConfig.js` — Remove storage export
- Remove `getStorage` import and `export const storage`
- If Firebase is only used for Storage: remove the file entirely and uninstall `firebase` package

#### 3. `src/pages/ManageGymMembers.tsx` — Update import + function call (~line 151)
```typescript
// Change:
import { uploadFileToFirebase } from '../utils';
const uploadedPhotoUrl = await uploadFileToFirebase('/gymmembers', photos[0]);

// To:
import { uploadFileToCloudinary } from '../utils';
const uploadedPhotoUrl = await uploadFileToCloudinary('gymmembers', photos[0]);
```

#### 4. `src/pages/ManageWellnessPatients.tsx` — Same change (~line 149)
```typescript
const uploadedPhotoUrl = await uploadFileToCloudinary('wellnesspatient', photos[0]);
```

#### 5. `src/pages/ManageInquires.tsx` — Same change (~line 133)
```typescript
const uploadedPhotoUrl = await uploadFileToCloudinary('inquires', photos[0]);
```

#### 6. `.env` / Netlify Environment Variables
Add:
```
REACT_APP_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
REACT_APP_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_preset_name>
```
Remove (if Firebase Storage no longer needed):
```
REACT_APP_FIREBASE_STORAGEBUCKET
```

#### 7. `package.json` — Remove firebase (if not used elsewhere)
```
npm uninstall firebase
```

### No Changes Needed
- `src/hooks/usePhotoGallery.tsx` — base64 capture logic unchanged
- `src/components/ProfilePhoto.tsx` — displays URL, works with any URL
- `src/components/GymMemberList.tsx`, `WellnessPatientList.tsx` — same
- `src/pages/ViewGymMember.tsx`, `ViewWellnessPatient.tsx`, `ViewInquiry.tsx` — same
- All Netlify functions — they just receive a URL string, unchanged

---

## Part 2: One-Time Migration of Existing Images

### Strategy
A local Node.js script (`scripts/migrate-images-to-cloudinary.js`) that:
1. Reads all rows from the 3 Google Sheets (`GymMembers`, `WellnessPatients`, `Inquires`)
2. For each row with a Firebase Storage URL (detected by `firebasestorage.googleapis.com` in the URL)
3. Downloads the image from the Firebase URL (publicly accessible)
4. Re-uploads it to Cloudinary via the **authenticated** REST API (uses API key + secret)
5. Updates the Google Sheet row with the new `res.cloudinary.com/...` URL

### Migration Script: `scripts/migrate-images-to-cloudinary.js`

```javascript
require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const fetch = require('node-fetch'); // or native fetch in Node 18+
const FormData = require('form-data');
const crypto = require('crypto');

const SHEETS_CONFIG = [
  { title: 'GymMembers',       photoField: 'Profile Photo', folder: 'gymmembers' },
  { title: 'WellnessPatients', photoField: 'Profile Photo', folder: 'wellnesspatient' },
  { title: 'Inquires',         photoField: 'Photo',         folder: 'inquires' },
];

function generateSignature(folder, timestamp) {
  const str = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}

async function uploadToCloudinary(imageBuffer, folder, filename) {
  const formData = new FormData();
  formData.append('file', imageBuffer, { filename });
  formData.append('folder', folder);
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  const timestamp = Math.round(Date.now() / 1000);
  formData.append('timestamp', timestamp);
  formData.append('signature', generateSignature(folder, timestamp));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  return data.secure_url;
}

async function migrateSheet(doc, { title, photoField, folder }) {
  const sheet = doc.sheetsByTitle[title];
  const rows = await sheet.getRows();
  let migrated = 0;

  for (const row of rows) {
    const url = row[photoField];
    if (!url || !url.includes('firebasestorage.googleapis.com')) continue;

    console.log(`[${title}] Migrating: ${url}`);
    const imageRes = await fetch(url);
    const buffer = await imageRes.buffer();
    const filename = url.split('/').pop().split('?')[0]; // extract filename before query params

    const cloudinaryUrl = await uploadToCloudinary(buffer, folder, filename);
    row[photoField] = cloudinaryUrl;
    await row.save();
    migrated++;
    console.log(`[${title}] Updated → ${cloudinaryUrl}`);
  }
  console.log(`[${title}] Done. Migrated ${migrated} images.`);
}

async function main() {
  const doc = new GoogleSpreadsheet(process.env.REACT_APP_GOOGLE_SHEETS_ID);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n'),
  });
  await doc.loadInfo();

  for (const config of SHEETS_CONFIG) {
    await migrateSheet(doc, config);
  }
}

main().catch(console.error);
```

### Required env vars for migration script (add to `.env`)
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...       # needed for signed server-side upload
REACT_APP_GOOGLE_SHEETS_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
```

### Migration Script Dependencies (dev-only, run once)
```
npm install --save-dev node-fetch form-data
```
> Or use Node 18+ built-in `fetch` and skip `node-fetch`.

### How to Run
```bash
node scripts/migrate-images-to-cloudinary.js
```
- **Idempotent**: rows already pointing to Cloudinary URLs are skipped (the `firebasestorage.googleapis.com` check)
- Run **before** deploying the new upload code so no Firebase URLs are introduced after migration

---

## Recommended Order of Operations
1. Set up Cloudinary account + unsigned upload preset
2. Run the migration script to backfill existing images
3. Verify all rows in Google Sheets now have Cloudinary URLs
4. Deploy the code changes (new `uploadFileToCloudinary` function)
5. Remove Firebase Storage env vars from Netlify dashboard

---

## Verification
1. Add Cloudinary env vars to local `.env`
2. Run `npm start` and navigate to Manage Gym Members
3. Capture/select a photo and save a record
4. Confirm the stored URL is a `res.cloudinary.com/...` URL
5. Navigate to the member's view page and confirm the profile photo loads
6. Repeat for Wellness Patients and Inquiries
7. Check Cloudinary dashboard → Media Library to confirm images appear in the correct folders