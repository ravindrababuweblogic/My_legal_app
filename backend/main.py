import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

app = FastAPI(title="Legal Safety Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def validate_config() -> None:
    if not _OPENAI_API_KEY or _OPENAI_API_KEY == "your_openai_api_key_here":
        import warnings
        warnings.warn(
            "OPENAI_API_KEY is not set. The /analyze endpoint will return 503 until it is configured.",
            stacklevel=2,
        )


client = OpenAI(api_key=_OPENAI_API_KEY or "unset")

SYSTEM_PROMPT = """You are a legal risk assessment assistant. When a user describes a situation, 
analyze it and respond ONLY with a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "risk_level": "Safe" | "Caution" | "High Risk",
  "explanation": "A clear, simple 2-3 sentence explanation of the legal situation in plain English.",
  "what_to_do": ["action 1", "action 2", "action 3"],
  "what_to_avoid": ["avoid 1", "avoid 2", "avoid 3"]
}

Risk level guidelines:
- Safe: The situation has minimal or no legal risk.
- Caution: There are some legal considerations to be aware of.
- High Risk: Immediate legal attention or action is strongly recommended.

Keep explanations simple and accessible to non-lawyers."""


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    risk_level: str
    explanation: str
    what_to_do: list[str]
    what_to_avoid: list[str]


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    if not _OPENAI_API_KEY or _OPENAI_API_KEY == "your_openai_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured. Please set OPENAI_API_KEY in the .env file.",
        )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": request.text.strip()},
            ],
            temperature=0.3,
            max_tokens=600,
        )

        raw = response.choices[0].message.content.strip()
        data = json.loads(raw)

        if data.get("risk_level") not in ("Safe", "Caution", "High Risk"):
            data["risk_level"] = "Caution"

        return AnalyzeResponse(**data)

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502, detail="Failed to parse response from AI model."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve the frontend from the /frontend directory
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_path, "index.html"))
