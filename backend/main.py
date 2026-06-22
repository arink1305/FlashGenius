import os
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

import_error = None
try:
    from routers import auth, flashcards
    app.include_router(auth.router, prefix="/auth")
    app.include_router(flashcards.router, prefix="/flashcards")
except Exception:
    import_error = traceback.format_exc()

@app.get("/")
def root():
    if import_error:
        return {"status": "error", "detail": import_error}
    return {"status": "ok", "service": "FlashGenius API"}
