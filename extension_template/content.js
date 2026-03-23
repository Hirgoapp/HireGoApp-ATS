/**
 * ATS Connector for Resdex – Content Script (Profile Page)
 * v1.2.0
 *
 * Runs on: https://resdex.naukri.com/v3/preview*
 *
 * Extracts candidate data using a HYBRID approach:
 *   1. CSS selectors for elements with known classes (name, contact)
 *   2. Text-pattern matching for structured labels (Current:, Highest degree:, salary)
 *   3. Regex fallback for contact info
 *
 * This avoids dependence on Naukri's dynamic/obfuscated class names.
 */

let cachedApiKey = null;
let cachedRecruiterId = null;
let apiKeyChecked = false;
/** When true, no toasts are shown on the page (quiet/stealth). Activity can be viewed in portal dashboard. */
let quietMode = true;
let lastSentKey = null;
let lastSentHadEmail = false;
let lastSentHadPhone = false;
let scrapeTimer = null;
let lastUrl = location.href;
let captureRetries = 0;
const MAX_RETRIES = 2;
const LOG = '[ATS-Resdex]';

// ─────────────────────────────────────────────────────────────────────────────
// UI Notices
// ─────────────────────────────────────────────────────────────────────────────

function showNotice(id, text, opts = {}) {
    if (quietMode) return;
    if (document.getElementById(id)) return;
    const el = document.createElement('div');
    el.id = id;
    el.textContent = text;
    Object.assign(el.style, {
        position: 'fixed', top: opts.top || '12px', right: '12px', zIndex: '99999',
        background: opts.bg || '#222', color: '#fff', padding: '10px 14px',
        borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)', maxWidth: '340px', lineHeight: '1.4',
    });
    document.body.appendChild(el);
    if (opts.autoRemove) setTimeout(() => el.remove(), opts.autoRemove);
}
function removeNotice(id) { const el = document.getElementById(id); if (el) el.remove(); }
function showMissingKeyNotice() { showNotice('ats-ext-key', 'Please login to ATS Extension to sync data'); }
function showSessionExpiredNotice() { showNotice('ats-ext-expired', 'ATS session expired. Please log in again.', { bg: '#b00020' }); }
function showMissingContactNotice() { showNotice('ats-ext-contact', 'Click "View phone number" / "View email" to enable capture', { top: '52px', bg: '#555' }); }
function showCaptureNotice(msg, isErr) {
    if (quietMode) return;
    removeNotice('ats-ext-capture');
    showNotice('ats-ext-capture', msg, { top: '92px', bg: isErr ? '#b00020' : '#1a7f37', autoRemove: 5000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

function refreshApiKey() {
    chrome.storage.local.get(['api_key', 'recruiter_id', 'quiet_mode'], (r) => {
        cachedApiKey = r.api_key || null;
        cachedRecruiterId = r.recruiter_id || null;
        quietMode = r.quiet_mode !== false; // default true = quiet
        apiKeyChecked = true;
        if (!cachedApiKey) showMissingKeyNotice();
    });
}
chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local') return;
    if (ch.api_key) cachedApiKey = ch.api_key.newValue || null;
    if (ch.recruiter_id) cachedRecruiterId = ch.recruiter_id.newValue || null;
    if (ch.quiet_mode !== undefined) quietMode = ch.quiet_mode.newValue !== false;
    if (!cachedApiKey) showMissingKeyNotice();
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'ATS_SESSION_EXPIRED') showSessionExpiredNotice();

    // ── Background detected a download and sent the URL (e.g. after we triggered "Download CV" in one-click). ──
    // When in one-click flow we fetch the URL and upload to portal. Manual download = do not upload.
    if (msg.type === 'CV_DOWNLOAD_URL') {
        if (oneClickFullCaptureInProgress) {
            handleCvUploadFromDownload(msg.downloadUrl, msg.filename)
                .then(() => sendResponse({ ok: true }))
                .catch(() => sendResponse({ ok: false }));
            return true; // async response
        }
        sendResponse({ ok: true });
        return false;
    }

    // ── Legacy fallback ──
    if (msg.type === 'UPLOAD_CV_REQUEST') {
        handleCvUpload(msg).then((ok) => sendResponse({ ok }));
        return true;
    }

    if (msg.type === 'CV_UPLOAD_SUCCESS') {
        console.log(LOG, 'CV uploaded to portal:', msg.filename);
        showNotice('ats-ext-cv', `CV saved to portal: ${msg.filename}`, {
            top: '132px', bg: '#1a7f37', autoRemove: 6000,
        });
    }

    if (msg.type === 'CV_UPLOAD_FAILED') {
        console.warn(LOG, 'CV upload to portal failed for:', msg.filename);
        showNotice('ats-ext-cv', `CV upload failed — file downloaded locally only`, {
            top: '132px', bg: '#b8860b', autoRemove: 8000,
        });
    }
});

async function handleCvUpload(msg) {
    const { downloadUrl, filename, recruiterId, apiKey, naukriProfileId } = msg;
    try {
        console.log(LOG, 'Content-script CV upload for:', filename);
        const resp = await fetch(downloadUrl, { credentials: 'include' });
        if (!resp.ok) {
            console.warn(LOG, 'Content-script CV fetch failed:', resp.status);
            return false;
        }
        const blob = await resp.blob();
        if (blob.size < 100) {
            console.warn(LOG, 'CV file too small, likely an error page');
            return false;
        }

        const formData = new FormData();
        formData.append('file', blob, filename || 'resume.pdf');
        if (recruiterId) formData.append('recruiter_id', String(recruiterId));
        if (naukriProfileId) formData.append('naukri_profile_id', naukriProfileId);

const uploadResp = await fetch(SERVER_URL + '/portal/api/naukri/upload-cv', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData,
        });

        if (uploadResp.ok) {
            console.log(LOG, 'Content-script CV uploaded OK');
            showCaptureNotice('CV uploaded to portal', false);
            chrome.runtime.sendMessage({ type: 'CV_UPLOAD_RESULT', success: true });
            return true;
        } else {
            console.warn(LOG, 'Content-script CV upload failed:', uploadResp.status);
            return false;
        }
    } catch (e) {
        console.error(LOG, 'Content-script CV upload error:', e);
        return false;
    }
}

