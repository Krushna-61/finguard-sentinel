# FinGuard Sentinel

Production-grade AI Governance Platform for real-time inference monitoring, risk assessment, and compliance tracking.

## Features

### Core Capabilities
- **Real-time Inference Monitoring** - Track PII detection, toxicity, bias, drift, and hallucination
- **Risk Assessment Engine** - Composite risk scoring with dominance logic and explainability
- **Audit Logging** - Complete audit trail with database persistence
- **Hybrid Architecture** - Local models with HuggingFace API fallback
- **Production Ready** - Docker, CI/CD, monitoring, and security hardened

### Technical Stack
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **Frontend**: Next.js 14, React, TailwindCSS
- **ML/AI**: Transformers, PyTorch, Sentence-Transformers, spaCy
- **Infrastructure**: Docker, Docker Compose, Nginx, Gunicorn
- **Monitoring**: Prometheus, Grafana, AlertManager
- **CI/CD**: GitHub Actions, automated testing, security scanning

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum

### Installation

1. Clone repository:
```bash
git clone https://github.com/your-org/finguard-sentinel.git
cd finguard-sentinel
```

2. Create environment file:
```bash
cp finguard-backend/.env.example finguard-backend/.env
# Edit .env with your configuration
```

3. Start services:
```bash
make build
make up
```

4. Access services:
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Health Check: http://localhost:8000/api/system/health

## Architecture

### System Overview
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend    │────▶│  PostgreSQL │
│  (Next.js)  │     │  (FastAPI)   │     │  Database   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ├──▶ Local Models (GPU)
                           └──▶ HuggingFace API (Fallback)
```

### Key Components

**Backend Services**:
- `/api/test/inference` - Main inference pipeline
- `/api/governance/*` - Risk assessment and audit logs
- `/api/ml/*` - ML observability metrics
- `/api/llm/*` - LLM monitoring
- `/api/system/*` - Health checks and metrics

**Database Models**:
- `inference_records` - Inference history with risk scores
- `audit_events` - Complete audit trail
- `risk_thresholds` - Configurable risk weights
- `system_metrics` - Aggregated metrics
- `model_registry` - Loaded model tracking

## Configuration

### Environment Variables

**Backend** (`.env`):
```bash
# HuggingFace
HF_API_TOKEN=your_token_here

# Database
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db

# Security
FINGUARD_API_KEY=your_secure_key

# Runtime
ENV=production
LOG_LEVEL=INFO
USE_LOCAL_MODELS=false
```

### Risk Thresholds

Configure via database:
```sql
UPDATE risk_thresholds SET
  pii_weight = 0.40,
  toxicity_weight = 0.25,
  bias_weight = 0.25,
  drift_weight = 0.20,
  hallucination_weight = 0.20,
  latency_weight = 0.15,
  latency_threshold_ms = 800.0;
```

## API Usage

### Authentication
All endpoints require API key:
```bash
curl -H "X-API-KEY: your_api_key" \
     http://localhost:8000/api/test/inference \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"text": "Sample input text"}'
```

### Example Response
```json
{
  "input_text": "Sample input text",
  "inference_results": {
    "pii": {"detected": false, "entities_count": 0},
    "toxicity": {"score": 0.02},
    "embeddings": {"dimension": 384},
    "hallucination": {"score": 0.05}
  },
  "risk_assessment": {
    "composite_score": 15.5,
    "tier": "LOW",
    "breakdown": {
      "pii": 0.0,
      "toxicity": 2.0,
      "bias": 1.5,
      "drift": 3.0,
      "hallucination": 1.0,
      "latency": 0.0
    },
    "triggered_rules": []
  }
}
```

## Development

### Local Development

Backend:
```bash
cd finguard-backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd finguard-frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd finguard-backend
pytest tests/ -v --cov=app

# Frontend tests
cd finguard-frontend
npm test
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guide.

### Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.yml up -d

# With monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Kubernetes Deployment

```bash
kubectl apply -f k8s/
```

## Monitoring

### Metrics Endpoints
- `/metrics` - Prometheus metrics
- `/api/system/health` - Health check
- `/api/system/metrics` - System metrics

### Grafana Dashboards
Access Grafana at http://localhost:3001 (default: admin/admin)

Pre-configured dashboards:
- System Overview
- Inference Metrics
- Risk Assessment Trends
- Database Performance

### Alerts
Configured in `alerts.yml`:
- High error rate
- High latency
- Database down
- High memory/CPU usage
- Critical risk inferences

## Performance

See [PERFORMANCE.md](PERFORMANCE.md) for optimization guide.

### Performance Targets
- API Latency: < 500ms (p95)
- Throughput: > 100 req/sec per instance
- Error Rate: < 0.1%
- Database Queries: < 100ms (p95)

## Security

### Security Features
- API key authentication
- Rate limiting (100 req/min default)
- SQL injection prevention (SQLAlchemy ORM)
- CORS configuration
- Security headers (via nginx)
- Non-root container execution
- Secrets management

### Security Checklist
- [ ] Change default API key
- [ ] Use strong database password
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor audit logs

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Backend: Black, Flake8
- Frontend: ESLint, Prettier
- Commit messages: Conventional Commits

## Testing

### Test Coverage
- Unit tests: `tests/test_*.py`
- Integration tests: `tests/test_api.py`
- Database tests: `tests/test_database.py`
- Risk engine tests: `tests/test_risk_engine.py`

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [Performance Optimization](PERFORMANCE.md)
- [API Documentation](http://localhost:8000/docs)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- Issues: https://github.com/your-org/finguard-sentinel/issues
- Discussions: https://github.com/your-org/finguard-sentinel/discussions
- Email: support@finguard.com

## Acknowledgments

- HuggingFace for model hosting
- FastAPI for the web framework
- PostgreSQL for reliable data storage
- The open-source community

---

Built with ❤️ by the FinGuard Team
