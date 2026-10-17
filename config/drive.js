require('dotenv').config();

const { google } = require('googleapis');
const { Readable } = require('stream');

// Configura Google Drive API
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });


function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

class NativeFetchTransporter {
    constructor() {
        this.defaults = {};
    }

    async request(opts = {}) {
        let url = opts.url;
        if (opts.params) {
            const qs = typeof opts.paramsSerializer === 'function'
                ? opts.paramsSerializer(opts.params)
                : new URLSearchParams(opts.params).toString();
            if (qs) url += (url.includes('?') ? '&' : '?') + qs;
        }

        const headers = { ...(opts.headers || {}) };
        const method = (opts.method || 'GET').toUpperCase();
        let body;

        if (opts.data !== undefined && method !== 'GET' && method !== 'HEAD') {
            const data = opts.data;
            if (typeof data === 'string' || Buffer.isBuffer(data)) {
                body = data;
            } else if (data && typeof data.pipe === 'function') {
                // Subidas multipart (googleapis-common construye un stream).
                // Archivos <= 15 MB: se cargan a memoria para enviarlos con undici.
                body = await streamToBuffer(data);
            } else if (typeof data === 'object') {
                body = JSON.stringify(data);
                if (!headers['content-type'] && !headers['Content-Type']) {
                    headers['content-type'] = 'application/json';
                }
            }
        }

        const res = await fetch(url, { method, headers, body, duplex: 'half' });

        const responseHeaders = {};
        res.headers.forEach((value, key) => { responseHeaders[key] = value; });

        if (opts.responseType === 'stream') {
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                const err = new Error(`Request failed with status code ${res.status}`);
                err.response = { data: text, status: res.status, headers: responseHeaders };
                err.code = String(res.status);
                throw err;
            }
            // downloadFileFromDrive espera un stream de Node (.pipe/.on).
            const nodeStream = Readable.fromWeb(res.body);
            return {
                data: nodeStream,
                status: res.status,
                statusText: res.statusText,
                headers: responseHeaders,
                config: opts,
                request: {},
            };
        }

        const text = await res.text();
        let parsed;
        try {
            parsed = text ? JSON.parse(text) : {};
        } catch {
            parsed = text;
        }

        if (!res.ok) {
            const err = new Error(`Request failed with status code ${res.status}`);
            err.response = { data: parsed, status: res.status, headers: responseHeaders };
            err.code = String(res.status);
            throw err;
        }

        return {
            data: parsed,
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
            config: opts,
            request: {},
        };
    }
}

oauth2Client.transporter = new NativeFetchTransporter();

const drive = google.drive({ version: 'v3', auth: oauth2Client });

module.exports = drive;
