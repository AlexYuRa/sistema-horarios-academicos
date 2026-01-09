import apiClient from './api';
import { LoginCredentials, AuthResponse, User } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    // Convertir username a mayúsculas
    formData.append('username', credentials.username.toUpperCase());
    formData.append('password', credentials.password);

    const response = await apiClient.post<AuthResponse>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }

    return response.data;
  },

  async register(userData: any): Promise<User> {
    // Convertir campos de texto a mayúsculas
    const upperCaseData = {
      ...userData,
      username: userData.username?.toUpperCase(),
      full_name: userData.full_name?.toUpperCase(),
    };
    const response = await apiClient.post<User>('/api/auth/register', upperCaseData);
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },
};