refreshApiKey();

// ─────────────────────────────────────────────────────────────────────────────
// CV Interceptor — capture CV file data directly from Naukri's network traffic
// ─────────────────────────────────────────────────────────────────────────────
// The cv_interceptor.js file runs in the page's MAIN world (injected via
// manifest.json with "world": "MAIN"). It monkey-patches XMLHttpRequest and
// fetch() to capture CV downloads. When it captures a file, it posts the data
// to this content script via window.postMessage('__ATS_CV_CAPTURED__').
// This bypasses Naukri's CSP because Chrome injects it as a privileged script.

// Track which profile already had its CV uploaded (to avoid duplicates)
let cvUploadedForProfile = null;
let cvUploadInProgress = false;

// ── Listen for intercepted CV data from the injected page script ──
// We receive the data URL here, then forward it to background.js for upload.
// The SERVICE WORKER has no mixed content or CSP restrictions, so it can
// upload to our HTTP server from an HTTPS page without issues.
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== '__ATS_CV_CAPTURED__') return;

    // Only upload to server when CV was captured during our one-click auto flow.
    // Manual "Download CV" by recruiter = file to their machine only, do NOT send to server.
    if (!oneClickFullCaptureInProgress) {
        console.log(LOG, 'CV intercepted from manual download — not sending to server');
        return;
    }

    const { dataUrl, sourceUrl, contentType, size } = event.data;
    console.log(LOG, 'CV INTERCEPTED via page hook!', size, 'bytes, type:', contentType, 'from:', (sourceUrl || '').substring(0, 80));

    const naukriProfileId = getNaukriProfileId();
    if (cvUploadedForProfile === naukriProfileId || cvUploadInProgress) {
        console.log(LOG, 'CV already uploaded/uploading for this profile, skipping');
        return;
    }
    cvUploadInProgress = true;

    try {
        // Determine file extension
        const ct = (contentType || '').toLowerCase();
        let ext = '.pdf';
        if (ct.includes('msword') || ct.includes('wordprocessing')) ext = '.docx';
        if (ct.includes('rtf')) ext = '.rtf';

        // Get candidate name from storage
        const stored = await new Promise(resolve =>
            chrome.storage.local.get(['last_cv_candidate_name'], resolve)
        );
        const candidateName = stored.last_cv_candidate_name || 'resume';
        const safeName = candidateName.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const filename = `Naukri_${safeName}${ext}`;

        console.log(LOG, 'Sending CV to background.js for upload:', filename, size, 'bytes');

        // ── Send to background.js (service worker) for upload ──
        // Service worker has NO mixed content restrictions (HTTPS→HTTP is fine)
        // and NO page CSP restrictions. This is the correct MV3 pattern.
        chrome.runtime.sendMessage({
            type: 'CV_UPLOAD_DATA',
            dataUrl: dataUrl,
            filename: filename,
            contentType: contentType,
            naukriProfileId: naukriProfileId,
            candidateName: candidateName,
        }, (response) => {
            cvUploadInProgress = false;
            if (chrome.runtime.lastError) {
                console.error(LOG, 'Failed to send CV to background:', chrome.runtime.lastError.message);
                showNotice('ats-ext-cv', 'CV upload failed — extension error', {
                    top: '132px', bg: '#b8860b', autoRemove: 6000,
                });
                return;
            }
            if (response && response.ok) {
                console.log(LOG, 'CV UPLOAD SUCCESS!', response.filename, 'path:', response.path);
                cvUploadedForProfile = naukriProfileId;
                // During one-click capture we show a single combined toast, so skip this one
                if (!oneClickFullCaptureInProgress) {
                    showNotice('ats-ext-cv', `CV saved to portal: ${filename}`, {
                        top: '132px', bg: '#1a7f37', autoRemove: 6000,
                    });
                }
            } else {
                console.warn(LOG, 'CV upload failed:', response?.error || 'unknown error');
                showNotice('ats-ext-cv', `CV upload failed: ${response?.error || 'unknown'}`, {
                    top: '132px', bg: '#b8860b', autoRemove: 6000,
                });
            }
        });
    } catch (e) {
        console.error(LOG, 'CV interceptor error:', e);
        cvUploadInProgress = false;
    }
});

// Note: cv_interceptor.js is injected automatically by Chrome via manifest.json
// with "world": "MAIN" and "run_at": "document_start" — no manual injection needed.

// ─────────────────────────────────────────────────────────────────────────────
// CV Download Watcher — intercept when recruiter clicks "Download CV" on Naukri
// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT: We do NOT auto-download CVs (Naukri charges credits per download).
// When the recruiter MANUALLY clicks "Download CV":
//   1. Content script detects the click
//   2. background.js intercepts the download via chrome.downloads.onCreated
//   3. background.js sends the download URL BACK to the content script
//   4. Content script fetches the file (it has page session/cookies)
//   5. Content script uploads to our portal storage
// This way: 1 click = 1 Naukri credit = file on user's machine + our storage

/**
 * (Manual "Download CV" upload disabled — CV is auto-uploaded from iframe once per 90 days per recruiter.)
 * Handle CV upload request from background.js.
 * background.js catches the download, sends us the URL.
 * WE fetch it (we have page cookies) and upload to portal.
 */
