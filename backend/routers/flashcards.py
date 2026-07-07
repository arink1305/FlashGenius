from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError
from groq import Groq
from psycopg2.extras import Json
import os
import json
import secrets
import traceback
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database import get_connection

load_dotenv()

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")

TIER_ORDER = {"free": 0, "plus": 1, "pro": 2, "ultra": 3}
FREE_DECK_LIMIT = 5
FAST_MODEL = "llama-3.1-8b-instant"
SMART_MODEL = "llama-3.3-70b-versatile"

def get_groq():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"])
    except JWTError:
        pass
    if token.startswith("fg_"):
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE api_key = %s", (token,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            return row[0]
    raise HTTPException(status_code=401, detail="Invalid token")

def get_tier(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT tier, is_pro FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return "free"
    tier = row[0] or "free"
    if tier == "free" and row[1]:
        tier = "plus"
    return tier

def require_tier(user_id, minimum):
    tier = get_tier(user_id)
    if TIER_ORDER.get(tier, 0) < TIER_ORDER[minimum]:
        raise HTTPException(status_code=403, detail=f"requires_{minimum}")
    return tier

def check_quota(user_id):
    tier = get_tier(user_id)
    if tier != "free":
        return tier
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM decks WHERE user_id = %s", (user_id,))
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    if count >= FREE_DECK_LIMIT:
        raise HTTPException(status_code=402, detail="free_limit_reached")
    return tier

def model_for(tier):
    return SMART_MODEL if TIER_ORDER.get(tier, 0) >= TIER_ORDER["pro"] else FAST_MODEL

def try_parse_json(text):
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except Exception:
        pass
    for open_c, close_c in (("{", "}"), ("[", "]")):
        start = text.find(open_c)
        end = text.rfind(close_c)
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except Exception:
                continue
    return None

def extract_list(result, key):
    if isinstance(result, list):
        return result
    if isinstance(result, dict):
        if isinstance(result.get(key), list):
            return result[key]
        for value in result.values():
            if isinstance(value, list):
                return value
    return []

def call_groq_json(system, prompt, model=FAST_MODEL):
    try:
        client = get_groq()
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content.strip()
    except Exception as e:
        print("GROQ ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

    parsed = try_parse_json(raw)
    if parsed is None:
        print("JSON PARSE FAIL — raw:", raw[:200])
        raise HTTPException(status_code=500, detail="Could not parse AI response")
    return parsed

def mm_node(data, fallback="Tankekart"):
    if isinstance(data, str):
        return {"title": data, "children": []}
    if isinstance(data, list):
        return {"title": fallback, "children": [mm_node(x) for x in data]}
    if not isinstance(data, dict):
        return {"title": str(data), "children": []}

    title = data.get("title") or data.get("name") or data.get("label") or data.get("topic")
    for key in ("children", "branches", "subtopics", "items", "nodes", "points", "subnodes"):
        if isinstance(data.get(key), list):
            return {"title": title or fallback, "children": [mm_node(c) for c in data[key]]}

    rest = [(k, v) for k, v in data.items() if k not in ("title", "name", "label", "topic")]
    if not rest:
        return {"title": title or fallback, "children": []}
    if title is None and len(rest) == 1:
        k, v = rest[0]
        node = mm_node(v, k)
        if not node.get("title") or node["title"] == fallback:
            node["title"] = k
        return node

    kids = []
    for k, v in rest:
        node = mm_node(v, k)
        if not node.get("title") or node["title"] == fallback:
            node["title"] = k
        kids.append(node)
    return {"title": title or fallback, "children": kids}

def save_content_deck(user_id, title, deck_type, content):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO decks (user_id, title, type, content) VALUES (%s, %s, %s, %s) RETURNING id",
        (user_id, title, deck_type, Json(content)),
    )
    deck_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return deck_id

class NotesIn(BaseModel):
    title: str
    notes: str
    count: int = 8
    difficulty: str = "medium"

class QuizIn(BaseModel):
    title: str
    notes: str
    count: int = 6
    kind: str = "multiple"

class SummaryIn(BaseModel):
    title: str
    notes: str

class MindmapIn(BaseModel):
    title: str
    notes: str

class FolderIn(BaseModel):
    name: str

class DeckFolderIn(BaseModel):
    folder_id: int | None = None

class ReviewIn(BaseModel):
    card_id: int
    deck_id: int
    quality: int

DIFFICULTY_INSTRUCTIONS = {
    "easy": "Keep answers short and simple. One or two sentences max.",
    "medium": "Give clear answers with some explanation. Two to three sentences.",
    "hard": "Give detailed, thorough answers that require deep understanding. Include nuance and context.",
}

@router.post("/generate")
def generate(data: NotesIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    tier = check_quota(user_id)
    count = max(1, min(data.count, 30))
    diff_instruction = DIFFICULTY_INSTRUCTIONS.get(data.difficulty, DIFFICULTY_INSTRUCTIONS["medium"])

    prompt = f"""You are a flashcard generator. Return ONLY a JSON object, no markdown, no explanation.

Format:
{{"cards": [{{"question": "...", "answer": "..."}}]}}

Difficulty: {data.difficulty}. {diff_instruction}
Write in the same language as the notes.

Generate exactly {count} flashcards from these notes:
{data.notes[:6000]}"""

    cards = extract_list(call_groq_json("You return only a valid JSON object. No markdown.", prompt, model_for(tier)), "cards")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO decks (user_id, title, type) VALUES (%s, %s, 'flashcards') RETURNING id", (user_id, data.title))
    deck_id = cur.fetchone()[0]
    for card in cards:
        cur.execute(
            "INSERT INTO flashcards (deck_id, question, answer) VALUES (%s, %s, %s)",
            (deck_id, card["question"], card["answer"])
        )
    conn.commit()
    cur.close()
    conn.close()

    return {"deck_id": deck_id, "type": "flashcards", "flashcards": cards}

@router.post("/generate-quiz")
def generate_quiz(data: QuizIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    tier = check_quota(user_id)
    count = max(1, min(data.count, 20))

    prompt = f"""You are a quiz generator. Return ONLY a JSON object, no markdown, no explanation.

Format:
{{"questions": [{{"question": "...", "options": ["...", "...", "...", "..."], "answer": "..."}}]}}

Mix two question styles within the same quiz:
- Most questions: a question with exactly 4 distinct, plausible options.
- Some questions: a yes/no statement where "options" is exactly ["Ja", "Nei"].
For every question, "answer" must exactly equal the correct option string.
Write in the same language as the notes.

Generate exactly {count} quiz questions from these notes:
{data.notes[:6000]}"""

    questions = extract_list(call_groq_json("You return only a valid JSON object. No markdown.", prompt, model_for(tier)), "questions")
    deck_id = save_content_deck(user_id, data.title, "quiz", questions)
    return {"deck_id": deck_id, "type": "quiz", "content": questions}

@router.post("/generate-summary")
def generate_summary(data: SummaryIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    tier = check_quota(user_id)

    prompt = f"""You are a study summarizer. Return ONLY a JSON object, no markdown, no explanation.

Format:
{{"summary": "a clear, well-structured summary of a few short paragraphs", "key_points": ["point 1", "point 2", "point 3"]}}

Write 4 to 8 key points. Write in the same language as the notes.

Summarize these notes:
{data.notes[:6000]}"""

    content = call_groq_json("You return only a valid JSON object. No markdown. No explanation.", prompt, model_for(tier))
    deck_id = save_content_deck(user_id, data.title, "summary", content)
    return {"deck_id": deck_id, "type": "summary", "content": content}

@router.post("/generate-mindmap")
def generate_mindmap(data: MindmapIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    tier = check_quota(user_id)
    require_tier(user_id, "plus")

    prompt = f"""You are a mind map generator. Return ONLY a JSON object, no markdown, no explanation.

Format (a recursive tree — every node has "title" and "children"):
{{"title": "central topic", "children": [{{"title": "main branch", "children": [{{"title": "subtopic", "children": [{{"title": "detail", "children": []}}]}}]}}]}}

Rules:
- The root "title" is the overall topic.
- Create 4 to 6 main branches.
- EVERY main branch MUST contain 2 to 4 subtopics as its own children — never leave a main branch empty.
- Most subtopics should have 1 to 3 short details as their children (go at most 3 levels deep below the root).
- Break the topic down even if the notes are short — infer reasonable subtopics.
- Keep every label short: 1 to 4 words, not a full sentence.
- Only the deepest detail nodes have "children": [].
- The root object itself must use the "title" key — do NOT use the topic name as an object key.
- Write in the same language as the notes.

Build a mind map from these notes:
{data.notes[:6000]}"""

    content = call_groq_json("You return only a valid JSON object. No markdown. No explanation.", prompt, model_for(tier))
    content = mm_node(content, data.title)
    deck_id = save_content_deck(user_id, data.title, "mindmap", content)
    return {"deck_id": deck_id, "type": "mindmap", "content": content}

@router.get("/decks")
def get_decks(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, type, created_at, folder_id FROM decks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [{"id": r[0], "title": r[1], "type": r[2] or "flashcards", "created_at": str(r[3]), "folder_id": r[4]} for r in rows]

@router.get("/folders")
def get_folders(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, created_at FROM folders WHERE user_id = %s ORDER BY created_at", (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "name": r[1], "created_at": str(r[2])} for r in rows]

@router.post("/folders")
def create_folder(data: FolderIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name required")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO folders (user_id, name) VALUES (%s, %s) RETURNING id", (user_id, name[:60]))
    folder_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": folder_id, "name": name[:60]}

@router.put("/folders/{folder_id}")
def rename_folder(folder_id: int, data: FolderIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name required")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE folders SET name = %s WHERE id = %s AND user_id = %s", (name[:60], folder_id, user_id))
    conn.commit()
    updated = cur.rowcount
    cur.close()
    conn.close()
    if not updated:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"id": folder_id, "name": name[:60]}

@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM folders WHERE id = %s AND user_id = %s", (folder_id, user_id))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Folder not found")
    cur.execute("UPDATE decks SET folder_id = NULL WHERE folder_id = %s AND user_id = %s", (folder_id, user_id))
    cur.execute("DELETE FROM folders WHERE id = %s", (folder_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Deleted"}

@router.put("/decks/{deck_id}/folder")
def move_deck(deck_id: int, data: DeckFolderIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    conn = get_connection()
    cur = conn.cursor()
    if data.folder_id is not None:
        cur.execute("SELECT id FROM folders WHERE id = %s AND user_id = %s", (data.folder_id, user_id))
        if not cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Folder not found")
    cur.execute("UPDATE decks SET folder_id = %s WHERE id = %s AND user_id = %s", (data.folder_id, deck_id, user_id))
    conn.commit()
    updated = cur.rowcount
    cur.close()
    conn.close()
    if not updated:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"deck_id": deck_id, "folder_id": data.folder_id}

@router.get("/decks/{deck_id}")
def get_deck(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id, title, type, content, share_token FROM decks WHERE id = %s", (deck_id,))
    deck = cur.fetchone()

    if not deck or deck[0] != user_id:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")

    deck_type = deck[2] or "flashcards"

    if deck_type == "flashcards":
        cur.execute("SELECT id, question, answer FROM flashcards WHERE deck_id = %s", (deck_id,))
        cards = cur.fetchall()
        cur.close()
        conn.close()
        return {
            "title": deck[1],
            "type": "flashcards",
            "share_token": deck[4],
            "flashcards": [{"id": c[0], "question": c[1], "answer": c[2]} for c in cards]
        }

    cur.close()
    conn.close()
    return {"title": deck[1], "type": deck_type, "share_token": deck[4], "content": deck[3]}

@router.post("/decks/{deck_id}/share")
def share_deck(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    require_tier(user_id, "ultra")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id, share_token FROM decks WHERE id = %s", (deck_id,))
    deck = cur.fetchone()
    if not deck or deck[0] != user_id:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")
    share_token = deck[1] or secrets.token_urlsafe(12)
    cur.execute("UPDATE decks SET share_token = %s WHERE id = %s", (share_token, deck_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"share_token": share_token}

@router.delete("/decks/{deck_id}/share")
def unshare_deck(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE decks SET share_token = NULL WHERE id = %s AND user_id = %s", (deck_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Unshared"}

@router.get("/shared/{share_token}")
def get_shared_deck(share_token: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, type, content FROM decks WHERE share_token = %s", (share_token,))
    deck = cur.fetchone()
    if not deck:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")
    deck_type = deck[2] or "flashcards"
    if deck_type == "flashcards":
        cur.execute("SELECT question, answer FROM flashcards WHERE deck_id = %s", (deck[0],))
        cards = cur.fetchall()
        cur.close()
        conn.close()
        return {"title": deck[1], "type": "flashcards", "flashcards": [{"question": c[0], "answer": c[1]} for c in cards]}
    cur.close()
    conn.close()
    return {"title": deck[1], "type": deck_type, "content": deck[3]}

@router.get("/decks/{deck_id}/due")
def get_due_cards(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    require_tier(user_id, "pro")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM decks WHERE id = %s", (deck_id,))
    deck = cur.fetchone()
    if not deck or deck[0] != user_id:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Deck not found")
    cur.execute("""
        SELECT f.id, f.question, f.answer, p.due, p.reps
        FROM flashcards f
        LEFT JOIN card_progress p ON p.card_id = f.id AND p.user_id = %s
        WHERE f.deck_id = %s AND (p.due IS NULL OR p.due <= NOW())
        ORDER BY p.due NULLS FIRST
    """, (user_id, deck_id))
    rows = cur.fetchall()
    cur.execute("SELECT count(*) FROM flashcards WHERE deck_id = %s", (deck_id,))
    total = cur.fetchone()[0]
    cur.close()
    conn.close()
    return {
        "total": total,
        "due": [{"id": r[0], "question": r[1], "answer": r[2], "reps": r[4] or 0} for r in rows],
    }

@router.post("/review")
def review_card(data: ReviewIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    require_tier(user_id, "pro")
    quality = max(0, min(data.quality, 5))

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT f.id FROM flashcards f
        JOIN decks d ON d.id = f.deck_id
        WHERE f.id = %s AND d.user_id = %s
    """, (data.card_id, user_id))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Card not found")

    cur.execute("SELECT ease, interval_days, reps FROM card_progress WHERE user_id = %s AND card_id = %s", (user_id, data.card_id))
    row = cur.fetchone()
    ease, interval, reps = (row[0], row[1], row[2]) if row else (2.5, 0.0, 0)

    if quality < 3:
        reps = 0
        interval = 0
    else:
        if reps == 0:
            interval = 1
        elif reps == 1:
            interval = 6
        else:
            interval = round(interval * ease, 1)
        reps += 1
        ease = max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

    due = datetime.utcnow() + timedelta(days=interval if interval > 0 else 0.007)
    cur.execute("""
        INSERT INTO card_progress (user_id, card_id, deck_id, ease, interval_days, reps, due)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id, card_id)
        DO UPDATE SET ease = %s, interval_days = %s, reps = %s, due = %s
    """, (user_id, data.card_id, data.deck_id, ease, interval, reps, due, ease, interval, reps, due))
    cur.execute(
        "INSERT INTO review_log (user_id, card_id, deck_id, quality) VALUES (%s, %s, %s, %s)",
        (user_id, data.card_id, data.deck_id, quality),
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"ease": ease, "interval_days": interval, "reps": reps, "due": str(due)}

@router.get("/stats")
def get_stats(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    require_tier(user_id, "pro")
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT date(reviewed_at) AS day, count(*)
        FROM review_log
        WHERE user_id = %s AND reviewed_at >= NOW() - INTERVAL '7 days'
        GROUP BY day ORDER BY day
    """, (user_id,))
    week = {str(r[0]): r[1] for r in cur.fetchall()}

    cur.execute("""
        SELECT DISTINCT date(reviewed_at) AS day
        FROM review_log WHERE user_id = %s
        ORDER BY day DESC
    """, (user_id,))
    days = [r[0] for r in cur.fetchall()]
    streak = 0
    if days:
        today = datetime.utcnow().date()
        expected = today
        if days[0] != today:
            expected = today - timedelta(days=1)
        for day in days:
            if day == expected:
                streak += 1
                expected -= timedelta(days=1)
            else:
                break

    cur.execute("""
        SELECT d.id, d.title,
               count(f.id) AS total,
               count(p.id) FILTER (WHERE p.reps >= 2) AS learned
        FROM decks d
        JOIN flashcards f ON f.deck_id = d.id
        LEFT JOIN card_progress p ON p.card_id = f.id AND p.user_id = %s
        WHERE d.user_id = %s AND d.type = 'flashcards'
        GROUP BY d.id, d.title
        ORDER BY d.created_at DESC
    """, (user_id, user_id))
    mastery = [
        {"deck_id": r[0], "title": r[1], "total": r[2], "learned": r[3], "pct": round(r[3] / r[2] * 100) if r[2] else 0}
        for r in cur.fetchall()
    ]

    cur.execute("SELECT count(*) FROM review_log WHERE user_id = %s AND reviewed_at >= NOW() - INTERVAL '7 days'", (user_id,))
    week_total = cur.fetchone()[0]

    cur.close()
    conn.close()

    today = datetime.utcnow().date()
    week_series = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        week_series.append({"day": str(day), "count": week.get(str(day), 0)})

    return {"streak": streak, "week_total": week_total, "week": week_series, "mastery": mastery}

@router.get("/export")
def export_data(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    require_tier(user_id, "plus")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, type, content, created_at FROM decks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    decks = cur.fetchall()
    result = []
    for deck in decks:
        deck_type = deck[2] or "flashcards"
        item = {"title": deck[1], "type": deck_type, "created_at": str(deck[4])}
        if deck_type == "flashcards":
            cur.execute("SELECT question, answer FROM flashcards WHERE deck_id = %s", (deck[0],))
            item["flashcards"] = [{"question": c[0], "answer": c[1]} for c in cur.fetchall()]
        else:
            item["content"] = deck[3]
        result.append(item)
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

    cur.execute("DELETE FROM card_progress WHERE deck_id = %s", (deck_id,))
    cur.execute("DELETE FROM flashcards WHERE deck_id = %s", (deck_id,))
    cur.execute("DELETE FROM decks WHERE id = %s", (deck_id,))
    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Deleted"}
