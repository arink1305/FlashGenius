import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_pro BOOLEAN DEFAULT FALSE,
            tier TEXT DEFAULT 'free',
            api_key TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free'")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key TEXT")
    cur.execute("UPDATE users SET tier = 'plus' WHERE is_pro = TRUE AND (tier IS NULL OR tier = 'free')")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS folders (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS decks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            title TEXT NOT NULL,
            type TEXT DEFAULT 'flashcards',
            content JSONB,
            folder_id INTEGER REFERENCES folders(id),
            share_token TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    cur.execute("ALTER TABLE decks ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'flashcards'")
    cur.execute("ALTER TABLE decks ADD COLUMN IF NOT EXISTS content JSONB")
    cur.execute("ALTER TABLE decks ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES folders(id)")
    cur.execute("ALTER TABLE decks ADD COLUMN IF NOT EXISTS share_token TEXT")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS flashcards (
            id SERIAL PRIMARY KEY,
            deck_id INTEGER REFERENCES decks(id),
            question TEXT NOT NULL,
            answer TEXT NOT NULL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS card_progress (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            card_id INTEGER REFERENCES flashcards(id),
            deck_id INTEGER REFERENCES decks(id),
            ease REAL DEFAULT 2.5,
            interval_days REAL DEFAULT 0,
            reps INTEGER DEFAULT 0,
            due TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, card_id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS review_log (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            card_id INTEGER,
            deck_id INTEGER,
            quality INTEGER,
            reviewed_at TIMESTAMP DEFAULT NOW()
        )
    """)
    conn.commit()
    cur.close()
    conn.close()
