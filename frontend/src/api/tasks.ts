import client from './client';
import { Task } from '../types';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  dueDate?: string;
  assignedToId?: string;
  templateId?: string;
}

export const getTasks      = (leadId: string)                              => client.get<Task[]>(`/leads/${leadId}/tasks`).then(r => r.data);
export const createTask    = (leadId: string, data: CreateTaskPayload)     => client.post<Task>(`/leads/${leadId}/tasks`, data).then(r => r.data);
export const updateTask    = (leadId: string, taskId: string, data: Partial<CreateTaskPayload>) => client.put<Task>(`/leads/${leadId}/tasks/${taskId}`, data).then(r => r.data);
export const completeTask  = (leadId: string, taskId: string)              => client.put<Task>(`/leads/${leadId}/tasks/${taskId}/complete`).then(r => r.data);
export const deleteTask    = (leadId: string, taskId: string)              => client.delete(`/leads/${leadId}/tasks/${taskId}`).then(r => r.data);