async function handleCvUploadFromDownload(downloadUrl, filename) {
    const naukriProfileId = getNaukriProfileId();
    if (cvUploadedForProfile === naukriProfileId || cvUploadInProgress) {
        console.log(LOG, 'CV already uploaded/uploading for this profile (URL method skipped)');
        return;
    }

    console.log(LOG, 'CV UPLOAD: Fetching download URL with page cookies:', downloadUrl.substring(0, 80));

    try {
        // ── Fetch with page session (most reliable — content script has Naukri cookies) ──
        const resp = await fetch(downloadUrl, { credentials: 'include' });
        console.log(LOG, 'CV UPLOAD: Fetch response:', resp.status, resp.statusText, 'type:', resp.headers.get('content-type'));

        if (!resp.ok) {
            console.warn(LOG, 'CV UPLOAD: Fetch failed:', resp.status);
            showNotice('ats-ext-cv', 'CV upload failed — could not re-fetch file', {
                top: '132px', bg: '#b8860b', autoRemove: 6000,
            });
            return;
        }

        const blob = await resp.blob();
        console.log(LOG, `CV UPLOAD: Got ${blob.size} bytes, type=${blob.type}`);

        if (blob.size < 200) {
            console.warn(LOG, 'CV UPLOAD: File too small, likely error page');
            return;
        }
        if (blob.type?.includes('text/html')) {
            console.warn(LOG, 'CV UPLOAD: Got HTML instead of file');
            return;
        }

        // Get credentials
        const stored = await new Promise(resolve =>
            chrome.storage.local.get(['api_key', 'recruiter_id', 'last_cv_candidate_name'], resolve)
        );
        if (!stored.api_key) {
            console.warn(LOG, 'CV UPLOAD: No API key');
            return;
        }

        const candidateName = stored.last_cv_candidate_name || '';
        const uploadFilename = filename || 'resume.pdf';

        console.log(LOG, 'CV UPLOAD: Uploading to portal as:', uploadFilename);

        const formData = new FormData();
        formData.append('file', blob, uploadFilename);
        formData.append('recruiter_id', String(stored.recruiter_id || ''));
        formData.append('naukri_profile_id', naukriProfileId || '');
        formData.append('candidate_name', candidateName);

const uploadResp = await fetch(SERVER_URL + '/portal/api/naukri/upload-cv', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${stored.api_key}` },
            body: formData,
        });

        if (uploadResp.ok) {
            const result = await uploadResp.json().catch(() => ({}));
            console.log(LOG, 'CV UPLOAD: SUCCESS!', result.filename, 'path:', result.path, 'linked:', result.linked_candidate_id);
            cvUploadedForProfile = naukriProfileId;
            if (!oneClickFullCaptureInProgress) {
                showNotice('ats-ext-cv', `CV saved to portal: ${uploadFilename}`, {
                    top: '132px', bg: '#1a7f37', autoRemove: 6000,
                });
            }
            chrome.runtime.sendMessage({ type: 'CV_UPLOAD_RESULT', success: true });
        } else {
            const errText = await uploadResp.text().catch(() => '');
            console.warn(LOG, 'CV UPLOAD: Server rejected:', uploadResp.status, errText.substring(0, 200));
            showNotice('ats-ext-cv', 'CV upload failed — server error', {
                top: '132px', bg: '#b8860b', autoRemove: 6000,
            });
        }
    } catch (e) {
        console.error(LOG, 'CV UPLOAD error:', e);
        showNotice('ats-ext-cv', 'CV upload error — check console', {
            top: '132px', bg: '#b8860b', autoRemove: 6000,
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Key (unique per candidate)
// ─────────────────────────────────────────────────────────────────────────────
// Session-level (same for all candidates): sid, paramString, sidGroupId
// Candidate-level (unique): uresid, uniqId, storageKey, tupleIndex

function getProfileKey() {
    try {
        const p = new URL(location.href).searchParams;
        return p.get('uresid') || p.get('uniqId') || p.get('storageKey')
            || p.get('profileId') || p.get('id')
            || (p.get('sid') && p.get('tupleIndex') != null ? `${p.get('sid')}-${p.get('tupleIndex')}` : null)
            || location.pathname + location.search;
    } catch (_) { return location.href; }
}

function getNaukriProfileId() {
    try {
        const p = new URL(location.href).searchParams;
        return p.get('uresid') || p.get('uniqId') || p.get('storageKey')
            || p.get('profileId') || p.get('id')
            || (p.get('sid') && p.get('tupleIndex') != null ? `${p.get('sid')}-${p.get('tupleIndex')}` : '')
            || '';
    } catch (_) { return ''; }
}

// ─────────────────────────────────────────────────────────────────────────────
// One-Click Profile + CV: auto-reveal phone/email, scrape, then auto-upload CV
// from iframe once per (recruiter + profile) per 90 days (enforced by backend).
// No manual "Download CV" — avoids duplication.
// ─────────────────────────────────────────────────────────────────────────────

let oneClickFullCaptureDoneForProfileKey = null;
let oneClickFullCaptureInProgress = false;

/** Find and programmatically click "View phone" / "View email" type buttons so they appear in DOM. */
function clickRevealButtons() {
    const patterns = [
        /view\s*(phone|mobile|contact)/i,
        /view\s*email/i,
        /(?:phone|mobile|contact)\s*number/i,
        /show\s*(?:phone|email|contact)/i,
    ];
    const candidates = document.querySelectorAll('button, a, [role="button"], span, div[class*="view"], div[class*="View"]');
    const clicked = new Set();
    for (const el of candidates) {
        const text = (el.textContent || '').trim();
        if (text.length < 4 || text.length > 80) continue;
        const isReveal = patterns.some((p) => p.test(text));
        if (!isReveal) continue;
        // Avoid clicking parent and child that both match
        if (clicked.has(el)) continue;
        try {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            clicked.add(el);
            console.log(LOG, 'One-click: revealed', text.substring(0, 30));
        } catch (_) {}
    }
}

/** Find CV iframe in the page (same selector used for reading). */
function findCvIframe() {
    return document.querySelector('#cv-iframe') || document.querySelector('iframe[id*="cv-iframe"]') || document.querySelector('iframe[title*="resume"], iframe[title*="CV"]');
}

/** Try to click a button/link that triggers CV fetch so the interceptor can capture it (fallback when iframe is cross-origin). Prefer "Download CV" so the actual file request is made. */
function tryTriggerCvDownload() {
    const downloadPatterns = [/download\s*(cv|resume)/i, /(cv|resume)\s*download/i];
    const viewPatterns = [/view\s*(cv|resume)/i, /(cv|resume)\s*view/i, /attached\s*(cv|resume)/i];
    const candidates = document.querySelectorAll('a, button, [role="button"], [class*="download"], [class*="Download"], [class*="view"], [class*="View"]');
    // First pass: look for Download CV/Resume (triggers the fetch the interceptor needs)
    for (const el of candidates) {
        const text = (el.textContent || '').trim();
        if (text.length < 3 || text.length > 80) continue;
        if (!downloadPatterns.some((p) => p.test(text))) continue;
        try {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            console.log(LOG, 'One-click: triggered Download CV button:', text.substring(0, 40));
            return true;
        } catch (_) {}
    }
    // Second pass: View/Attached CV as fallback
    for (const el of candidates) {
        const text = (el.textContent || '').trim();
        if (text.length < 3 || text.length > 80) continue;
        if (!viewPatterns.some((p) => p.test(text))) continue;
        try {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            console.log(LOG, 'One-click: triggered View CV button:', text.substring(0, 40));
            return true;
        } catch (_) {}
    }
    console.log(LOG, 'One-click: no CV trigger button found');
    return false;
}

/** Read CV HTML from iframe and upload to portal. Backend enforces 90-day rule (skipped if already downloaded by this recruiter). */
function readCvFromIframeAndUpload(naukriProfileId, candidateName, onDone) {
    console.log(LOG, '[CV] Waiting for CV iframe (up to 8s)...');
    const MAX_WAIT_MS = 8000;
    const POLL_MS = 400;
    let elapsed = 0;

    function doReadAndUpload(iframe) {
        try {
            const doc = iframe.contentDocument;
            doc.querySelectorAll('.hlite').forEach((el) => el.classList.remove('hlite'));
            doc.querySelectorAll('mark').forEach((mark) => {
                const text = doc.createTextNode(mark.textContent);
                mark.replaceWith(text);
            });
            const html = doc.documentElement.outerHTML;
            const blob = new Blob([html], { type: 'text/html' });
            const safeName = (candidateName || 'resume').replace(/[^a-zA-Z0-9_\-]/g, '_');
            const filename = `resume_${safeName}.html`;

            chrome.storage.local.get(['api_key', 'recruiter_id'], (stored) => {
                if (!stored.api_key) {
                    if (onDone) onDone(null);
                    return;
                }
                const formData = new FormData();
                formData.append('file', blob, filename);
                formData.append('recruiter_id', String(stored.recruiter_id || ''));
                formData.append('naukri_profile_id', naukriProfileId || '');
                formData.append('candidate_name', candidateName || '');

                fetch(SERVER_URL + '/portal/api/naukri/upload-cv', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${stored.api_key}` },
                    body: formData,
                })
                    .then((r) => r.json())
                    .then((data) => {
                        if (data.status === 'skipped') {
                            console.log(LOG, '[CV] Iframe upload: skipped (90-day)');
                            if (onDone) onDone('skipped');
                        } else if (data.status === 'stored') {
                            console.log(LOG, '[CV] Iframe upload: stored', data.download_number ? 'CV' + data.download_number : '');
                            if (onDone) onDone('stored', data.download_number);
                        } else {
                            console.warn(LOG, '[CV] Iframe upload: server returned', data.status || data.message || data);
                            if (onDone) onDone(null);
                        }
                    })
                    .catch((err) => {
                        console.warn(LOG, '[CV] Iframe upload request failed:', err);
                        if (onDone) onDone(null);
                    });
            });
        } catch (e) {
            console.warn(LOG, 'One-click iframe read error', e);
            if (onDone) onDone(null);
        }
    }

    function poll() {
        const iframe = findCvIframe();
        if (iframe && iframe.contentDocument) {
            console.log(LOG, '[CV] Iframe found after', elapsed, 'ms — uploading HTML...');
            doReadAndUpload(iframe);
            return;
        }
        elapsed += POLL_MS;
        if (elapsed < MAX_WAIT_MS) {
            setTimeout(poll, POLL_MS);
        } else {
            console.warn(LOG, '[CV] No CV iframe found after', MAX_WAIT_MS, 'ms');
            if (onDone) onDone(null);
        }
    }

    poll();
}

