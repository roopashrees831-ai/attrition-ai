import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine
from app.services.seed_data import seed_database

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["ml_engine"] == "Active"


def test_three_login_companies_are_exposed():
    response = client.get("/api/v1/auth/companies")
    assert response.status_code == 200
    companies = response.json()
    assert [c["company_name"] for c in companies] == [
        "IBM HR Analytics",
        "NovaTech Solutions",
        "Lavender Systems",
    ]
    assert companies[0]["requires_credentials"] is False
    assert companies[1]["requires_credentials"] is False
    assert companies[2]["requires_credentials"] is True


def test_ibm_one_click_demo_login():
    response = client.post("/api/v1/auth/demo-login", json={"company_name": "IBM HR Analytics"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["company_name"] == "IBM HR Analytics"


def test_novatech_one_click_demo_login():
    response = client.post("/api/v1/auth/demo-login", json={"company_name": "NovaTech Solutions"})
    assert response.status_code == 200
    assert response.json()["user"]["company_name"] == "NovaTech Solutions"


def test_lavender_requires_credentials():
    demo_response = client.post("/api/v1/auth/demo-login", json={"company_name": "Lavender Systems"})
    assert demo_response.status_code == 403

    login_response = client.post("/api/v1/auth/login", json={
        "email": "hr@lavendersystems.com",
        "password": "Lavender@2026",
        "company_name": "Lavender Systems",
    })
    assert login_response.status_code == 200
    assert login_response.json()["user"]["company_name"] == "Lavender Systems"


def test_company_data_isolation_and_dashboard():
    ibm_token = client.post(
        "/api/v1/auth/demo-login", json={"company_name": "IBM HR Analytics"}
    ).json()["access_token"]
    nova_token = client.post(
        "/api/v1/auth/demo-login", json={"company_name": "NovaTech Solutions"}
    ).json()["access_token"]

    ibm_dash = client.get(
        "/api/v1/predictions/dashboard",
        headers={"Authorization": f"Bearer {ibm_token}"},
    ).json()
    nova_dash = client.get(
        "/api/v1/predictions/dashboard",
        headers={"Authorization": f"Bearer {nova_token}"},
    ).json()

    assert ibm_dash["total_employees"] == 240
    assert nova_dash["total_employees"] == 240
    assert ibm_dash["risk_distribution"] != nova_dash["risk_distribution"] or ibm_dash["attrition_rate"] != nova_dash["attrition_rate"]


def test_model_metrics_endpoint():
    token = client.post(
        "/api/v1/auth/demo-login", json={"company_name": "IBM HR Analytics"}
    ).json()["access_token"]
    response = client.get(
        "/api/v1/models/metrics",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    metrics = response.json()
    assert "best_model_name" in metrics
    assert len(metrics["all_models_comparison"]) == 3


def test_employee_predictions_endpoint():
    token = client.post(
        "/api/v1/auth/demo-login", json={"company_name": "NovaTech Solutions"}
    ).json()["access_token"]
    response = client.get(
        "/api/v1/predictions/employees",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    employees = response.json()
    assert len(employees) > 0
    assert "probability" in employees[0]
    assert "risk_level" in employees[0]
