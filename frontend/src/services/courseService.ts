import apiClient from './api';
import { Course, CourseCreate } from '@/types';

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

export const courseService = {
  async getCourses(params?: { skip?: number; limit?: number; cycle?: number }): Promise<Course[]> {
    const response = await apiClient.get<Course[]>('/api/courses', { params });
    return response.data;
  },

  async getCourse(id: number): Promise<Course> {
    const response = await apiClient.get<Course>(`/api/courses/${id}`);
    return response.data;
  },

  async createCourse(courseData: CourseCreate): Promise<Course> {
    const upperCaseData = toUpperCaseFields(courseData, ['code', 'name']);
    const response = await apiClient.post<Course>('/api/courses', upperCaseData);
    return response.data;
  },

  async updateCourse(id: number, courseData: Partial<CourseCreate>): Promise<Course> {
    const upperCaseData = toUpperCaseFields(courseData, ['code', 'name']);
    const response = await apiClient.put<Course>(`/api/courses/${id}`, upperCaseData);
    return response.data;
  },

  async deleteCourse(id: number): Promise<void> {
    await apiClient.delete(`/api/courses/${id}`);
  },

  async teacherSelfAssign(courseId: number, assign: boolean): Promise<Course> {
    const response = await apiClient.post<Course>(`/api/courses/${courseId}/assign-self?assign=${assign}`);
    return response.data;
  },
};
