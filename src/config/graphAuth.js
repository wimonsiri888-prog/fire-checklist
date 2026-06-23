// src/config/graphAuth.js
// Handles app-only (client credentials) authentication to Microsoft Graph API
// so the server can write to Excel Online / SharePoint without a user login prompt.

const { ConfidentialClientApplication } = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);

// Application permissions (not delegated) — must be granted admin consent
// in Azure AD for: Files.ReadWrite.All (or Sites.ReadWrite.All for SharePoint)
const TOKEN_REQUEST = {
  scopes: ['https://graph.microsoft.com/.default'],
};

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }
  const result = await cca.acquireTokenByClientCredential(TOKEN_REQUEST);
  cachedToken = result.accessToken;
  cachedTokenExpiry = now + result.expiresIn * 1000;
  return cachedToken;
}

module.exports = { getAccessToken };
