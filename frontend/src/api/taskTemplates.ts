import client from './client';
import { TaskTemplate, Task, TaskStep } from '../types';

export const getTemplates   = ()                                          => client.get<TaskTemplate[]>('/task-templates').then(r => r.data);
export const createTemplate = (name: string, steps: TaskStep[])          => client.post<TaskTemplate>('/task-templates', { name, steps }).then(r => r.data);
export const updateTemplate = (id: string, data: { name?: string; steps?: TaskStep[] }) =>
  client.put<TaskTemplate>(`/task-templates/${id}`, data).then(r => r.data);
export const deleteTemplate = (id: string)                               => client.delete(`/task-templates/${id}`).then(r => r.data);
export const applyTemplate  = (templateId: string, leadId: string)       => client.post<Task[]>(`/task-templates/${templateId}/apply/${leadId}`).then(r => r.data);
