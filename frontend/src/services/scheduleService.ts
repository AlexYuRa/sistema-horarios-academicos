import apiClient from './api';
import { Schedule, ScheduleGenerateRequest, ScheduleGenerateResponse, ScheduleSlot } from '@/types';

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

export const scheduleService = {
  async getSchedules(params?: {
    skip?: number;
    limit?: number;
    semester?: string;
    status_filter?: string;
  }): Promise<Schedule[]> {
    const response = await apiClient.get<Schedule[]>('/api/schedules', { params });
    return response.data;
  },

  async getSchedule(id: number): Promise<Schedule> {
    const response = await apiClient.get<Schedule>(`/api/schedules/${id}`);
    return response.data;
  },

  async generateSchedule(data: ScheduleGenerateRequest): Promise<ScheduleGenerateResponse> {
    const upperCaseData = toUpperCaseFields(data, ['name', 'semester']);
    const response = await apiClient.post<ScheduleGenerateResponse>(
      '/api/schedules/generate',
      upperCaseData
    );
    return response.data;
  },

  async updateSchedule(id: number, data: Partial<Schedule>): Promise<Schedule> {
    const upperCaseData = toUpperCaseFields(data, ['name', 'semester']);
    const response = await apiClient.put<Schedule>(`/api/schedules/${id}`, upperCaseData);
    return response.data;
  },

  async publishSchedule(id: number): Promise<Schedule> {
    const response = await apiClient.post<Schedule>(`/api/schedules/${id}/publish`);
    return response.data;
  },

  async deleteSchedule(id: number): Promise<void> {
    await apiClient.delete(`/api/schedules/${id}`);
  },

  async updateSlot(
    scheduleId: number,
    slotId: number,
    data: Partial<ScheduleSlot>
  ): Promise<ScheduleSlot> {
    const upperCaseData = toUpperCaseFields(data, ['session_type', 'group']);
    const response = await apiClient.put<ScheduleSlot>(
      `/api/schedules/${scheduleId}/slots/${slotId}`,
      upperCaseData
    );
    return response.data;
  },
};
