/**
 * ATS Connector – CV Download Interceptor (MAIN WORLD)
 * v1.9.0
 *
 * Runs in the page's MAIN world (injected via manifest.json "world": "MAIN").
 * Monkey-patches XMLHttpRequest and fetch() to capture resume file downloads.
 *
 * IMPORTANT: We must NOT interfere with blob: or data: URL fetches — Naukri's
 * CSP blocks them if the call goes through our wrapper (changes security context).
 * We only intercept regular HTTP(S) API calls that return resume content types.
 */

(function () {
    'use strict';

    if (window.__ats_cv_interceptor) return;
    window.__ats_cv_interceptor = true;

    var LOG = '[ATS-Resdex:PAGE]';

    function isResumeContentType(ct) {
        if (!ct) return false;
        ct = ct.toLowerCase();
        return (
            ct.includes('pdf') ||
            ct.includes('msword') ||
            ct.includes('wordprocessing') ||
            ct.includes('octet-stream') ||
            ct.includes('force-download') ||
            ct.includes('application/download')
        );
    }

    function sendToContentScript(blob, sourceUrl, contentType) {
        if (!blob || blob.size < 500) return;
        if (blob.size > 20 * 1024 * 1024) return;

        console.log(LOG, 'CV file intercepted!', blob.size, 'bytes, type:', contentType, 'from:', (sourceUrl || '').substring(0, 80));

        var reader = new FileReader();
        reader.onloadend = function () {
            window.postMessage(
                {
                    type: '__ATS_CV_CAPTURED__',
                    dataUrl: reader.result,
                    sourceUrl: sourceUrl || '',
                    contentType: contentType || '',
                    size: blob.size,
                },
                '*'
            );
            console.log(LOG, 'CV data posted to content script (' + blob.size + ' bytes)');
        };
        reader.readAsDataURL(blob);
    }

    // ── Helper: check if a URL should be LEFT ALONE (not wrapped) ─────────────
    function shouldPassThrough(url) {
        if (typeof url !== 'string') return false;
        // blob: and data: URLs break under CSP when called through our wrapper
        return url.startsWith('blob:') || url.startsWith('data:');
    }

    // ── Patch XMLHttpRequest ──────────────────────────────────────────────────
    var XHR = XMLHttpRequest.prototype;
    var origOpen = XHR.open;
    var origSend = XHR.send;

    XHR.open = function (method, url) {
        this.__ats_url = url;
        return origOpen.apply(this, arguments);
    };

    XHR.send = function () {
        // Only attach listener for regular HTTP(S) URLs — skip blob:/data: to avoid CSP errors
        var xhrUrl = this.__ats_url || '';
        if (!shouldPassThrough(xhrUrl)) {
            var xhr = this;
            xhr.addEventListener('load', function () {
                try {
                    var ct = (xhr.getResponseHeader('content-type') || '').toLowerCase();
                    if (!isResumeContentType(ct)) return;

                    var url = xhr.responseURL || xhr.__ats_url || '';
                    var blob;

                    if (xhr.responseType === 'blob' && xhr.response instanceof Blob) {
                        blob = xhr.response;
                    } else if (xhr.responseType === 'arraybuffer' && xhr.response) {
                        blob = new Blob([xhr.response], { type: ct });
                    }

                    if (blob) sendToContentScript(blob, url, ct);
                } catch (e) {
                    // silent
                }
            });
        }
        return origSend.apply(this, arguments);
    };

    // ── Patch fetch ───────────────────────────────────────────────────────────
    // CRITICAL: Pass through blob: and data: URLs directly to the original fetch
    // without wrapping. Our .then() wrapper changes the security context, causing
    // CSP to block blob: URLs that Naukri's own code creates.
    var origFetch = window.fetch;
    window.fetch = function () {
        var firstArg = arguments[0];
        var url = typeof firstArg === 'string' ? firstArg : (firstArg && firstArg.url ? firstArg.url : '');

        // ── Pass through blob:/data: URLs untouched ──
        if (shouldPassThrough(url)) {
            return origFetch.apply(this, arguments);
        }

        // ── For regular HTTP(S) URLs: intercept resume responses ──
        var args = arguments;
        return origFetch.apply(this, arguments).then(function (response) {
            try {
                var ct = (response.headers.get('content-type') || '').toLowerCase();
                if (isResumeContentType(ct)) {
                    var clone = response.clone();
                    clone.blob().then(function (blob) {
                        var respUrl = response.url || (typeof args[0] === 'string' ? args[0] : '');
                        sendToContentScript(blob, respUrl, ct);
                    }).catch(function () {});
                }
            } catch (e) {
                // silent
            }
            return response;
        });
    };

    // ── Monitor anchor clicks with download attribute ─────────────────────────
    // For blob:/data: anchor downloads, we read the blob directly instead of
    // calling fetch (which would be blocked by CSP).
    document.addEventListener(
        'click',
        function (e) {
            var a = e.target.closest ? e.target.closest('a[href]') : null;
            if (!a) return;
            var href = a.href || '';

            if (!a.hasAttribute('download') && !/\.(pdf|docx?)$/i.test(href)) return;

            if (href.startsWith('blob:')) {
                // Use URL.createObjectURL reverse lookup — read blob via XHR instead of fetch
                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', href, true);
                    xhr.responseType = 'blob';
                    xhr.onload = function () {
                        if (xhr.status === 200 && xhr.response) {
                            sendToContentScript(xhr.response, href, xhr.response.type || 'application/pdf');
                        }
                    };
                    xhr.send();
                } catch (e) {
                    // silent
                }
            }
        },
        true
    );

    console.log(LOG, 'CV interceptor v1.9.0 active — monitoring XHR, fetch, and anchor downloads');
})();
