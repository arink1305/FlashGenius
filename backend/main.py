import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, flashcards

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "FlashGenius API"}

@app.get("/health/db")
def health_db():
    env_present = {k: bool(os.getenv(k)) for k in ["DATABASE_URL", "GROQ_API_KEY", "SECRET_KEY", "FRONTEND_URL"]}
    url = os.getenv("DATABASE_URL")
    db = "DATABASE_URL not set"
    if url:
        try:
            from database import get_connection
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.close()
            conn.close()
            db = "ok"
        except Exception as e:
            db = "error: " + str(e)[:200]
    return {"db": db, "env_present": env_present}

app.include_router(auth.router, prefix="/auth")
app.include_router(flashcards.router, prefix="/flashcards")
