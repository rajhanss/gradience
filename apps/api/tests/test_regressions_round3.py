from unittest.mock import MagicMock, AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from gradience_api.main import create_app

def test_historical_trends_returns_404_for_unsupported_city() -> None:
    """Task 2.1: London coordinates far from pilot cities must return HTTP 404, not fabricated data."""
    client = TestClient(create_app())
    response = client.get("/v1/historical-trends?latitude=51.5072&longitude=-0.1276")
    assert response.status_code == 404
    assert "supported pilot cities" in response.json()["detail"]

def test_historical_trends_response_has_provenance() -> None:
    """Task 2.2: Supported pilot city historical trends response must include provenance='modeled' and provenance_note."""
    client = TestClient(create_app())
    response = client.get("/v1/historical-trends?latitude=33.4484&longitude=-112.0740")
    assert response.status_code == 200
    body = response.json()
    assert body["city"] == "Phoenix"
    assert body["provenance"] == "modeled"
    assert "provenance_note" in body
    assert len(body["provenance_note"]) > 0

def test_cors_rejects_wildcard_with_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    """Task 2.3: Unset GRADIENCE_CORS_ORIGINS must use wildcard origin without allow_credentials=True."""
    monkeypatch.delenv("GRADIENCE_CORS_ORIGINS", raising=False)
    app = create_app()
    
    # Inspect middleware kwargs directly
    cors_middleware = next(
        m for m in app.user_middleware if m.cls.__name__ == "CORSMiddleware"
    )
    assert cors_middleware.kwargs["allow_origins"] == ["*"]
    assert cors_middleware.kwargs["allow_credentials"] is False

    # Also verify via HTTP OPTIONS request
    client = TestClient(app)
    response = client.options(
        "/health",
        headers={
            "origin": "https://random.example.com",
            "access-control-request-method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-credentials") is None

def test_chatbot_source_type_matches_path(monkeypatch: pytest.MonkeyPatch) -> None:
    """Task 2.4: Chatbot response source_type must accurately distinguish response paths."""
    client = TestClient(create_app())

    # Path 1: Named city reference briefing
    res_city = client.post(
        "/v1/chatbot/respond",
        json={"workflow": "observe", "message": "What is the hottest zone in Phoenix?"},
    )
    assert res_city.status_code == 200
    assert res_city.json()["source_type"] == "reference_briefing"

    # Path 2: Generic query with no Groq key configured -> general_reference
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    res_gen = client.post(
        "/v1/chatbot/respond",
        json={"workflow": "simulate", "message": "How do I reduce heat in a development?"},
    )
    assert res_gen.status_code == 200
    assert res_gen.json()["source_type"] == "general_reference"

    # Path 3: Mocked Groq LLM API response -> ai_groq
    monkeypatch.setenv("GROQ_API_KEY", "mock-groq-key")
    mock_httpx_resp = MagicMock()
    mock_httpx_resp.status_code = 200
    mock_httpx_resp.json.return_value = {
        "choices": [{"message": {"content": "Groq LLM heat mitigation analysis"}}]
    }

    mock_client_instance = AsyncMock()
    mock_client_instance.post.return_value = mock_httpx_resp
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None

    with patch("httpx.AsyncClient", return_value=mock_client_instance):
        res_groq = client.post(
            "/v1/chatbot/respond",
            json={"workflow": "observe", "message": "Explain urban heat island dynamics"},
        )
        assert res_groq.status_code == 200
        assert res_groq.json()["source_type"] == "ai_groq"
        assert "Groq LLM heat mitigation analysis" in res_groq.json()["response"]
