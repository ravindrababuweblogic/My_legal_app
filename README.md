# ⚖️ Legal Safety Assistant

A mobile-first web app that helps users understand their legal situation using AI.

## Features

- 📝 **Text input** — describe your situation in plain English
- 🎤 **Speech-to-text** — tap the mic button to speak
- ⚖️ **AI Analysis** — powered by OpenAI GPT-4o-mini
- 🎯 **Risk Level** — Safe / Caution / High Risk
- ✅ **Action guidance** — what you should do and avoid
- 📞 **Quick actions** — Call a Lawyer & View Rights

## Project Structure

```
├── backend/
│   ├── main.py           # FastAPI app with /analyze endpoint
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Environment variable template
└── frontend/
    ├── index.html        # Main UI (home + results screen)
    ├── style.css         # Mobile-first styles
    └── app.js            # Frontend logic (API calls, speech, UI)
```

## Setup & Running

### Prerequisites
- Python 3.10+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Configure the API key

```bash
cd backend
cp .env.example .env
# Edit .env and set your OPENAI_API_KEY
```

### 2. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Open the app

Visit [http://localhost:8000](http://localhost:8000) in your browser.

## API

### `POST /analyze`

**Request:**
```json
{ "text": "My landlord refuses to return my security deposit." }
```

**Response:**
```json
{
  "risk_level": "Caution",
  "explanation": "...",
  "what_to_do": ["Send a certified letter...", "..."],
  "what_to_avoid": ["Withholding rent...", "..."]
}
```

## Disclaimer

This tool provides general legal information only — **not legal advice**.
Always consult a licensed attorney for your specific situation.
