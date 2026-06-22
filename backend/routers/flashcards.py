from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError
from groq import Groq
import os
import json
from dotenv import load_dotenv
from database import get_connection

load_dotenv()

router = APIRouter()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")

def get_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class NotesIn(BaseModel):
    title: str
    notes: str
    count: int = 8
    difficulty: str = "medium"

DIFFICULTY_INSTRUCTIONS = {
    "easy": "Keep answers short and simple. One or two sentences max.",
    "medium": "Give clear answers with some explanation. Two to three sentences.",
    "hard": "Give detailed, thorough answers that require deep understanding. Include nuance and context.",
}

@router.post("/generate")
def generate(data: NotesIn, authorization: str = Header(...)):
    import traceback
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    count = max(1, min(data.count, 30))
    diff_instruction = DIFFICULTY_INSTRUCTIONS.get(data.difficulty, DIFFICULTY_INSTRUCTIONS["medium"])

    prompt = f"""You are a flashcard generator. Return ONLY a JSON array, no markdown, no explanation, no extra text.

Format:
[{{"question": "...", "answer": "..."}}, {{"question": "...", "answer": "..."}}]

Difficulty: {data.difficulty}. {diff_instruction}

Generate exactly {count} flashcards from these notes:
{data.notes}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You return only valid JSON arrays. No markdown. No explanation."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
    except Exception as e:
        print("GROQ ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        cards = json.loads(text)
    except Exception as e:
        print("JSON PARSE ERROR:", e)
        print("RAW TEXT:", text)
        raise HTTPException(status_code=500, detail="Could not parse AI response")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO decks (user_id, title) VALUES (%s, %s) RETURNING id", (user_id, data.title))
    deck_id = cur.fetchone()[0]

    for card in cards:
        cur.execute(
            "INSERT INTO flashcards (deck_id, question, answer) VALUES (%s, %s, %s)",
            (deck_id, card["question"], card["answer"])
        )

    conn.commit()
    cur.close()
    conn.close()

    return {"deck_id": deck_id, "flashcards": cards}

@router.get("/decks")
def get_decks(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, created_at FROM decks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [{"id": r[0], "title": r[1], "created_at": str(r[2])} for r in rows]

@router.get("/decks/{deck_id}")
def get_deck(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id, title FROM decks WHERE id = %s", (deck_id,))
    deck = cur.fetchone()

    if not deck or deck[0] != user_id:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")

    cur.execute("SELECT id, question, answer FROM flashcards WHERE deck_id = %s", (deck_id,))
    cards = cur.fetchall()
    cur.close()
    conn.close()

    return {
        "title": deck[1],
        "flashcards": [{"id": c[0], "question": c[1], "answer": c[2]} for c in cards]
    }

@router.get("/export")
def export_data(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, created_at FROM decks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    decks = cur.fetchall()
    result = []
    for deck in decks:
        cur.execute("SELECT question, answer FROM flashcards WHERE deck_id = %s", (deck[0],))
        cards = cur.fetchall()
        result.append({
            "title": deck[1],
            "created_at": str(deck[2]),
            "flashcards": [{"question": c[0], "answer": c[1]} for c in cards]
        })
    cur.close()
    conn.close()
    return result

@router.delete("/decks/{deck_id}")
def delete_deck(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM decks WHERE id = %s", (deck_id,))
    deck = cur.fetchone()

    if not deck or deck[0] != user_id:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")

    cur.execute("DELETE FROM flashcards WHERE deck_id = %s", (deck_id,))
    cur.execute("DELETE FROM decks WHERE id = %s", (deck_id,))
    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Deleted"}
