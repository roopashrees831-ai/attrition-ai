# ATTRITION AI — Dark Lavender Multi-Company Demo

ATTRITION AI is a full-stack employee attrition prediction and workforce retention analytics project built with FastAPI, React, TypeScript and scikit-learn.

## What changed in this version

- Full **dark lavender + purple** visual theme across login, navigation, cards and charts.
- Login now starts with **three selectable company workspaces**.
- **IBM HR Analytics** — one-click demo access.
- **NovaTech Solutions** — one-click demo access with a separate IBM-schema-compatible synthetic dataset.
- **Lavender Systems** — secure demo company that requires **email + password**.
- Each company has a separate dataset, trained model records, predictions and dashboard data.
- The two added datasets follow the same employee-attrition field style so the same ML pipeline can train and compare all three tenants.

> Note: the NovaTech and Lavender datasets are synthetic demo datasets designed to be compatible with the IBM HR Analytics-style schema. They are not real company HR records.

## Included datasets

| Company | File | Rows | Access |
| --- | --- | ---: | --- |
| IBM HR Analytics | `ibm_hr_analytics_dataset.csv` | 240 | One-click demo |
| NovaTech Solutions | `novatech_ibm_schema_dataset.csv` | 240 | One-click demo |
| Lavender Systems | `lavender_systems_ibm_schema_dataset.csv` | 240 | Email + password |

The dataset fields include employee age, department, job role, job level, monthly income, job satisfaction, environment satisfaction, relationship satisfaction, work-life balance, overtime, tenure, promotion delay, commute distance, performance rating and attrition.

## Lavender Systems demo credentials

- **Email:** `hr@lavendersystems.com`
- **Password:** `Lavender@2026`

IBM and NovaTech do not require credentials; choose the company and click its demo button.

## Run on Windows

### 1. Backend

Open PowerShell in the `EAP/backend` folder:

```powershell
pip install -r requirements.txt
python -m app.main
```

On the first run, the application creates the three-company SQLite database, trains the ML models and stores employee predictions.

### 2. Frontend development mode

Open a second PowerShell window in `EAP/frontend`:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

### 3. Build frontend for the unified FastAPI server

From `EAP/frontend`:

```powershell
npm install
npm run build
```

Then start the backend from `EAP/backend`:

```powershell
python -m app.main
```

The backend can then serve the built frontend from `frontend/dist`.

## Main technology stack

- FastAPI + SQLAlchemy + SQLite
- scikit-learn: Logistic Regression, Random Forest and Gradient Boosting
- JWT authentication
- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts + Lucide icons

## Login behavior

1. User opens the login page.
2. User selects IBM, NovaTech or Lavender Systems.
3. IBM/NovaTech immediately use the protected demo-login API.
4. Lavender Systems reveals email and password inputs.
5. The backend returns a company-specific JWT token.
6. All dashboards, datasets, model metrics and employee predictions are filtered by that company ID.
