import pytest

from app.services.groq_service import parse_json
from conftest import login, auth_headers
import app.api.routes.symptom as symptom_mod


def test_parse_json_strips_fences():
    assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}


def test_parse_json_strips_prose():
    assert parse_json('Here is the result:\n{"a": 1}\nThanks!') == {"a": 1}


def test_parse_json_nested():
    assert parse_json('{"nested": {"list": [1, 2]}}') == {"nested": {"list": [1, 2]}}


def test_parse_json_garbage_raises():
    with pytest.raises(ValueError):
        parse_json("no json here")


def test_parse_json_malformed_raises():
    with pytest.raises(ValueError):
        parse_json("{invalid")


def test_symptom_route_returns_502_on_groq_failure(client, seeded_users, monkeypatch):
    token = login(client, "patient@test.dev", "strongpass1")

    def boom(*args, **kwargs):
        raise RuntimeError("groq down")

    # Patch the route's imported name (module-level from-import).
    monkeypatch.setattr(symptom_mod, "ask_groq_json", boom)

    res = client.post(
        "/symptom/check",
        json={"symptoms": "fever headache"},
        headers=auth_headers(token),
    )
    assert res.status_code == 502
    assert res.headers.get("x-medai-code") == "AI_UNAVAILABLE"
