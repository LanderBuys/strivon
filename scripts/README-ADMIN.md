# Create an admin account

This creates a Firebase Auth user and adds their email to the admin list so they can use the web dashboard at **/admin**.

## 1. Get a Firebase service account key

1. Open [Firebase Console](https://console.firebase.google.com) → your project (**strivon-e9ca5**).
2. Go to **Project settings** (gear) → **Service accounts**.
3. Click **Generate new private key** and save the JSON file.
4. Put it in the project root as `service-account.json` (or anywhere and set `GOOGLE_APPLICATION_CREDENTIALS` to that path).  
   **Do not commit this file** (add `service-account.json` to `.gitignore` if needed).

## 2. Install dependencies and run the script

From the **repo root** (strivon):

```bash
npm install
```

Then set the email and password for your admin account and run the script.

**Windows (PowerShell):**

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = ".\service-account.json"
$env:ADMIN_EMAIL = "your@email.com"
$env:ADMIN_PASSWORD = "YourSecurePassword123"
node scripts/create-admin.js
```

**macOS / Linux:**

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
export ADMIN_EMAIL=your@email.com
export ADMIN_PASSWORD=YourSecurePassword123
node scripts/create-admin.js
```

## 3. Sign in on the site

Open your site, go to **Admin** (or `/admin/login`), and sign in with that **email** and **password**.
