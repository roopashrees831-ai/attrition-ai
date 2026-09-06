# Employee Attrition AI — Competition Upgrade Notes

This upgrade preserves the existing application structure, input fields, trained models, prediction thresholds, routes, dashboards, and recommendation outputs.

## Added
- Compact best-model Accuracy, Precision, Recall, F1 Score, and ROC-AUC display using stored model metrics only.
- Truthful preprocessing/optimization summary based on the implemented scikit-learn pipeline.
- Probability-based Low / Medium / High risk indicator using the existing thresholds (Low < 35%, Medium 35–64%, High >= 65%).
- Local "Why this prediction?" sensitivity explanation using the active model and fitted training reference values.
- General HR review areas with human-review and non-causality disclaimers.
- One lightweight 3D-style process-flow animation: Employee Data -> Data Processing -> AI/ML Model -> Prediction -> HR Insight.
- Compact How It Works flow in System Architecture.
- Responsible-AI wording that does not claim unimplemented cross-validation, SMOTE, feature selection, hyperparameter search, or protected-attribute exclusion.

## Important build step
The source code is updated. The uploaded project contains Windows-specific `node_modules`, so the Linux sandbox could type-check the React/TypeScript source but could not regenerate `frontend/dist` with those Windows-native Rollup/Esbuild binaries.

Before redeploying, rebuild the frontend on your normal Windows machine or in your deployment build environment:

```powershell
cd frontend
npm install
npm run build
```

Then start/deploy the FastAPI backend as before. No model retraining is required for these UI/explainability additions.