/** Persist that we've done one-click (with CV) for this profile — so we don't auto-download again on reopen. */
function markProfileOneClickCaptured(naukriProfileId) {
    chrome.storage.local.get(['one_click_captured_profiles'], (stored) => {
        const set = stored.one_click_captured_profiles || {};
        set[naukriProfileId] = 1;
        chrome.storage.local.set({ one_click_captured_profiles: set });
    });
}

var SERVER_URL = typeof PORTAL_SERVER_URL !== 'undefined' ? PORTAL_SERVER_URL : 'https://portal.o2finfosolutions.com';

/** Log activity to portal for dashboard/audit (fire-and-forget). Use when quiet mode is on so activity is visible in portal. */
function logActivityToPortal(event, candidateName, details) {
    if (!cachedApiKey) return;
    const payload = {
        event: event,
        naukri_profile_id: getNaukriProfileId() || '',
        candidate_name: (candidateName || '').substring(0, 200),
        details: (details || '').substring(0, 400),
    };
    fetch(SERVER_URL + '/portal/api/naukri/extension-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cachedApiKey },
        body: JSON.stringify(payload),
    }).catch(() => {});
}

/** Ask backend: has this recruiter already captured CV for this profile in last 90 days? Pre-check before auto-download. */
function checkServerCaptureStatus(naukriProfileId, apiKey, onResult) {
    const url = SERVER_URL + '/portal/api/naukri/capture-status?naukri_profile_id=' + encodeURIComponent(naukriProfileId);
    console.log(LOG, '[CV] Asking server: can we capture CV? profile_id=' + (naukriProfileId || '').substring(0, 24) + '...');
    fetch(url, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + apiKey },
    })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
            if (data && data.can_capture_cv === false) {
                console.log(LOG, '[CV] Server said: BLOCKED (90-day). Reason:', data.reason || data.message);
                onResult('already_in_portal');
            } else {
                console.log(LOG, '[CV] Server said: OK to capture');
                onResult('ok_to_capture');
            }
        })
        .catch((err) => {
            console.warn(LOG, '[CV] capture-status request failed:', err);
            onResult('ok_to_capture');
        });
}

