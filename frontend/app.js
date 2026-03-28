/* ───────────────────────────────────────────────────────────────────────────
   Legal Safety Assistant — Frontend Logic
   ──────────────────────────────────────────────────────────────────────────── */

const API_BASE = window.location.origin; // same-origin when served by FastAPI

// ─── DOM References ──────────────────────────────────────────────────────────
const homeScreen    = document.getElementById('home-screen');
const resultsScreen = document.getElementById('results-screen');

const legalInput  = document.getElementById('legal-input');
const charCount   = document.getElementById('char-count');
const micBtn      = document.getElementById('mic-btn');
const micStatus   = document.getElementById('mic-status');
const analyzeBtn  = document.getElementById('analyze-btn');
const btnText     = document.getElementById('btn-text');
const btnSpinner  = document.getElementById('btn-spinner');
const backBtn     = document.getElementById('back-btn');

const riskCard    = document.getElementById('risk-card');
const riskIcon    = document.getElementById('risk-icon');
const riskLevel   = document.getElementById('risk-level');
const explanation = document.getElementById('explanation');
const whatToDo    = document.getElementById('what-to-do');
const whatToAvoid = document.getElementById('what-to-avoid');

const rightsBtn    = document.getElementById('rights-btn');
const rightsModal  = document.getElementById('rights-modal');
const closeModal   = document.getElementById('close-modal');

// ─── Character Counter ───────────────────────────────────────────────────────
legalInput.addEventListener('input', () => {
  charCount.textContent = legalInput.value.length;
});

// ─── Speech Recognition ──────────────────────────────────────────────────────
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('recording');
    micStatus.textContent = '🔴 Listening… speak now';
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(r => r[0].transcript)
      .join('');
    legalInput.value = transcript;
    charCount.textContent = transcript.length;
  };

  recognition.onerror = (event) => {
    micStatus.textContent =
      event.error === 'not-allowed'
        ? 'Microphone access denied.'
        : 'Speech recognition error. Try typing instead.';
    stopRecording();
  };

  recognition.onend = () => {
    if (isRecording) stopRecording();
    if (micStatus.textContent.startsWith('🔴')) {
      micStatus.textContent = '';
    }
  };
} else {
  micBtn.title = 'Speech recognition not supported in this browser';
  micBtn.style.opacity = '0.45';
  micBtn.style.cursor = 'not-allowed';
}

function stopRecording() {
  isRecording = false;
  micBtn.classList.remove('recording');
  if (recognition) recognition.stop();
}

micBtn.addEventListener('click', () => {
  if (!SpeechRecognition) {
    micStatus.textContent = 'Speech recognition is not supported in this browser.';
    return;
  }
  if (isRecording) {
    stopRecording();
    micStatus.textContent = '';
  } else {
    micStatus.textContent = '';
    recognition.start();
  }
});

// ─── Navigate to Screen ───────────────────────────────────────────────────────
function showScreen(screenEl) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screenEl.classList.add('active');
  window.scrollTo(0, 0);
}

backBtn.addEventListener('click', () => showScreen(homeScreen));

// ─── Analyze ──────────────────────────────────────────────────────────────────
analyzeBtn.addEventListener('click', async () => {
  const text = legalInput.value.trim();
  if (!text) {
    legalInput.focus();
    legalInput.style.borderColor = 'var(--high-risk)';
    setTimeout(() => (legalInput.style.borderColor = ''), 1500);
    return;
  }

  // Show loading state
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error: ${response.status}`);
    }

    const data = await response.json();
    renderResults(data);
    showScreen(resultsScreen);
  } catch (err) {
    showError(err.message || 'Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
});

// ─── Render Results ───────────────────────────────────────────────────────────
function renderResults(data) {
  // Risk card
  riskCard.className = 'card risk-card';
  const level = data.risk_level || 'Caution';

  if (level === 'Safe') {
    riskCard.classList.add('risk-safe');
    riskIcon.textContent = '✅';
  } else if (level === 'High Risk') {
    riskCard.classList.add('risk-high');
    riskIcon.textContent = '🚨';
  } else {
    riskCard.classList.add('risk-caution');
    riskIcon.textContent = '⚠️';
  }

  riskLevel.textContent = level;
  explanation.textContent = data.explanation || '—';

  renderList(whatToDo, data.what_to_do);
  renderList(whatToAvoid, data.what_to_avoid);
}

function renderList(ulEl, items) {
  ulEl.innerHTML = '';
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No specific items to display.';
    ulEl.appendChild(li);
    return;
  }
  arr.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ulEl.appendChild(li);
  });
}

// ─── Loading State ────────────────────────────────────────────────────────────
function setLoading(loading) {
  analyzeBtn.disabled = loading;
  btnText.textContent = loading ? 'Analyzing…' : 'Start Legal Mode';
  btnSpinner.classList.toggle('hidden', !loading);
}

// ─── Error Handling ───────────────────────────────────────────────────────────
function showError(message) {
  // Show the results screen with an error card
  riskCard.className = 'card risk-card risk-high';
  riskIcon.textContent = '❌';
  riskLevel.textContent = 'Error';
  explanation.textContent = message;
  renderList(whatToDo, ['Please check your input and try again.']);
  renderList(whatToAvoid, ['Submitting an empty or very short description.']);
  showScreen(resultsScreen);
}

// ─── Rights Modal ─────────────────────────────────────────────────────────────
rightsBtn.addEventListener('click', () => {
  rightsModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
});

function closeRightsModal() {
  rightsModal.classList.add('hidden');
  document.body.style.overflow = '';
}

closeModal.addEventListener('click', closeRightsModal);

rightsModal.addEventListener('click', (e) => {
  if (e.target === rightsModal) closeRightsModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeRightsModal();
});
