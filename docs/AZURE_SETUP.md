# Azure Setup Guide — Connecting to Excel Online / SharePoint

This app writes inspection results directly into an Excel file stored on
OneDrive or SharePoint, using the Microsoft Graph API. Before the app can do
this, your Microsoft 365 admin (or IT person) needs to register an "app" in
Azure Active Directory and grant it permission. This is a one-time setup.

> Why this step can't be automated: writing to your organization's
> SharePoint/OneDrive requires credentials that only an admin in your
> Microsoft 365 tenant can issue. This is a Microsoft security requirement,
> not a limitation of this code.

## Step 1 — Register the app in Azure AD

1. Go to https://portal.azure.com
2. Search for **"App registrations"** → click **New registration**
3. Name: `Dusit Princess Fire Safety Checklist`
4. Supported account types: **Accounts in this organizational directory only**
5. Leave Redirect URI blank (not needed — this app uses app-only auth)
6. Click **Register**
7. On the overview page, copy and save:
   - **Application (client) ID** → this is your `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → this is your `AZURE_TENANT_ID`

## Step 2 — Create a client secret

1. In your new app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `fire-checklist-app`, expiry: 24 months (or per your IT policy)
4. Click **Add**
5. **Copy the secret VALUE immediately** (not the Secret ID) — it's only shown once.
   This is your `AZURE_CLIENT_SECRET`

## Step 3 — Grant API permissions

1. Go to **API permissions** → **Add a permission**
2. Choose **Microsoft Graph** → **Application permissions** (NOT Delegated)
3. Search for and check: **Files.ReadWrite.All**
   (Or, if your Excel file lives in a SharePoint site rather than personal
   OneDrive, also add **Sites.ReadWrite.All**)
4. Click **Add permissions**
5. Click **Grant admin consent for [Your Organization]** — this step requires
   Global Admin or Application Admin rights. If you're not the admin, send
   this whole guide to whoever manages your Microsoft 365 tenant.

## Step 4 — Prepare the Excel file

1. Upload (or locate) your Excel file in OneDrive or a SharePoint document library
2. Open it in Excel Online (or desktop Excel synced to the same file)
3. Create **two Excel Tables** (Insert tab → Table) — one per checklist:
   - Table name: `ExtinguisherLog`, with header row:
     `Submission Date | Inspector | Point ID | Location | C1 | C2 | C3 | C4 | C5 | C6 | Remarks | Photo Link`
   - Table name: `CabinetLog`, with the same header row
   - The `Fire_Safety_Master_List.xlsx` file generated earlier already has
     these columns laid out — you can copy that structure in, then convert
     each range to a Table and rename it to match.
4. To rename a table: click inside it → **Table Design** tab → type the new
   name in **Table Name** (top left)

## Step 5 — Find your Drive ID and File ID

These identify exactly which file the app writes to.

**Easiest method — using Graph Explorer:**
1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in with the same Microsoft 365 account that owns/can access the file
3. Run this query (adjust the path to match where your file lives):
   ```
   GET https://graph.microsoft.com/v1.0/me/drive/root:/YourFolder/Fire_Safety_Master_List.xlsx
   ```
4. In the JSON response, copy:
   - `"id"` → this is your `SHAREPOINT_FILE_ID`
   - `"parentReference": { "driveId": "..." }` → this is your `SHAREPOINT_DRIVE_ID`

If the file lives in a SharePoint site (not personal OneDrive), use:
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drive/root:/path/to/file.xlsx
```

## Step 6 — Fill in your .env file

Copy `.env.example` to `.env` and fill in the 6 values you collected:

```
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
SHAREPOINT_DRIVE_ID=...
SHAREPOINT_FILE_ID=...
EXTINGUISHER_TABLE_NAME=ExtinguisherLog
CABINET_TABLE_NAME=CabinetLog
```

## Step 7 — Test it

```bash
npm install
npm start
```

Then visit: `http://localhost:3000/?id=EXT-01`

Fill out the checklist and submit. Open your Excel file — a new row should
appear in the `ExtinguisherLog` table within a few seconds.

## Troubleshooting

- **403 Forbidden / Access denied** → admin consent (Step 3.5) probably
  wasn't granted, or the permission type is "Delegated" instead of
  "Application"
- **404 Not Found on the table** → the table name in `.env` doesn't exactly
  match the Excel Table name (case-sensitive)
- **Token errors** → double check `AZURE_CLIENT_SECRET` is the secret
  *value*, not its ID, and that it hasn't expired
