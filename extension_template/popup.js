const form = document.getElementById('login-form');
const statusEl = document.getElementById('status');
const loggedInView = document.getElementById('logged-in');
const loggedInText = document.getElementById('logged-in-text');
const sessionTimerEl = document.getElementById('session-timer');
const captureStatusEl = document.getElementById('capture-status');
const logoutButton = document.getElementById('logout-button');
const quietModeCheckbox = document.getElementById('quiet-mode');
const clearDataButton = document.getElementById('clear-data-button');

const serverUrl = 'https://portal.o2finfosolutions.com';
const loginEndpoint = '/api/plugin-login';

function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

function showLoginForm() {
    loggedInView.style.display = 'none';
    form.style.display = 'block';
    setStatus('', '');
}

function showLoggedIn(recruiterId) {
    form.style.display = 'none';
    loggedInView.style.display = 'block';
    loggedInText.textContent = `Logged in as ${recruiterId || 'Unknown'}`;
}

function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startSessionTimer(loginTimeIso) {
    if (!sessionTimerEl || !loginTimeIso) {
        return;
    }
    const loginTime = new Date(loginTimeIso);
    if (Number.isNaN(loginTime.getTime())) {
        return;
    }

    const updateTimer = () => {
        const seconds = Math.max(0, Math.floor((Date.now() - loginTime.getTime()) / 1000));
        sessionTimerEl.textContent = `Session: ${formatDuration(seconds)}`;
    };
    updateTimer();
    setInterval(updateTimer, 1000);
}

function updateLastCapture(lastCaptureIso) {
    if (!captureStatusEl) {
        return;
    }
    if (!lastCaptureIso) {
        captureStatusEl.textContent = 'Last capture: —';
        return;
    }
    const ts = new Date(lastCaptureIso);
    if (Number.isNaN(ts.getTime())) {
        captureStatusEl.textContent = 'Last capture: —';
        return;
    }
    captureStatusEl.textContent = `Last capture: ${ts.toLocaleString()}`;
}

async function checkSession() {
    const stored = await chrome.storage.local.get(['api_key', 'recruiter_id', 'username', 'login_time', 'last_capture_at', 'quiet_mode']);
    if (stored.api_key) {
        showLoggedIn(stored.username || stored.recruiter_id);
        startSessionTimer(stored.login_time);
        updateLastCapture(stored.last_capture_at);
        if (quietModeCheckbox) quietModeCheckbox.checked = stored.quiet_mode !== false;
    } else {
        showLoginForm();
    }
}

if (quietModeCheckbox) {
    quietModeCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ quiet_mode: quietModeCheckbox.checked });
    });
}

if (clearDataButton) {
    clearDataButton.addEventListener('click', async () => {
        if (!confirm('Clear extension data? This only resets "already captured" list and CV state. You will stay logged in. Naukri cookies are not touched.')) return;
        await chrome.storage.local.remove([
            'one_click_captured_profiles', 'last_cv_candidate_name', 'last_cv_upload_at',
            'cv_download_expected', 'cv_download_expected_at'
        ]);
        if (captureStatusEl) captureStatusEl.textContent = 'Last capture: —';
        clearDataButton.textContent = 'Cleared';
        setTimeout(() => { clearDataButton.textContent = 'Clear extension data'; }, 2000);
    });
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('Logging in...', '');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(serverUrl + loginEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            setStatus(data.error || 'Login failed', 'error');
            return;
        }

        if (!data.token) {
            setStatus('No api_key returned from server', 'error');
            return;
        }

        await chrome.storage.local.set({
            api_key: data.token,
            recruiter_id: data.user_id,
            username: data.username || username,
            login_time: new Date().toISOString()
        });

        showLoggedIn(data.username || username);
        startSessionTimer(new Date().toISOString());
    } catch (error) {
        setStatus('Network error. Please try again.', 'error');
    }
});

logoutButton.addEventListener('click', async () => {
    await chrome.storage.local.remove(['api_key', 'recruiter_id', 'username', 'login_time', 'last_capture_at']);
    showLoginForm();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
        return;
    }
    if (changes.last_capture_at) {
        updateLastCapture(changes.last_capture_at.newValue);
    }
});

checkSession();
