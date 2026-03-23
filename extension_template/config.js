/**
 * Portal server URL for API calls (capture-profile, upload-cv, capture-status, etc.).
 * For local testing so backend logs appear on your machine, set this to your dev server, e.g.:
 *   var PORTAL_SERVER_URL = 'http://192.168.10.4:5111';
 *   or 'http://localhost:5111'
 * Then add the same origin to manifest.json host_permissions and reload the extension.
 */
var PORTAL_SERVER_URL = 'https://portal.o2finfosolutions.com';
