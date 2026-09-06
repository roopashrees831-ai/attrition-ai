import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,

  headers: {
    'Content-Type': 'application/json',
  },
});


// ============================================================
// ATTACH JWT TOKEN TO EVERY REQUEST
// ============================================================

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem(
      'attrition_token'
    );

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`;
  }

  return config;
});


// ============================================================
// AUTH API
// ============================================================

export const authApi = {

  // ----------------------------------------------------------
  // COMPANY NAME + PASSWORD LOGIN
  // ----------------------------------------------------------

  login: async (
    company_name: string,
    password: string
  ) => {

    const response =
      await api.post(
        '/auth/login',
        {
          company_name,
          password
        }
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // DEMO LOGIN
  // Kept only for compatibility.
  // Backend currently blocks one-click access.
  // ----------------------------------------------------------

  demoLogin: async (
    company_name: string
  ) => {

    const response =
      await api.post(
        '/auth/demo-login',
        {
          company_name
        }
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // CURRENT LOGGED-IN USER
  // ----------------------------------------------------------

  getMe: async () => {

    const response =
      await api.get(
        '/auth/me'
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // COMPANY LIST FOR LOGIN DROPDOWN
  // ----------------------------------------------------------

  getDemoCompanies: async () => {

    const response =
      await api.get(
        '/auth/companies'
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // CHANGE COMPANY PASSWORD
  // ----------------------------------------------------------

  changePassword: async (
    current_password: string,
    new_password: string
  ) => {

    const response =
      await api.post(
        '/auth/change-password',
        {
          current_password,
          new_password
        }
      );

    return response.data;
  },

};


// ============================================================
// PREDICTIONS API
// ============================================================

export const predictionsApi = {

  // ----------------------------------------------------------
  // DASHBOARD SUMMARY
  // ----------------------------------------------------------

  getDashboardSummary: async () => {

    const response =
      await api.get(
        '/predictions/dashboard'
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // EMPLOYEE LIST
  // ----------------------------------------------------------

  getEmployees: async (
    params?: {
      risk_level?: string;
      department?: string;
      search?: string;
    }
  ) => {

    const response =
      await api.get(
        '/predictions/employees',
        {
          params
        }
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // ONE EMPLOYEE DETAILS
  // ----------------------------------------------------------

  getEmployeeDetail: async (
    id: number
  ) => {

    const response =
      await api.get(
        `/predictions/employees/${id}`
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // EXISTING INSIGHTS ENDPOINT
  // ----------------------------------------------------------

  getInsights: async () => {

    const response =
      await api.get(
        '/predictions/insights'
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // SINGLE PREDICTION
  // Used for explanation and What-if scenarios.
  // ----------------------------------------------------------

  predictSingle: async (
    employee_input: Record<string, any>
  ) => {

    const response =
      await api.post(
        '/predictions/predict-single',
        employee_input
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // EXPORT REPORT
  // ----------------------------------------------------------

  exportReportUrl: () =>
    `${API_BASE}/predictions/export/report`,

};


// ============================================================
// DATASETS API
// ============================================================

export const datasetsApi = {

  // ----------------------------------------------------------
  // UPLOAD DATASET
  // ----------------------------------------------------------

  upload: async (
    file: File
  ) => {

    const formData =
      new FormData();

    formData.append(
      'file',
      file
    );

    const response =
      await api.post(
        '/datasets/upload',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // MAP DATASET COLUMNS
  // ----------------------------------------------------------

  mapColumns: async (
    dataset_id: number,
    target_column: string,
    column_mapping:
      Record<string, string>
  ) => {

    const response =
      await api.post(
        '/datasets/map-columns',
        {
          dataset_id,
          target_column,
          column_mapping
        }
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // ACTIVE DATASET
  // ----------------------------------------------------------

  getActive: async () => {

    const response =
      await api.get(
        '/datasets/active'
      );

    return response.data;
  },

};


// ============================================================
// MODELS API
// ============================================================

export const modelsApi = {

  // ----------------------------------------------------------
  // TRAIN MODEL
  // ----------------------------------------------------------

  train: async (
    dataset_id: number
  ) => {

    const response =
      await api.post(
        '/models/train',
        {
          dataset_id
        }
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // MODEL METRICS
  // ----------------------------------------------------------

  getMetrics: async () => {

    const response =
      await api.get(
        '/models/metrics'
      );

    return response.data;
  },


  // ----------------------------------------------------------
  // PIPELINE INFORMATION
  // ----------------------------------------------------------

  getPipelineInfo: async () => {

    const response =
      await api.get(
        '/models/pipeline-info'
      );

    return response.data;
  },

};


// ============================================================
// COMPANY SETTINGS API
// ============================================================

export const companyApi = {

  getCurrent: async () => {

    const response =
      await api.get(
        '/companies/current'
      );

    return response.data;
  },

};