import axios from 'axios';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attrition_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authApi = {
  login: async (email: string, password: string, company_name?: string) => {
    const response = await api.post('/auth/login', { email, password, company_name });
    return response.data;
  },
  demoLogin: async (company_name: string) => {
    const response = await api.post('/auth/demo-login', { company_name });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  getDemoCompanies: async () => {
    const response = await api.get('/auth/companies');
    return response.data;
  },
};

// Predictions & Dashboard API calls
export const predictionsApi = {
  getDashboardSummary: async () => {
    const response = await api.get('/predictions/dashboard');
    return response.data;
  },
  getEmployees: async (params?: { risk_level?: string; department?: string; search?: string }) => {
    const response = await api.get('/predictions/employees', { params });
    return response.data;
  },
  getEmployeeDetail: async (id: number) => {
    const response = await api.get(`/predictions/employees/${id}`);
    return response.data;
  },
  getInsights: async () => {
    const response = await api.get('/predictions/insights');
    return response.data;
  },
  predictSingle: async (employee_input: Record<string, any>) => {
    const response = await api.post('/predictions/predict-single', employee_input);
    return response.data;
  },
  exportReportUrl: () => `${API_BASE}/predictions/export/report`,
};

// Datasets API calls
export const datasetsApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  mapColumns: async (dataset_id: number, target_column: string, column_mapping: Record<string, string>) => {
    const response = await api.post('/datasets/map-columns', { dataset_id, target_column, column_mapping });
    return response.data;
  },
  getActive: async () => {
    const response = await api.get('/datasets/active');
    return response.data;
  },
};

// Models API calls
export const modelsApi = {
  train: async (dataset_id: number) => {
    const response = await api.post('/models/train', { dataset_id });
    return response.data;
  },
  getMetrics: async () => {
    const response = await api.get('/models/metrics');
    return response.data;
  },
};

// Company Settings API calls
export const companyApi = {
  getCurrent: async () => {
    const response = await api.get('/companies/current');
    return response.data;
  },
};
