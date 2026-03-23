/**
 * ATS Connector for Resdex – Search Page Content Script
 *
 * Runs on: https://resdex.naukri.com/v3/search*
 *
 * Captures search context (keywords, result count, URL params) from the
 * Resdex search results page and stores it via the background worker.
 * This context is later attached to profile captures and CV uploads so we
 * can track *which search* led to each candidate.
 */

const LOG = '[ATS-Resdex:Search]';

function captureSearchContext() {
    try {
        const url = new URL(window.location.href);
        const params = Object.fromEntries(url.searchParams.entries());

        // Try to read the result summary text on the page, e.g.
        // "AI found 1,165 profiles for Java Developer in Hyderabad"
        const summaryText = (
            document.querySelector('[class*="resultHeader"]')
            || document.querySelector('[class*="search-result-header"]')
            || document.querySelector('[class*="searchHeader"]')
            || document.querySelector('[class*="srch-header"]')
            || document.querySelector('h1')
            || document.querySelector('h2')
        )?.innerText?.trim() || '';

        // Extract the result count from text like "Found 1,165 profiles"
        let resultCount = null;
        const countMatch = summaryText.match(/([\d,]+)\s*(?:profiles?|results?|candidates?)/i);
        if (countMatch) {
            resultCount = parseInt(countMatch[1].replace(/,/g, ''), 10);
        }

        // Try to extract search keywords from the summary or from URL params
        const keywords = params.qp || params.keywords || params.q || '';

        const context = {
            search_url: window.location.href,
            sid: params.sid || '',
            keywords: keywords,
            summary_text: summaryText.substring(0, 500),
            result_count: resultCount,
            page_no: parseInt(params.pageNo || '1', 10),
            results_per_page: parseInt(params.resPerPage || '0', 10) || null,
            source: params.source || '',
            active_in: params.activeIn || '',
            captured_at: new Date().toISOString(),
        };

        console.log(LOG, 'Search context captured:', context);

        chrome.runtime.sendMessage({
            type: 'SEARCH_CONTEXT',
            payload: context,
        });

    } catch (e) {
        console.warn(LOG, 'Failed to capture search context:', e);
    }
}

// Run after the page settles (Resdex loads results dynamically)
let timer = null;
function scheduleCapture() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(captureSearchContext, 1500);
}

const observer = new MutationObserver(scheduleCapture);
observer.observe(document.body, { childList: true, subtree: true });

// Initial capture
scheduleCapture();
