/**
 * ATS Connector for Resdex – Background Service Worker
 * v1.9.0
 *
 * 1. Relay CAPTURE_PROFILE from content script → backend
 * 2. Intercept Naukri CV downloads → upload a copy to portal storage
 * 3. Relay SEARCH_CONTEXT from search page content script
 * 4. Handle session expiry
 *
 * CV FLOW: When the recruiter clicks "Download CV" on Naukri:
 *   - Content script detects the click, stores profile info
 *   - Browser downloads the file (user gets their copy)
 *   - This service worker intercepts via chrome.downloads.onCreated
 *   - Re-fetches the file using Naukri cookies
 *   - Uploads a copy to our portal storage
 *   - Links it to the candidate record in the database
 */

importScripts('config.js');
const SERVER_URL = typeof PORTAL_SERVER_URL !== 'undefined' ? PORTAL_SERVER_URL : 'https://portal.o2finfosolutions.com';
const LOG = '[ATS-Resdex:BG]';

let lastCapturedProfileId = null;
let lastCandidateName = '';

// ─────────────────────────────────────────────────────────────────────────────
// Message Handler
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CAPTURE_PROFILE') {
        const profileId = message.payload?.naukri_profile_id || null;
        lastCapturedProfileId = profileId;
        lastCandidateName = message.payload?.candidate_name || '';

        saveToFlask('/portal/api/naukri/capture-profile', message.payload).then((result) => {
            if (result.ok) {
                chrome.storage.local.set({
                    last_capture_at: new Date().toISOString(),
                    last_naukri_profile_id: profileId,
                });
            }
            sendResponse(result);
        });
        return true;
    }

    if (message.type === 'SEARCH_CONTEXT') {
        chrome.storage.local.set({ lastSearchContext: message.payload || {} });
        sendResponse({ ok: true });
        return false;
    }

    // Content script notifies us that user clicked "Download CV"
    if (message.type === 'CV_DOWNLOAD_EXPECTED') {
        lastCapturedProfileId = message.naukriProfileId || lastCapturedProfileId;
        lastCandidateName = message.candidateName || lastCandidateName;
        console.log(LOG, 'CV download expected for:', lastCandidateName, 'profile:', lastCapturedProfileId?.substring(0, 20));
        sendResponse({ ok: true });
        return false;
    }

    // Content script reports CV upload result
    if (message.type === 'CV_UPLOAD_RESULT') {
        console.log(LOG, 'CV upload via content script:', message.success ? 'OK' : 'FAIL');
        if (message.success) {
            chrome.storage.local.set({ last_cv_upload_at: new Date().toISOString() });
        }
        return false;
    }

    // ── CV_UPLOAD_DATA: Content script sends captured CV data for upload ──
    // Service worker handles the upload because it has NO mixed content or
    // CSP restrictions (HTTPS page → HTTP server is fine from here).
    if (message.type === 'CV_UPLOAD_DATA') {
        handleCvUploadData(message)
            .then(sendResponse)
            .catch((err) => {
                console.error(LOG, 'CV_UPLOAD_DATA handler error:', err);
                sendResponse({ ok: false, error: err.message || 'Unknown error' });
            });
        return true; // async
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Session Expiry
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CV Upload Handler (from content script via CV_UPLOAD_DATA message)
// ─────────────────────────────────────────────────────────────────────────────
// The service worker has NO mixed content restrictions and NO page CSP.
// Content script captures the CV data, sends it here as a base64 data URL,
// and we convert + upload to the portal server.

async function handleCvUploadData(message) {
    const { dataUrl, filename, contentType, naukriProfileId, candidateName } = message;

    console.log(LOG, 'CV_UPLOAD_DATA received:', filename, 'profile:', (naukriProfileId || '').substring(0, 20));

    try {
        // ── Convert data URL to blob using atob() ──
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx < 0) {
            return { ok: false, error: 'Invalid data URL' };
        }
        const b64 = dataUrl.substring(commaIdx + 1);
        const mimeMatch = dataUrl.substring(0, commaIdx).match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (contentType || 'application/pdf');

        const byteChars = atob(b64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: mime });

        console.log(LOG, 'CV blob created:', blob.size, 'bytes, mime:', mime);

        if (blob.size < 500) {
            return { ok: false, error: 'File too small' };
        }

        // ── Get credentials ──
        const stored = await chrome.storage.local.get(['api_key', 'recruiter_id']);
        if (!stored.api_key) {
            return { ok: false, error: 'Not logged in' };
        }

        // ── Upload to server ──
        const formData = new FormData();
        formData.append('file', blob, filename || 'resume.pdf');
        formData.append('recruiter_id', String(stored.recruiter_id || ''));
        formData.append('naukri_profile_id', naukriProfileId || '');
        formData.append('candidate_name', candidateName || '');

        console.log(LOG, 'Uploading CV to portal:', filename, blob.size, 'bytes');

        const uploadResp = await fetch(SERVER_URL + '/portal/api/naukri/upload-cv', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${stored.api_key}` },
            body: formData,
        });

        if (uploadResp.status === 401) {
            notifySessionExpired();
            return { ok: false, error: 'Session expired' };
        }

        if (!uploadResp.ok) {
            const errText = await uploadResp.text().catch(() => '');
            console.error(LOG, 'CV upload failed:', uploadResp.status, errText.substring(0, 200));
            return { ok: false, error: `Server error: ${uploadResp.status}` };
        }

        const result = await uploadResp.json().catch(() => ({}));
        console.log(LOG, '*** CV uploaded to portal successfully! ***');
        console.log(LOG, 'Stored as:', result.filename, 'path:', result.path, 'linked_candidate:', result.linked_candidate_id);

        chrome.storage.local.set({
            last_cv_upload_at: new Date().toISOString(),
            cv_download_expected: false,
        });

        return {
            ok: true,
            filename: result.filename,
            path: result.path,
            linked_candidate_id: result.linked_candidate_id,
        };
    } catch (error) {
        console.error(LOG, 'CV upload error:', error);
        return { ok: false, error: error.message || 'Upload failed' };
    }
}

function notifySessionExpired() {
    chrome.storage.local.remove(['api_key']);
    chrome.tabs.query({ url: ['https://resdex.naukri.com/*'] }, (tabs) => {
        tabs.forEach((tab) => {
            if (tab.id) chrome.tabs.sendMessage(tab.id, { type: 'ATS_SESSION_EXPIRED' });
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Intercept CV Downloads
// ─────────────────────────────────────────────────────────────────────────────
// When a recruiter clicks "Download CV" on Naukri:
//  1. Browser download triggers chrome.downloads.onCreated here
//  2. We detect it's a Naukri CV download
//  3. We send the download URL to the content script (CV_DOWNLOAD_URL)
//  4. Content script fetches with page cookies (it has Naukri session)
//  5. Content script uploads to our portal storage
// The download still completes normally — recruiter gets their copy too.

chrome.downloads.onCreated.addListener(async (downloadItem) => {
    const url = downloadItem.url || '';
    const filename = (downloadItem.filename || '').toLowerCase();
    const finalUrl = (downloadItem.finalUrl || '').toLowerCase();
    const mime = (downloadItem.mime || '').toLowerCase();
    const tabId = downloadItem.tabId;

    console.log(LOG, 'Download event:', {
        id: downloadItem.id,
        url: url.substring(0, 120),
        filename: filename || '(empty)',
        mime: mime || '(unknown)',
        tabId: tabId,
        state: downloadItem.state,
    });

    // ── Check if this is a Naukri-related download ──
    const isNaukriUrl = url.includes('naukri.com');
    const isResumeFile = /\.(pdf|docx?|rtf)$/i.test(filename) || /\.(pdf|docx?|rtf)$/i.test(finalUrl);
    const isResumeMime = mime.includes('pdf') || mime.includes('msword') || mime.includes('wordprocessing') || mime.includes('rtf');
    const hasNaukriInFilename = filename.includes('naukri');

    let isNaukriDownload = isNaukriUrl || hasNaukriInFilename;

    if (!isNaukriDownload && (isResumeFile || isResumeMime)) {
        if (tabId && tabId > 0) {
            try {
                const tab = await chrome.tabs.get(tabId);
                if (tab.url && tab.url.includes('naukri.com')) {
                    isNaukriDownload = true;
                    console.log(LOG, 'Resume file from Naukri tab');
                }
            } catch (_) {}
        }
    }

    // Also check if we recently expected a CV download (from content script click)
    if (!isNaukriDownload) {
        const stored = await chrome.storage.local.get(['cv_download_expected', 'cv_download_expected_at']);
        if (stored.cv_download_expected && stored.cv_download_expected_at) {
            const elapsed = Date.now() - stored.cv_download_expected_at;
            if (elapsed < 30000) { // within 30 seconds of click
                isNaukriDownload = true;
                console.log(LOG, 'Download matches expected CV click', elapsed, 'ms ago');
            }
        }
    }

    if (!isNaukriDownload) {
        console.log(LOG, 'Ignoring non-Naukri download');
        return;
    }

    console.log(LOG, '*** Naukri CV download detected! ***', filename || url.substring(0, 60));

    // ── Wait for download to complete so we have the final filename ──
    pollDownloadCompletion(downloadItem.id, 0, async (completedItem) => {
        const finalFilename = getFilenameFromPath(completedItem.filename);
        const downloadUrl = completedItem.url || url;

        console.log(LOG, 'Download completed:', finalFilename, 'size:', completedItem.fileSize || completedItem.totalBytes);

        // ── STRATEGY: Send download URL to content script ──
        // Content script has page cookies and can re-fetch the URL reliably.
        // Note: The page-level XHR/fetch interceptor (in content.js) is the
        // PRIMARY method — this is a backup in case the interceptor missed it.

        // Find the right tab — downloadItem.tabId can be -1 for JS-initiated downloads
        let targetTabId = completedItem.tabId || tabId;
        if (!targetTabId || targetTabId < 0) {
            console.log(LOG, 'Download has no valid tabId, searching for Naukri tabs...');
            try {
                const naukriTabs = await chrome.tabs.query({ url: '*://resdex.naukri.com/*' });
                if (naukriTabs.length > 0) {
                    targetTabId = naukriTabs[0].id;
                    console.log(LOG, 'Found Naukri tab:', targetTabId, 'url:', naukriTabs[0].url?.substring(0, 60));
                } else {
                    console.warn(LOG, 'No Naukri tabs open — cannot send URL to content script');
                }
            } catch (_) {}
        }

        if (targetTabId && targetTabId > 0) {
            try {
                console.log(LOG, 'Sending CV_DOWNLOAD_URL to content script tab', targetTabId, 'url:', downloadUrl.substring(0, 80));
                await chrome.tabs.sendMessage(targetTabId, {
                    type: 'CV_DOWNLOAD_URL',
                    downloadUrl: downloadUrl,
                    filename: finalFilename,
                });
                console.log(LOG, 'CV_DOWNLOAD_URL sent — content script will handle fetch + upload');
                chrome.storage.local.set({ cv_download_expected: false });
            } catch (tabErr) {
                console.warn(LOG, 'Could not message content script:', tabErr.message);
                // If the page interceptor already caught it, that's fine
            }
        } else {
            console.warn(LOG, 'No valid tab to send CV_DOWNLOAD_URL to. Relying on page interceptor.');
        }

        // Note: We don't do a service worker fallback fetch anymore.
        // The page-level XHR/fetch interceptor in content.js is the primary method.
        // If that doesn't fire (e.g., direct navigation download), the CV_DOWNLOAD_URL
        // message above is the backup.
    });
});

function pollDownloadCompletion(downloadId, attempt, onComplete) {
    if (attempt > 120) {
        console.warn(LOG, 'Download did not complete in 120s — giving up');
        return;
    }
    chrome.downloads.search({ id: downloadId }, (items) => {
        if (!items || !items[0]) {
            console.warn(LOG, 'Download item not found:', downloadId);
            return;
        }
        const item = items[0];
        if (item.state === 'complete') {
            onComplete(item);
        } else if (item.state === 'in_progress') {
            setTimeout(() => pollDownloadCompletion(downloadId, attempt + 1, onComplete), 1000);
        } else {
            console.warn(LOG, 'Download ended with state:', item.state, 'error:', item.error);
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// API Communication
// ─────────────────────────────────────────────────────────────────────────────

async function saveToFlask(endpoint, data) {
    const stored = await chrome.storage.local.get(['api_key', 'recruiter_id']);
    const apiKey = data.api_key || stored.api_key;
    const recruiterId = stored.recruiter_id;

    if (!apiKey) return { ok: false, error: 'Not logged in' };

    const payload = { ...data };
    if (recruiterId && !payload.recruiter_id) payload.recruiter_id = recruiterId;
    delete payload.api_key;

    try {
        const response = await fetch(SERVER_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify(payload),
        });

        if (response.status === 401) { notifySessionExpired(); return { ok: false, error: 'Session expired' }; }

        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = body.message || body.error || `HTTP ${response.status}`;
            console.warn(LOG, 'Capture failed:', err);
            return { ok: false, error: err };
        }

        return {
            ok: true,
            candidate_id: body.candidate_id,
            is_duplicate: body.is_duplicate,
            same_recruiter: body.same_recruiter,
            original_recruiter_name: body.original_recruiter_name,
            message: body.message,
        };
    } catch (error) {
        console.error(LOG, 'Network error:', error);
        return { ok: false, error: error?.message || 'Network error' };
    }
}

function getFilenameFromPath(path) {
    if (!path) return 'resume.pdf';
    const parts = path.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || 'resume.pdf';
}
