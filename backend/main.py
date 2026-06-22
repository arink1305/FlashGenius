import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, flashcards

app = FastAPI()

origins = ["http://localhost:5173"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "FlashGenius API"}

@app.get("/health/db")
def health_db():
    url = os.getenv("DATABASE_URL")
    if not url:
        return {"db": "DATABASE_URL not set"}
    try:
        from database import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return {"db": "ok"}
    except Exception as e:
        return {"db": "error", "detail": str(e)[:300]}

app.include_router(auth.router, prefix="/auth")
app.include_router(flashcards.router, prefix="/flashcards")