/** One-click: reveal phone/email → scrape profile → auto-upload CV only once per profile (iframe or trigger Download/View CV). Reopening same profile = no second CV. Manual Download CV = file to user only, not sent to server. */
function runOneClickFullCapture() {
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/v3/preview')) return;
    const profileKey = getProfileKey();
    const naukriProfileId = getNaukriProfileId();
    if (!profileKey || !naukriProfileId) return;
    if (oneClickFullCaptureDoneForProfileKey === profileKey) return;
    if (oneClickFullCaptureInProgress) return;

    if (!cachedApiKey) {
        if (apiKeyChecked) showMissingKeyNotice();
        return;
    }

    oneClickFullCaptureInProgress = true;
    clickRevealButtons();
    setTimeout(() => {
        chrome.storage.local.get(['one_click_captured_profiles'], (stored) => {
            const capturedSet = stored.one_click_captured_profiles || {};
            const alreadyCaptured = !!capturedSet[naukriProfileId];

            scrapeProfile((capturedName) => {
                const name = capturedName || document.querySelector('.title-l, [class*="candidateName"], h1')?.textContent?.trim() || 'Candidate';
                oneClickFullCaptureDoneForProfileKey = profileKey;
                removeNotice('ats-ext-contact');
                removeNotice('ats-ext-capture');

                if (alreadyCaptured) {
                    oneClickFullCaptureInProgress = false;
                    logActivityToPortal('profile_captured_already_in_portal', name, '');
                    showCaptureNotice(`✓ Captured: ${name} (already in portal)`, false);
                    return;
                }

                // Check server first: 90-day rule — avoid auto-download if CV already in portal for this recruiter
                checkServerCaptureStatus(naukriProfileId, cachedApiKey, (serverResult) => {
                    if (serverResult === 'already_in_portal') {
                        oneClickFullCaptureInProgress = false;
                        markProfileOneClickCaptured(naukriProfileId);
                        logActivityToPortal('profile_captured_already_in_portal', name, 'server_check');
                        showCaptureNotice(`✓ Captured: ${name} (already in portal)`, false);
                        return;
                    }

                    // Server says OK to capture (or check failed — allow capture)
                    markProfileOneClickCaptured(naukriProfileId);
                    chrome.storage.local.set({ last_cv_candidate_name: name });

                    readCvFromIframeAndUpload(naukriProfileId, name, (result, downloadNumber) => {
                    if (result === 'stored') {
                        oneClickFullCaptureInProgress = false;
                        console.log(LOG, '[CV] Upload result: STORED', downloadNumber ? 'CV' + downloadNumber : '');
                        logActivityToPortal('profile_captured_cv_stored', name, downloadNumber ? `CV${downloadNumber}` : '');
                        showCaptureNotice(`✓ Captured: ${name}${downloadNumber ? ` (CV${downloadNumber})` : ''}`, false);
                        return;
                    }
                    if (result === 'skipped') {
                        oneClickFullCaptureInProgress = false;
                        console.log(LOG, '[CV] Upload result: SKIPPED (90-day)');
                        logActivityToPortal('profile_captured_cv_skipped', name, '90-day');
                        showCaptureNotice(`✓ Captured: ${name} (CV already in portal for this period)`, false);
                        return;
                    }
                    console.log(LOG, '[CV] No iframe CV. Triggering Download/View CV button, waiting for interceptor...');
                    tryTriggerCvDownload();
                    const deadline = Date.now() + 6000;
                    function checkInterceptor() {
                        if (cvUploadedForProfile === naukriProfileId) {
                            oneClickFullCaptureInProgress = false;
                            console.log(LOG, '[CV] Upload result: STORED (interceptor)');
                            logActivityToPortal('profile_captured_cv_stored', name, 'interceptor');
                            showCaptureNotice(`✓ Captured: ${name} (CV saved to portal)`, false);
                            return;
                        }
                        if (Date.now() < deadline) {
                            setTimeout(checkInterceptor, 400);
                        } else {
                            oneClickFullCaptureInProgress = false;
                            console.warn(LOG, '[CV] Upload result: NO_CV (no iframe, interceptor did not fire in time)');
                            logActivityToPortal('profile_captured', name, 'no_cv');
                            showCaptureNotice(`✓ Captured: ${name} (no CV — try "View CV" or "Download CV" on this page)`, false);
                        }
                    }
                    setTimeout(checkInterceptor, 800);
                    setTimeout(() => { oneClickFullCaptureInProgress = false; }, 15000);
                });
                });
            });
        });
        setTimeout(() => { oneClickFullCaptureInProgress = false; }, 12000);
    }, 1800);
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM + Text Helpers
// ─────────────────────────────────────────────────────────────────────────────

function firstText(selectors) {
    for (const sel of selectors) {
        try {
            const t = document.querySelector(sel)?.innerText?.trim();
            if (t) return t;
        } catch (_) {}
    }
    return '';
}

function extractEmail(text) {
    const m = (text || '').match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    return m ? m[0] : '';
}

function extractPhone(text) {
    const m = (text || '').match(/(?:\+91[\s-]?|91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}/);
    return m ? m[0].replace(/[\s-]/g, '') : '';
}

/**
 * Get the inner text of the MAIN profile area (left side), excluding the
 * right sidebar (similar profiles list) to avoid contamination.
 */
function getProfileAreaText() {
    // Naukri Resdex: the profile is in the left/main content area.
    // The sidebar with "AI matched similar profiles" is a separate panel.
    // Try to find the main profile container; fall back to full page text.
    const mainSelectors = [
        '[class*="profileDetail"]',
        '[class*="profile-detail"]',
        '[class*="leftSection"]',
        '[class*="left-section"]',
        '[class*="mainContent"]',
        '[class*="main-content"]',
        '[class*="previewContainer"]',
        '[class*="preview-container"]',
    ];
    for (const sel of mainSelectors) {
        try {
            const el = document.querySelector(sel);
            if (el && el.innerText.length > 200) return el.innerText;
        } catch (_) {}
    }
    // Fallback: get body text but try to exclude the right sidebar
    return document.body?.innerText || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Text-Based Field Extraction (the heart of the scraper)
// ─────────────────────────────────────────────────────────────────────────────
// Naukri Resdex profile page layout (from real page analysis):
//
//   Subhasmita Sahoo.
//   [icon] 5y    ₹ 7 Lacs (expects: ₹ 14 Lacs)    Bengaluru
//   Current:    Data Engineer at Clinet IT Solution since Aug '20    •    15 Days or less
//   Highest degree:    Bachelor of Technology / Bachelor of Engineering (B Te..)
//   Pref. locations:    Bengaluru, Mumbai, Hyderabad, Remote
//   Key skills:  Python  SQL  Data Migration  Glue  ...

function extractFieldsFromText(text) {
    const fields = {};

    // ── Experience: "5y" or "6y 4m" ──
    // Must appear early in the profile text, before long paragraphs
    const headerText = text.substring(0, 1500); // only look in the header area
    const expMatch = headerText.match(/\b(\d{1,2})\s*y(?:(?:ears?)?\s*(\d{1,2})\s*m(?:onths?)?)?\b/i);
    if (expMatch) {
        fields.experience = expMatch[2]
            ? `${expMatch[1]}y ${expMatch[2]}m`
            : `${expMatch[1]}y`;
    }

    // ── Salary: "₹ 7 Lacs" and "expects: ₹ 14 Lacs" ──
    const salaryMatch = headerText.match(/₹\s*([\d,.]+)\s*Lacs/i);
    if (salaryMatch) {
        fields.current_salary = salaryMatch[1].replace(/,/g, '') + ' Lacs';
    }
    const expectMatch = headerText.match(/expects[:\s]*₹\s*([\d,.]+)\s*Lacs/i);
    if (expectMatch) {
        fields.expected_salary = expectMatch[1].replace(/,/g, '') + ' Lacs';
    }

    // ── Current designation + company: "Current:  Data Engineer at Company since ..." ──
    // Also handles "Current" without colon
    const currentMatch = text.match(/Current[:\s]+(.+?)(?:\s+since\s|\n|\r)/i);
    if (currentMatch) {
        const currentLine = currentMatch[1].trim();
        const atSplit = currentLine.match(/^(.+?)\s+at\s+(.+)/i);
        if (atSplit) {
            fields.designation = atSplit[1].trim();
            fields.company = atSplit[2].trim()
                .replace(/\s*since\s.*$/i, '')   // remove trailing "since ..."
                .replace(/\s*•.*$/, '');          // remove trailing "• notice period"
        } else {
            // No "at" — the whole line might be the designation
            fields.designation = currentLine;
        }
    }

    // ── Highest degree / qualification ──
    const degreeMatch = text.match(/Highest\s+degree[:\s]+(.+?)(?:\n|\r|Pref|Current|Key\s+skill)/i);
    if (degreeMatch) {
        fields.qualification = degreeMatch[1].trim()
            .replace(/\s{2,}/g, ' '); // collapse multiple spaces
    }

    // ── Notice period: "15 Days or less", "1 Month", "Serving notice" ──
    const noticeMatch = headerText.match(/(\d+\s*(?:Days?|Months?|Weeks?)(?:\s+or\s+less)?|Serving\s+[Nn]otice(?:\s+[Pp]eriod)?|Immediately\s+[Aa]vailable)/i);
    if (noticeMatch) {
        fields.notice_period = noticeMatch[0].trim();
    }

    // ── Preferred locations ──
    const prefLocMatch = text.match(/Pref(?:erred)?\.?\s+locations?[:\s]+(.+?)(?:\n|\r|$)/i);
    if (prefLocMatch) {
        fields.preferred_locations = prefLocMatch[1].trim();
    }

    return fields;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skills Extraction (clean, from profile area only)
// ─────────────────────────────────────────────────────────────────────────────

function extractSkills() {
    // Strategy: Find skills without scanning every DOM element.
    let skillTexts = [];

    try {
        // Approach 1: Use targeted selectors (NOT querySelectorAll('*'))
        // Look for headings/labels with "Key skills" text using specific tags only
        const headings = document.querySelectorAll('h2, h3, h4, p, div, span, strong, b');
        let keySkillsSection = null;
        for (const el of headings) {
            // Only check direct text content (not children's text) for performance
            const direct = el.childNodes.length <= 2 ? el.textContent?.trim() : '';
            if (direct === 'Key skills' || direct === 'Key Skills' || direct === 'KEY SKILLS') {
                // Walk up to parent/grandparent to get the full section
                keySkillsSection = el.parentElement?.parentElement || el.parentElement || el;
                break;
            }
        }

        if (keySkillsSection) {
            const tags = keySkillsSection.querySelectorAll('span, a');
            for (const tag of tags) {
                const t = tag.textContent?.trim();
                if (t && t.length > 0 && t.length < 50
                    && !/key\s*skills?/i.test(t)
                    && !t.includes('\n') && !t.startsWith('+')) {
                    const clean = t.replace(/\|/g, '').trim();
                    if (clean && !skillTexts.includes(clean)) skillTexts.push(clean);
                }
            }
        }

        // Approach 2: CSS class selectors
        if (skillTexts.length === 0) {
            const selectors = ['.skill', '[class*="keyskill"]', '[class*="KeySkill"]', '[class*="skill-tag"]'];
            for (const sel of selectors) {
                try {
                    document.querySelectorAll(sel).forEach((el) => {
                        const t = el.textContent?.trim().replace(/\|/g, '').trim();
                        if (t && t.length < 50 && !t.includes('\n') && !skillTexts.includes(t)) {
                            skillTexts.push(t);
                        }
                    });
                } catch (_) {}
            }
        }

        // Approach 3: Regex fallback from page text
        if (skillTexts.length === 0) {
            const text = getProfileAreaText();
            const section = text.match(/Key\s+skills?\s*[:\n](.+?)(?:Profile\s+detail|Attached\s+CV|Work\s+experience|PROFILE|WORK|Other\s+details|$)/is);
            if (section) {
                skillTexts = section[1].split(/[,\n|]+/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50);
            }
        }
    } catch (e) {
        console.warn(LOG, 'Skills extraction error:', e);
    }

    return skillTexts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Scraper
// ─────────────────────────────────────────────────────────────────────────────

function scrapeProfile(onCaptureDone) {
    console.log(LOG, 'scrapeProfile() called. apiKeyChecked:', apiKeyChecked, 'hasApiKey:', !!cachedApiKey);

    if (apiKeyChecked && !cachedApiKey) {
        console.log(LOG, 'BLOCKED: No API key. Show missing key notice.');
        showMissingKeyNotice();
        return;
    }

    // ── GUARD: Only scrape on actual profile preview pages ──
    const currentUrl = window.location.href;
    if (!currentUrl.includes('/v3/preview')) {
        console.log(LOG, 'SKIP: Not a preview page. URL:', currentUrl.substring(0, 80));
        return;
    }

    // Must have a profile ID in the URL
    const naukriProfileId = getNaukriProfileId();
    if (!naukriProfileId) {
        console.log(LOG, 'SKIP: No profile ID in URL');
        return;
    }
    console.log(LOG, 'Profile ID found:', naukriProfileId.substring(0, 20) + '...');

    // ── Name: try multiple approaches ──
    let candidateName = firstText([
        '.title-l',
        '[class*="profileName"]', '[class*="candidateName"]',
        '[class*="candidate-name"]', '[class*="cand-name"]',
    ]);
    console.log(LOG, 'Name from CSS selectors:', candidateName || '(none)');

    // Fallback to h1, but validate it looks like a name
    if (!candidateName) {
        const h1Text = firstText(['h1']);
        console.log(LOG, 'h1 fallback text:', h1Text || '(none)');
        // Filter out UI labels that are definitely not names
        if (h1Text && !/(search|found|profiles?|results?|candidates?|resdex|naukri)/i.test(h1Text)) {
            candidateName = h1Text;
        }
    }

    // Last resort: try the document title (Naukri puts candidate name in tab title)
    if (!candidateName) {
        const titleMatch = document.title?.match(/^([A-Za-z\s.]+?)(?:\s*[-–|]|\s*-\s*\d)/);
        if (titleMatch) {
            candidateName = titleMatch[1].trim();
            console.log(LOG, 'Name from page title:', candidateName);
        }
    }

    if (!candidateName) {
        console.log(LOG, 'SKIP: No candidate name found — page may still be loading');
        return;
    }
    console.log(LOG, 'Candidate name:', candidateName);

    // ── Get page text (with safety) ──
    let profileText = '';
    let fullPageText = '';
    try { profileText = getProfileAreaText(); } catch (_) {}
    try { fullPageText = document.body?.innerText || ''; } catch (_) {}

    // ── Contact extraction ──
    // CRITICAL: Naukri shows the RECRUITER's email/phone in the header area.
    // The CANDIDATE's phone is the ONLY one with "(M)" marker: "9360536344 (M)"
    // The CANDIDATE's email appears as a mailto link or near "Verified phone & email".
    // We MUST use these unique patterns to avoid capturing recruiter info.
    let phone = '';
    let email = '';

    // Use the FULL page text for (M) pattern matching — it's unique to candidate phones
    const fullText = document.body?.innerText || '';

    // ── PHONE: Only trust the "(M)" marker — it's 100% the candidate's phone ──
    const mobileMatch = fullText.match(/(?:\+91[\s-]?|91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})\s*\(M\)/);
    if (mobileMatch) {
        phone = mobileMatch[1].replace(/[\s-]/g, '');
        console.log(LOG, 'Phone found via (M) marker:', phone);
    }
    // Also try DOM: find elements that contain a phone number followed by (M)
    if (!phone) {
        try {
            const allEls = document.querySelectorAll('span, a, div, button');
            for (const el of allEls) {
                const t = el.textContent?.trim() || '';
                if (t.length > 5 && t.length < 40) {
                    const pm = t.match(/([6-9]\d{9})\s*\(M\)/);
                    if (pm) { phone = pm[1]; console.log(LOG, 'Phone from DOM (M) scan:', phone); break; }
                }
            }
        } catch (_) {}
    }

    // ── EMAIL: Find candidate's actual email, NOT WhatsApp links or recruiter info ──
    // Strategy 1: Look for a dedicated email display element (mail icon row)
    try {
        const allEls = document.querySelectorAll('span, a, div, p');
        for (const el of allEls) {
            const t = (el.textContent?.trim() || '');
            if (t.length < 8 || t.length > 60) continue;

            // Match a clean email pattern with word boundary
            const em = t.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})\b/);
            if (!em) continue;
            const foundEmail = em[1].toLowerCase();

            // Skip WhatsApp deep-link emails (contain "candidatewhatsapp" prefix)
            if (foundEmail.includes('candidatewhatsapp')) continue;
            // Skip recruiter/company/platform emails
            if (foundEmail.includes('naukri.com')) continue;
            if (foundEmail.includes('o2finfo')) continue;
            if (foundEmail.includes('corehr')) continue;

            email = foundEmail;
            console.log(LOG, 'Email from DOM:', email);
            break;
        }
    } catch (_) {}

    // Strategy 2: mailto links (skip whatsapp links)
    if (!email) {
        try {
            const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
            for (const link of mailtoLinks) {
                const href = link.getAttribute('href') || '';
                const addr = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
                if (!addr || !addr.includes('@')) continue;
                if (addr.includes('candidatewhatsapp')) continue;
                if (addr.includes('naukri.com')) continue;
                if (addr.includes('o2finfo')) continue;
                if (addr.includes('corehr')) continue;
                email = addr;
                console.log(LOG, 'Email from mailto:', email);
                break;
            }
        } catch (_) {}
    }

    // ── Final cleanup ──
    // Phone: only strip +91/91 prefix if number has MORE than 10 digits
    if (phone) {
        phone = phone.replace(/[\s()-]/g, '');
        if (phone.length > 10) {
            phone = phone.replace(/^\+?91/, '');
        }
    }
    // Email: clean up, ensure no trailing junk text
    if (email) {
        email = email.toLowerCase().trim();
        // Re-extract clean email in case text was concatenated (e.g., "email@gmail.comVerified")
        const cleanMatch = email.match(/^([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,6})/);
        if (cleanMatch) email = cleanMatch[1];
    }
    console.log(LOG, 'Contact result — phone:', phone || '(none)', 'email:', email || '(none)');

    // ── Location (CSS selector + text fallback) ──
    let location = firstText([
        '[class*="location"]', '[class*="Location"]',
        '[class*="current-loc"]', '[class*="city"]',
    ]);

    // ── Extract structured fields from page text (non-blocking) ──
    let extracted = {};
    try {
        extracted = extractFieldsFromText(profileText.length > 200 ? profileText : fullPageText);
    } catch (e) {
        console.warn(LOG, 'Text extraction error (non-fatal):', e);
    }

    // ── Skills (clean, from profile area only) ──
    const skillList = extractSkills();
    const skills = skillList.join(', ');

    // Use text-extracted fields, with CSS as fallback
    const designation = extracted.designation || firstText([
        '.designation-text', '[class*="designation"]', '[class*="currentDesig"]',
    ]);
    const company = extracted.company || firstText([
        '[class*="company"]', '[class*="Company"]', '[class*="currentCompany"]',
    ]);
    const experience = extracted.experience || firstText([
        '[class*="experience"]', '[class*="exp-"]', '[class*="totalExp"]',
    ]);
    const qualification = extracted.qualification || firstText([
        '[class*="qualification"]', '[class*="education"]', '[class*="degree"]',
    ]);
    if (!location && extracted.preferred_locations) {
        location = extracted.preferred_locations.split(',')[0]?.trim() || '';
    }

    // ── Build payload ──
    // (naukriProfileId already defined at top of scrapeProfile)
    const data = {
        candidate_name: candidateName,
        naukri_profile_id: naukriProfileId,
        naukri_url: window.location.href,
        current_designation: designation,
        total_experience: experience,
        current_company: company,
        current_location: location,
        highest_qualification: qualification,
        skills: skills,
        current_salary: extracted.current_salary || '',
        expected_salary: extracted.expected_salary || '',
        notice_period: extracted.notice_period || '',
        preferred_locations: extracted.preferred_locations || '',
    };

    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (cachedApiKey) data.api_key = cachedApiKey;
    if (cachedRecruiterId) data.recruiter_id = cachedRecruiterId;

    console.log(LOG, 'Scraped:', {
        name: candidateName,
        email: email || '(hidden)',
        phone: phone || '(hidden)',
        profileId: (naukriProfileId || '').substring(0, 20) + '...',
        designation: designation || '-',
        company: company || '-',
        experience: experience || '-',
        salary: extracted.current_salary ? `${extracted.current_salary} (exp: ${extracted.expected_salary || '-'})` : '-',
        location: location || '-',
        qualification: qualification ? qualification.substring(0, 40) + '...' : '-',
        skills: skillList.length ? `${skillList.length} skills` : '(none)',
        notice: extracted.notice_period || '-',
    });

    // ── Always capture — contact info is optional (user may need to click "View Phone/Email") ──
    const profileKey = getProfileKey();
    const hasNewContact = (data.email && !lastSentHadEmail) || (data.phone && !lastSentHadPhone);

    if (profileKey === lastSentKey && captureRetries === 0 && !hasNewContact) {
        console.log(LOG, 'Already captured (no new contact info), skipping');
        return;
    }
    if (profileKey === lastSentKey && captureRetries > MAX_RETRIES && !hasNewContact) {
        console.log(LOG, `Max retries (${MAX_RETRIES}) reached`);
        return;
    }

    if (hasNewContact) {
        console.log(LOG, 'New contact info detected! Re-capturing with email:', !!data.email, 'phone:', !!data.phone);
    }

    // Show hint if contact info is missing (but don't block capture)
    if (!data.email && !data.phone) {
        showMissingContactNotice();
    } else {
        removeNotice('ats-ext-contact');
    }

    lastSentKey = profileKey;
    lastSentHadEmail = !!data.email;
    lastSentHadPhone = !!data.phone;

    chrome.runtime.sendMessage({ type: 'CAPTURE_PROFILE', payload: data }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(LOG, 'Extension error:', chrome.runtime.lastError.message);
            showCaptureNotice('Capture failed: extension error', true);
            scheduleRetry(profileKey);
            return;
        }
        if (!response || !response.ok) {
            const err = response?.error || 'Unknown error';
            console.error(LOG, 'Server error:', err);
            showCaptureNotice(`Capture failed: ${err}`, true);
            if (err.includes('Network') || err.includes('timeout')) scheduleRetry(profileKey);
            return;
        }
        captureRetries = 0;
        console.log(LOG, 'Captured OK, id =', response.candidate_id, 'dup:', response.is_duplicate);

        if (typeof onCaptureDone === 'function') {
            onCaptureDone(candidateName);
        } else {
            // ── Smart dedup notification ──
            if (response.is_duplicate) {
                const msg = response.message || 'Profile updated';
                removeNotice('ats-ext-capture');
                showNotice('ats-ext-capture', `⚠ ${candidateName}: ${msg}`, {
                    top: '92px', bg: '#b8860b', autoRemove: 7000,
                });
            } else {
                const contactNote = (!data.email || !data.phone) ? ' (click "View Phone/Email" to add contact)' : '';
                showCaptureNotice(`✓ Captured: ${candidateName}${contactNote}`, false);
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Retry + Scheduler + Observer
// ─────────────────────────────────────────────────────────────────────────────

function scheduleRetry(profileKey) {
    captureRetries++;
    if (captureRetries > MAX_RETRIES) return;
    const delay = captureRetries * 3000;
    console.log(LOG, `Retry ${captureRetries}/${MAX_RETRIES} in ${delay}ms`);
    setTimeout(() => { if (getProfileKey() === profileKey) scrapeProfile(); }, delay);
}

function scheduleScrape() {
    if (scrapeTimer) clearTimeout(scrapeTimer);
    scrapeTimer = setTimeout(() => {
        runOneClickFullCapture();
    }, 800);
}

function checkUrlChange() {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        lastSentKey = null;
        lastSentHadEmail = false;
        lastSentHadPhone = false;
        captureRetries = 0;
        oneClickFullCaptureDoneForProfileKey = null;
        oneClickFullCaptureInProgress = false;
        console.log(LOG, 'URL changed — reset');
        scheduleScrape();
    }
}

// ── DIAGNOSTIC: Visible load indicator ──
// This shows immediately when the content script loads, confirming injection works.
console.log(LOG, 'Content script loaded! v1.9.0 (upload via service worker), URL:', location.href);
try {
    const observer = new MutationObserver(() => { checkUrlChange(); scheduleScrape(); });
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleScrape();
    // Show a brief green flash to confirm the script is running
    showNotice('ats-ext-loaded', 'ATS Extension: Script loaded (v1.9.0)', {
        top: '12px', bg: '#1a7f37', autoRemove: 3000,
    });
} catch (initErr) {
    console.error(LOG, 'INIT ERROR:', initErr);
    // If document.body isn't ready, retry after a short delay
    setTimeout(() => {
        try {
            const observer = new MutationObserver(() => { checkUrlChange(); scheduleScrape(); });
            observer.observe(document.body, { childList: true, subtree: true });
            scheduleScrape();
        } catch (retryErr) {
            console.error(LOG, 'INIT RETRY FAILED:', retryErr);
        }
    }, 1000);
}
