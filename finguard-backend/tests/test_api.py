"""API endpoint tests"""
import pytest
from fastapi import status


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "running"
        assert "version" in data
    
    def test_system_health(self, client, db_session):
        """Test system health endpoint"""
        response = client.get("/api/system/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "database_status" in data
        assert "model_status" in data


class TestGovernanceEndpoints:
    """Test governance endpoints"""
    
    def test_governance_health(self, client):
        """Test governance health check"""
        response = client.get("/api/governance/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_get_risk_empty(self, client, db_session):
        """Test risk endpoint with no data"""
        response = client.get("/api/governance/risk")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["composite_score"] == 0.0
        assert data["tier"] == "LOW"
    
    def test_get_audit_logs(self, client, db_session):
        """Test audit logs endpoint"""
        response = client.get("/api/governance/audit-logs")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "entries" in data
        assert "total_count" in data
        assert isinstance(data["entries"], list)


class TestMLEndpoints:
    """Test ML observability endpoints"""
    
    def test_ml_health(self, client):
        """Test ML health check"""
        response = client.get("/api/ml/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_ml_observability(self, client, db_session):
        """Test ML observability endpoint"""
        response = client.get("/api/ml/observability")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "metrics" in data
        assert "drift" in data
        assert "bias" in data


class TestLLMEndpoints:
    """Test LLM monitoring endpoints"""
    
    def test_llm_health(self, client):
        """Test LLM health check"""
        response = client.get("/api/llm/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_llm_metrics(self, client, db_session):
        """Test LLM metrics endpoint"""
        response = client.get("/api/llm/metrics")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "latency" in data
        assert "token_usage" in data
        assert "hallucination_score" in data


class TestMetricsEndpoint:
    """Test metrics endpoint"""
    
    def test_metrics_endpoint(self, client):
        """Test Prometheus metrics endpoint"""
        response = client.get("/metrics")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_requests" in data
        assert "total_errors" in data
        assert "avg_duration_seconds" in data
