import os
import stripe
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv
from database import get_connection
from routers.auth import get_user_id

load_dotenv()

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CURRENCY = "nok"

PLANS = {
    "plus": {"amount": 4900, "name": "FlashGenius Plus", "description": "Ubegrenset sett, tankekart, PDF-opplasting og eksport"},
    "pro": {"amount": 9900, "name": "FlashGenius Pro", "description": "Alt i Plus + smart repetisjon, statistikk og kraftigere AI"},
    "ultra": {"amount": 14900, "name": "FlashGenius Ultra", "description": "Alt i Pro + delbare sett og API-tilgang"},
}

TIER_ORDER = {"free": 0, "plus": 1, "pro": 2, "ultra": 3}

class CheckoutIn(BaseModel):
    tier: str = "plus"

class ConfirmIn(BaseModel):
    session_id: str

def get_stripe():
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    stripe.api_key = key
    return stripe

def get_current_tier(user_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT tier FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return (row[0] or "free") if row else "free"

@router.post("/checkout")
def create_checkout(data: CheckoutIn, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    plan = PLANS.get(data.tier)
    if not plan:
        raise HTTPException(status_code=400, detail="Unknown tier")
    current = get_current_tier(user_id)
    if TIER_ORDER.get(current, 0) >= TIER_ORDER[data.tier]:
        raise HTTPException(status_code=400, detail="already_on_tier")
    credit = PLANS[current]["amount"] if current in PLANS else 0
    amount = plan["amount"] - credit
    client = get_stripe()
    session = client.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": CURRENCY,
                "product_data": {"name": plan["name"], "description": plan["description"]},
                "unit_amount": amount,
            },
            "quantity": 1,
        }],
        success_url=f"{FRONTEND_URL}/settings?upgrade=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/pricing?upgrade=cancelled",
        metadata={"user_id": str(user_id), "tier": data.tier},
    )
    return {"url": session.url}

@router.post("/confirm")
def confirm(data: ConfirmIn, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    client = get_stripe()
    try:
        session = client.checkout.Session.retrieve(data.session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session")
    paid = session.payment_status == "paid"
    meta = session.metadata.to_dict() if session.metadata else {}
    owner = str(meta.get("user_id")) == str(user_id)
    tier = meta.get("tier", "plus")
    if tier not in PLANS:
        tier = "plus"
    print(f"BILLING CONFIRM user={user_id} paid={paid} owner={owner} tier={tier}")
    if not (paid and owner):
        return {"tier": None, "confirmed": False}

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT tier FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    current = (row[0] or "free") if row else "free"
    if TIER_ORDER.get(tier, 0) > TIER_ORDER.get(current, 0):
        cur.execute("UPDATE users SET tier = %s, is_pro = TRUE WHERE id = %s", (tier, user_id))
        conn.commit()
        current = tier
    cur.close()
    conn.close()
    return {"tier": current, "confirmed": True}
