"""One-off schema migration.

The API does not run init_db() on startup — doing that on every serverless
cold start hangs the first request. So the schema has to be applied manually
whenever it changes:

    DATABASE_URL="postgresql://..." python migrate.py

Safe to run as many times as you like: every statement in init_db() is
CREATE TABLE IF NOT EXISTS or ADD COLUMN IF NOT EXISTS, and nothing is
dropped. Existing rows are kept.
"""
import os
import sys

from database import get_connection, init_db

EXPECTED = {
    "users": ["id", "email", "password", "is_pro", "tier", "api_key", "created_at"],
    "folders": ["id", "user_id", "name", "created_at"],
    "decks": ["id", "user_id", "title", "type", "content", "folder_id", "share_token", "created_at"],
    "flashcards": ["id", "deck_id", "question", "answer"],
    "card_progress": ["id", "user_id", "card_id", "deck_id", "ease", "interval_days", "reps", "due"],
    "review_log": ["id", "user_id", "card_id", "deck_id", "quality", "reviewed_at"],
}


def snapshot():
    """Return {table: {columns}} for the public schema."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT table_name, column_name FROM information_schema.columns "
        "WHERE table_schema = 'public'"
    )
    found = {}
    for table, column in cur.fetchall():
        found.setdefault(table, set()).add(column)
    cur.close()
    conn.close()
    return found


def diff(before, after):
    lines = []
    for table in sorted(EXPECTED):
        was, now = before.get(table, set()), after.get(table, set())
        if not was and now:
            lines.append(f"  + table {table}")
        else:
            for column in sorted(now - was):
                lines.append(f"  + {table}.{column}")
    return lines


def main():
    if not os.getenv("DATABASE_URL"):
        sys.exit("DATABASE_URL is not set — point it at the database you want to migrate.")

    before = snapshot()
    print(f"Found {len(before)} tables before migrating.")

    init_db()

    after = snapshot()
    changes = diff(before, after)
    if changes:
        print("Applied:")
        print("\n".join(changes))
    else:
        print("Nothing to apply — schema was already up to date.")

    missing = []
    for table, columns in EXPECTED.items():
        have = after.get(table)
        if have is None:
            missing.append(f"table {table}")
            continue
        missing += [f"{table}.{c}" for c in columns if c not in have]

    if missing:
        print("\nStill missing: " + ", ".join(missing))
        sys.exit(1)

    print("\nSchema verified — every table and column the API needs is present.")


if __name__ == "__main__":
    main()
