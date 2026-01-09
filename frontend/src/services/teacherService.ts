import apiClient from './api';
import { Teacher, TeacherAvailability } from '@/types';

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

export interface TeacherCreate {
  user_id?: number;
  email: string;
  username: string;
  full_name: string;
  password: string;
  employee_code: string;
  phone?: string;
  max_weekly_hours?: number;
  specialties?: string[];
}

export interface TeacherUpdate {
  employee_code?: string;
  phone?: string;
  max_weekly_hours?: number;
  specialties?: string[];
}

export const teacherService = {
  async getTeachers(params?: { skip?: number; limit?: number }): Promise<Teacher[]> {
    const response = await apiClient.get<Teacher[]>('/api/teachers', { params });
    return response.data;
  },

  async getTeacher(id: number): Promise<Teacher> {
    const response = await apiClient.get<Teacher>(`/api/teachers/${id}`);
    return response.data;
  },

  async createTeacher(teacherData: TeacherCreate): Promise<Teacher> {
    const upperCaseData = toUpperCaseFields(teacherData, ['username', 'full_name', 'employee_code', 'phone']);
    // Convertir specialties a mayúsculas si existe
    if (upperCaseData.specialties) {
      upperCaseData.specialties = upperCaseData.specialties.map((s: string) => s.toUpperCase());
    }
    const response = await apiClient.post<Teacher>('/api/teachers', upperCaseData);
    return response.data;
  },

  async updateTeacher(id: number, teacherData: TeacherUpdate): Promise<Teacher> {
    const upperCaseData = toUpperCaseFields(teacherData, ['employee_code', 'phone']);
    // Convertir specialties a mayúsculas si existe
    if (upperCaseData.specialties) {
      upperCaseData.specialties = upperCaseData.specialties.map((s: string) => s.toUpperCase());
    }
    const response = await apiClient.put<Teacher>(`/api/teachers/${id}`, upperCaseData);
    return response.data;
  },

  async deleteTeacher(id: number): Promise<void> {
    await apiClient.delete(`/api/teachers/${id}`);
  },

  async updateAvailability(teacherId: number, availabilities: TeacherAvailability[]): Promise<void> {
    await apiClient.put(`/api/teachers/${teacherId}/availability`, { availabilities });
  },
};
