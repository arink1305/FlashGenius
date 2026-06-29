from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError
import bcrypt
import os
from dotenv import load_dotenv
from database import get_connection

load_dotenv()

router = APIRouter()
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")

class UserIn(BaseModel):
    email: str
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def get_user_id(authorization: str) -> int:
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register")
def register(user: UserIn):
    conn = get_connection()
    cur = conn.cursor()
    hashed = hash_password(user.password)
    try:
        cur.execute("INSERT INTO users (email, password) VALUES (%s, %s) RETURNING id", (user.email, hashed))
        user_id = cur.fetchone()[0]
        conn.commit()
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        cur.close()
        conn.close()
    token = jwt.encode({"sub": str(user_id), "email": user.email}, SECRET_KEY, algorithm="HS256")
    return {"token": token}

@router.post("/login")
def login(user: UserIn):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, password FROM users WHERE email = %s", (user.email,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row or not verify_password(user.password, row[1]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"sub": str(row[0]), "email": user.email}, SECRET_KEY, algorithm="HS256")
    return {"token": token}

@router.get("/me")
def me(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT email, is_pro FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": row[0], "is_pro": bool(row[1])}

@router.put("/password")
def change_password(data: PasswordChange, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT password FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or not verify_password(data.current_password, row[0]):
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Feil nåværende passord")
    cur.execute("UPDATE users SET password = %s WHERE id = %s", (hash_password(data.new_password), user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Passord oppdatert"}

@router.delete("/account")
def delete_account(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM decks WHERE user_id = %s", (user_id,))
    deck_ids = [r[0] for r in cur.fetchall()]
    for did in deck_ids:
        cur.execute("DELETE FROM flashcards WHERE deck_id = %s", (did,))
    cur.execute("DELETE FROM decks WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Konto slettet"}
