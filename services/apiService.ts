/**
 * Backend API Integration Service
 * This service connects the frontend to the Django REST Framework backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://konsiliumapi.cdcgroup.uz/api';

// Token management
const getTokens = () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return { access, refresh };
};

const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
};

const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

// API request helper
const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<any> => {
    const { access } = getTokens();
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (access) {
        headers['Authorization'] = `Bearer ${access}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
    
    if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry the request with new token
            return apiRequest(endpoint, options);
        } else {
            clearTokens();
            throw new Error('Session expired. Please login again.');
        }
    }
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.detail || 'API request failed');
    }
    
    return response.json();
};

// Refresh access token
const refreshAccessToken = async (): Promise<boolean> => {
    const { refresh } = getTokens();
    if (!refresh) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        
        if (response.ok) {
            const data = await response.json();
            setTokens(data.access, refresh);
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

// Authentication endpoints
export const apiAuth = {
    async register(phone: string, name: string, password: string) {
        const response = await apiRequest('/auth/register/', {
            method: 'POST',
            body: JSON.stringify({
                phone,
                name,
                password,
                password_confirm: password,
            }),
        });
        
        if (response.tokens) {
            setTokens(response.tokens.access, response.tokens.refresh);
        }
        
        return response.user;
    },
    
    async login(phone: string, password: string) {
        const response = await apiRequest('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
        
        if (response.tokens) {
            setTokens(response.tokens.access, response.tokens.refresh);
        }
        
        return response.user;
    },
    
    async logout() {
        const { refresh } = getTokens();
        try {
            await apiRequest('/auth/logout/', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refresh }),
            });
        } finally {
            clearTokens();
        }
    },
    
    async getProfile() {
        return apiRequest('/auth/profile/');
    },
    
    async updateProfile(data: any) {
        return apiRequest('/auth/profile/update/', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// Analysis endpoints
export const apiAnalyses = {
    async list() {
        return apiRequest('/analyses/');
    },
    
    async create(analysisData: any) {
        return apiRequest('/analyses/', {
            method: 'POST',
            body: JSON.stringify(analysisData),
        });
    },
    
    async get(id: string) {
        return apiRequest(`/analyses/${id}/`);
    },
    
    async update(id: string, data: any) {
        return apiRequest(`/analyses/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    async delete(id: string) {
        return apiRequest(`/analyses/${id}/`, { method: 'DELETE' });
    },
    
    async complete(id: string) {
        return apiRequest(`/analyses/${id}/complete/`, { method: 'POST' });
    },
    
    async getDashboardStats() {
        return apiRequest('/analyses/dashboard-stats/');
    },
    
    async getRecent() {
        return apiRequest('/analyses/recent/');
    },
};

// AI Service endpoints
export const apiAI = {
    async generateClarifyingQuestions(patientData: any, language: string = 'en') {
        return apiRequest('/ai/clarifying-questions/', {
            method: 'POST',
            body: JSON.stringify({ patient_data: patientData, language }),
        });
    },
    
    async recommendSpecialists(patientData: any, language: string = 'en') {
        return apiRequest('/ai/recommend-specialists/', {
            method: 'POST',
            body: JSON.stringify({ patient_data: patientData, language }),
        });
    },
    
    async generateInitialDiagnoses(patientData: any, language: string = 'en') {
        return apiRequest('/ai/initial-diagnoses/', {
            method: 'POST',
            body: JSON.stringify({ patient_data: patientData, language }),
        });
    },
    
    async generateFinalReport(
        patientData: any,
        debateHistory: any[],
        diagnoses: any[],
        language: string = 'en'
    ) {
        return apiRequest('/ai/final-report/', {
            method: 'POST',
            body: JSON.stringify({
                patient_data: patientData,
                debate_history: debateHistory,
                diagnoses,
                language,
            }),
        });
    },
    
    async checkDrugInteractions(medications: string[], language: string = 'en') {
        return apiRequest('/ai/drug-interactions/', {
            method: 'POST',
            body: JSON.stringify({ medications, language }),
        });
    },
    
    async suggestCMETopics(analyses: any[], language: string = 'en') {
        return apiRequest('/ai/cme-topics/', {
            method: 'POST',
            body: JSON.stringify({ analyses, language }),
        });
    },
};

// Case Library endpoints
export const apiCaseLibrary = {
    async list() {
        return apiRequest('/analyses/case-library/');
    },
    
    async search(query: string) {
        return apiRequest(`/analyses/case-library/search/?q=${encodeURIComponent(query)}`);
    },
};

// CME Topics endpoints
export const apiCME = {
    async list() {
        return apiRequest('/analyses/cme-topics/');
    },
    
    async create(topic: string, relevance: string) {
        return apiRequest('/analyses/cme-topics/', {
            method: 'POST',
            body: JSON.stringify({ topic, relevance }),
        });
    },
    
    async complete(id: string) {
        return apiRequest(`/analyses/cme-topics/${id}/complete/`, { method: 'POST' });
    },
};

export default {
    auth: apiAuth,
    analyses: apiAnalyses,
    ai: apiAI,
    caseLibrary: apiCaseLibrary,
    cme: apiCME,
};
