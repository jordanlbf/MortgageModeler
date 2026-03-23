"""
Tests for API health.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestHealthCheck:
    def test_health_returns_200(self):
        res = client.get("/health")
        assert res.status_code == 200

    def test_health_has_status_ok(self):
        data = client.get("/health").json()
        assert data["status"] == "ok"

    def test_health_has_environment(self):
        data = client.get("/health").json()
        assert "environment" in data

    def test_health_has_version(self):
        data = client.get("/health").json()
        assert "version" in data

    def test_health_has_debug(self):
        data = client.get("/health").json()
        assert "debug" in data
