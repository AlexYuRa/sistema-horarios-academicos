import apiClient from './api';
import { Classroom, ClassroomCreate } from '@/types';

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

export const classroomService = {
  async getClassrooms(params?: { skip?: number; limit?: number; classroom_type?: string }): Promise<Classroom[]> {
    const response = await apiClient.get<Classroom[]>('/api/classrooms', { params });
    return response.data;
  },

  async getClassroom(id: number): Promise<Classroom> {
    const response = await apiClient.get<Classroom>(`/api/classrooms/${id}`);
    return response.data;
  },

  async createClassroom(classroomData: ClassroomCreate): Promise<Classroom> {
    const upperCaseData = toUpperCaseFields(classroomData, ['code', 'name', 'building', 'equipment']);
    const response = await apiClient.post<Classroom>('/api/classrooms', upperCaseData);
    return response.data;
  },

  async updateClassroom(id: number, classroomData: Partial<ClassroomCreate>): Promise<Classroom> {
    const upperCaseData = toUpperCaseFields(classroomData, ['code', 'name', 'building', 'equipment']);
    const response = await apiClient.put<Classroom>(`/api/classrooms/${id}`, upperCaseData);
    return response.data;
  },

  async deleteClassroom(id: number): Promise<void> {
    await apiClient.delete(`/api/classrooms/${id}`);
  },
};
