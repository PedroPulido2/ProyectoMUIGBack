const { google } = require('googleapis');

// Configura Google Drive API
const CLIENT_ID = '';
const CLIENT_SECRET = '';
const REDIRECT_URI = '';
const REFRESH_TOKEN = '';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

module.exports = drive;