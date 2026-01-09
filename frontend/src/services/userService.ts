import apiClient from './api';
import { User, UserRole } from '@/types';

// Función auxiliar para convertir campos de texto a mayúsculas
const toUpperCaseFields = <T extends Record<string, any>>(data: T, fields: string[]): T => {
  const result = { ...data };
  fields.forEach((field) => {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = result[field].toUpperCase();
    }
  });
  return result;
};

export interface UserCreate {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
  password?: string;
}

export const userService = {
  async getUsers(params?: { skip?: number; limit?: number; role?: string }): Promise<User[]> {
    const response = await apiClient.get<User[]>('/api/users', { params });
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },

  async createUser(userData: UserCreate): Promise<User> {
    const upperCaseData = toUpperCaseFields(userData, ['username', 'full_name']);
    const response = await apiClient.post<User>('/api/users', upperCaseData);
    return response.data;
  },

  async updateUser(id: number, userData: UserUpdate): Promise<User> {
    const upperCaseData = toUpperCaseFields(userData, ['full_name']);
    const response = await apiClient.put<User>(`/api/users/${id}`, upperCaseData);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/api/users/${id}`);
  },
};
