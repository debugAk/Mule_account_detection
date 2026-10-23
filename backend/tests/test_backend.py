import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.services.ml_service import ml_service
from backend.app.services.rules_engine import rules_engine
from backend.app.models import AccountModel, TransactionModel, AlertModel, CaseModel, NoteModel, AuditModel

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ml_model"]["loaded"] is True
    assert "isolation-forest" in data["ml_model"]["version"]

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert data["metrics"]["totalTransactionsAnalyzed"] > 0
    assert data["metrics"]["alertsSummary"]["total"] > 0
    assert "riskDistribution" in data
    assert len(data["riskDistribution"]) == 4

def test_ml_inference_service():
    # Test feature extraction and prediction with realistic mule values
    res = ml_service.predict(
        pass_through_ratio=0.98,
        tx_count=250,
        total_credit_inr=15000000.0,
        end_balance=500.0,
        unique_counterparties=40,
    )
    assert "ml_anomaly_score" in res
    assert 0 <= res["ml_anomaly_score"] <= 100
    assert res["is_anomaly"] is True
    assert res["fallback_used"] is False
    assert len(res["features_used"]) == 5

def test_rules_engine_evaluation():
    rule_score, triggered_rules, signals = rules_engine.evaluate_account(
        pass_through_ratio=0.99,
        tx_count=60,
        total_credit_inr=12000000.0,
        end_balance=100.0,
        unique_counterparties=25,
    )
    assert rule_score >= 70
    assert len(triggered_rules) >= 3
    assert len(signals) == 3

    final_score, tier = rules_engine.calculate_composite_risk(
        rule_score=rule_score,
        ml_anomaly_score=90,
        pass_through_ratio=0.99,
        total_credit_inr=12000000.0,
    )
    assert final_score >= 80
    assert tier == "CRITICAL"

def test_csv_ingestion_valid_and_duplicate():
    import uuid
    uid = uuid.uuid4().hex[:6]
    tx1 = f"TXN-{uid}-001"
    tx2 = f"TXN-{uid}-002"
    sample_csv = (
        f"transaction_id,timestamp,source_account,destination_account,amount,currency,channel\n"
        f"{tx1},2026-10-22T14:00:00Z,ACC-TEST-1,ACC-TEST-2,500000.00,INR,UPI\n"
        f"{tx2},2026-10-22T14:15:00Z,ACC-TEST-2,BEN-OFFSHORE,495000.00,INR,IMPS\n"
    )

    response = client.post(
        "/api/ingest/csv",
        files={"file": ("test_tx.csv", sample_csv.encode("utf-8"), "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["accepted_rows"] == 2
    assert data["rejected_rows"] == 0

    # Test idempotency / duplicate detection on second upload
    dup_response = client.post(
        "/api/ingest/csv",
        files={"file": ("test_tx.csv", sample_csv.encode("utf-8"), "text/csv")},
    )
    assert dup_response.status_code == 200
    dup_data = dup_response.json()
    assert dup_data["accepted_rows"] == 0
    assert dup_data["duplicate_rows"] == 2

def test_csv_ingestion_malformed_records():
    malformed_csv = (
        "transaction_id,timestamp,source_account,destination_account,amount,currency,channel\n"
        "BAD-TX-001,invalid-date,ACC-TEST-1,ACC-TEST-2,50000.00,INR,UPI\n"
        "BAD-TX-002,2026-10-22T14:00:00Z,ACC-TEST-1,ACC-TEST-2,-500.00,INR,UPI\n"
        "BAD-TX-003,2026-10-22T14:00:00Z,,,500.00,INR,UPI\n"
    )

    response = client.post(
        "/api/ingest/csv",
        files={"file": ("malformed.csv", malformed_csv.encode("utf-8"), "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["accepted_rows"] == 0
    assert data["rejected_rows"] == 3
    assert len(data["errors"]) == 3

def test_cases_and_notes_persistence():
    cases_resp = client.get("/api/cases")
    assert cases_resp.status_code == 200
    cases = cases_resp.json()["items"]
    assert len(cases) > 0

    target_case_id = cases[0]["id"]

    # Add note
    note_resp = client.post(
        f"/api/cases/{target_case_id}/notes",
        json={"content": "Automated verification note from pytest", "tag": "Dispersal Analysis"},
    )
    assert note_resp.status_code == 200
    note_data = note_resp.json()
    assert note_data["content"] == "Automated verification note from pytest"

    # Verify retrieval
    detail_resp = client.get(f"/api/cases/{target_case_id}")
    assert detail_resp.status_code == 200
    notes = detail_resp.json()["notes"]
    assert any("Automated verification note from pytest" in n["content"] for n in notes)

def test_network_graph():
    graph_resp = client.get("/api/graph/network")
    assert graph_resp.status_code == 200
    g = graph_resp.json()
    assert "nodes" in g
    assert "edges" in g
    assert len(g["nodes"]) > 0
    assert len(g["edges"]) > 0
    assert "high_degree_accounts" in g

def test_rbac_authorization():
    # Regular investigator cannot access reviewer-restricted endpoints if role invalid
    resp = client.post(
        "/api/ingest/csv",
        files={"file": ("test.csv", b"a,b\n1,2", "text/csv")},
        headers={"X-User-Role": "unauthorized_role"},
    )
    assert resp.status_code == 403
