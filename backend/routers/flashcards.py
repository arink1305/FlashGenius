from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError
from groq import Groq
from psycopg2.extras import Json
import os
import json
import traceback
from dotenv import load_dotenv
from database import get_connection

load_dotenv()

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")

def get_groq():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

FREE_DECK_LIMIT = 5

def check_quota(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT is_pro FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if row and row[0]:
        cur.close()
        conn.close()
        return
    cur.execute("SELECT count(*) FROM decks WHERE user_id = %s", (user_id,))
    count = cur.fetchone()[0]
    cur.close()
    conn.close()
    if count >= FREE_DECK_LIMIT:
        raise HTTPException(status_code=402, detail="free_limit_reached")

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

def call_groq_json(system, prompt):
    try:
        client = get_groq()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
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

DIFFICULTY_INSTRUCTIONS = {
    "easy": "Keep answers short and simple. One or two sentences max.",
    "medium": "Give clear answers with some explanation. Two to three sentences.",
    "hard": "Give detailed, thorough answers that require deep understanding. Include nuance and context.",
}

@router.post("/generate")
def generate(data: NotesIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    check_quota(user_id)
    count = max(1, min(data.count, 30))
    diff_instruction = DIFFICULTY_INSTRUCTIONS.get(data.difficulty, DIFFICULTY_INSTRUCTIONS["medium"])

    prompt = f"""You are a flashcard generator. Return ONLY a JSON object, no markdown, no explanation.

Format:
{{"cards": [{{"question": "...", "answer": "..."}}]}}

Difficulty: {data.difficulty}. {diff_instruction}
Write in the same language as the notes.

Generate exactly {count} flashcards from these notes:
{data.notes[:6000]}"""

    cards = extract_list(call_groq_json("You return only a valid JSON object. No markdown.", prompt), "cards")

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
    check_quota(user_id)
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

    questions = extract_list(call_groq_json("You return only a valid JSON object. No markdown.", prompt), "questions")
    deck_id = save_content_deck(user_id, data.title, "quiz", questions)
    return {"deck_id": deck_id, "type": "quiz", "content": questions}

@router.post("/generate-summary")
def generate_summary(data: SummaryIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    check_quota(user_id)

    prompt = f"""You are a study summarizer. Return ONLY a JSON object, no markdown, no explanation.

Format:
{{"summary": "a clear, well-structured summary of a few short paragraphs", "key_points": ["point 1", "point 2", "point 3"]}}

Write 4 to 8 key points. Write in the same language as the notes.

Summarize these notes:
{data.notes[:6000]}"""

    content = call_groq_json("You return only a valid JSON object. No markdown. No explanation.", prompt)
    deck_id = save_content_deck(user_id, data.title, "summary", content)
    return {"deck_id": deck_id, "type": "summary", "content": content}

@router.post("/generate-mindmap")
def generate_mindmap(data: MindmapIn, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
    check_quota(user_id)

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

    content = call_groq_json("You return only a valid JSON object. No markdown. No explanation.", prompt)
    content = mm_node(content, data.title)
    deck_id = save_content_deck(user_id, data.title, "mindmap", content)
    return {"deck_id": deck_id, "type": "mindmap", "content": content}

@router.get("/decks")
def get_decks(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title, type, created_at FROM decks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [{"id": r[0], "title": r[1], "type": r[2] or "flashcards", "created_at": str(r[3])} for r in rows]

@router.get("/decks/{deck_id}")
def get_deck(deck_id: int, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id, title, type, content FROM decks WHERE id = %s", (deck_id,))
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
            "flashcards": [{"id": c[0], "question": c[1], "answer": c[2]} for c in cards]
        }

    cur.close()
    conn.close()
    return {"title": deck[1], "type": deck_type, "content": deck[3]}

@router.get("/export")
def export_data(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user_id = get_user_id(token)
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

    cur.execute("DELETE FROM flashcards WHERE deck_id = %s", (deck_id,))
    cur.execute("DELETE FROM decks WHERE id = %s", (deck_id,))
    conn.commit()
    cur.close()
    conn.close()

    return {"message": "Deleted"}
