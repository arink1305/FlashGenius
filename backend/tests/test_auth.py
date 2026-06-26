import pytest
from fastapi import HTTPException
from jose import jwt

from routers.auth import hash_password, verify_password, get_user_id, SECRET_KEY


def test_hash_is_not_plaintext():
    hashed = hash_password("hemmelig123")
    assert hashed != "hemmelig123"
    assert len(hashed) > 20


def test_hash_is_salted():
    assert hash_password("samme") != hash_password("samme")


def test_verify_correct_password():
    hashed = hash_password("riktig")
    assert verify_password("riktig", hashed) is True


def test_verify_wrong_password():
    hashed = hash_password("riktig")
    assert verify_password("feil", hashed) is False


def test_get_user_id_valid_token():
    token = jwt.encode({"sub": "42"}, SECRET_KEY, algorithm="HS256")
    assert get_user_id("Bearer " + token) == 42


def test_get_user_id_invalid_token_raises():
    with pytest.raises(HTTPException) as exc:
        get_user_id("Bearer not-a-real-token")
    assert exc.value.status_code == 401
