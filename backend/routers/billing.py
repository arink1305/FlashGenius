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
PRO_AMOUNT = 4900
PRO_CURRENCY = "nok"

class ConfirmIn(BaseModel):
    session_id: str

def get_stripe():
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Stripe is not configured")
    stripe.api_key = key
    return stripe

@router.post("/checkout")
def create_checkout(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    client = get_stripe()
    session = client.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": PRO_CURRENCY,
                "product_data": {"name": "FlashGenius Pro", "description": "Ubegrenset antall sett"},
                "unit_amount": PRO_AMOUNT,
            },
            "quantity": 1,
        }],
        success_url=f"{FRONTEND_URL}/settings?upgrade=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/settings?upgrade=cancelled",
        metadata={"user_id": str(user_id)},
    )
    return {"url": session.url}

@router.post("/confirm")
def confirm(data: ConfirmIn, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    client = get_stripe()
    session = client.checkout.Session.retrieve(data.session_id)
    paid = session.get("payment_status") == "paid"
    owner = str(session.get("metadata", {}).get("user_id")) == str(user_id)
    if paid and owner:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_pro = TRUE WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"is_pro": True}
    return {"is_pro": False}
