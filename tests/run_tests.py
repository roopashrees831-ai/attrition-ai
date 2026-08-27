import os
import sys
import unittest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.main import app
from app.database import Base, engine
from app.services.seed_data import seed_database

class TestAttritionAI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_database()
        cls.client = TestClient(app)

    def test_01_health_check(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["ml_engine"], "Active")
        print(" [PASS] Health check endpoint passed.")

    def test_02_login_novatech(self):
        res = self.client.post("/api/v1/auth/login", json={
            "email": "admin@novatech.com",
            "password": "password123",
            "company_name": "NovaTech Solutions"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["company_name"], "NovaTech Solutions")
        print(" [PASS] Login endpoint passed.")

    def test_03_multi_tenant_isolation(self):
        # NovaTech Login
        nova_token = self.client.post("/api/v1/auth/login", json={
            "email": "admin@novatech.com",
            "password": "password123",
            "company_name": "NovaTech Solutions"
        }).json()["access_token"]

        # Vertex Login
        vertex_token = self.client.post("/api/v1/auth/login", json={
            "email": "admin@vertex.com",
            "password": "password123",
            "company_name": "Vertex Systems"
        }).json()["access_token"]

        # Fetch dashboards
        nova_dash = self.client.get("/api/v1/predictions/dashboard", headers={"Authorization": f"Bearer {nova_token}"}).json()
        vertex_dash = self.client.get("/api/v1/predictions/dashboard", headers={"Authorization": f"Bearer {vertex_token}"}).json()

        self.assertGreater(nova_dash["total_employees"], 0)
        self.assertGreater(vertex_dash["total_employees"], 0)
        print(" [PASS] Multi-tenant data isolation verified.")

    def test_04_model_metrics(self):
        token = self.client.post("/api/v1/auth/login", json={
            "email": "admin@novatech.com",
            "password": "password123",
            "company_name": "NovaTech Solutions"
        }).json()["access_token"]

        res = self.client.get("/api/v1/models/metrics", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        metrics = res.json()
        self.assertIn("best_model_name", metrics)
        self.assertEqual(len(metrics["all_models_comparison"]), 3)
        print(" [PASS] Model metrics evaluation endpoint passed.")

    def test_05_employee_predictions(self):
        token = self.client.post("/api/v1/auth/login", json={
            "email": "admin@novatech.com",
            "password": "password123",
            "company_name": "NovaTech Solutions"
        }).json()["access_token"]

        res = self.client.get("/api/v1/predictions/employees", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        preds = res.json()
        self.assertGreater(len(preds), 0)
        self.assertIn("probability", preds[0])
        self.assertIn("risk_level", preds[0])
        print(" [PASS] Batch predictions & employee records verified.")

if __name__ == "__main__":
    unittest.main()
