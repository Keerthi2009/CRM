import client from './client';
import { Lead } from '../types';

export interface LeadFilters {
  pipelineId?: string;
  stageId?: string;
  search?: string;
  assignedToId?: string;
}

export interface CreateLeadPayload {
  name: string;
  pipelineId: string;
  stageId: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  lat?: number;
  lng?: number;
  value?: number;
  assignedToId?: string;
}

export const getLeads   = (filters?: LeadFilters) => client.get<Lead[]>('/leads', { params: filters }).then(r => r.data);
export const getLead    = (id: string)             => client.get<Lead>(`/leads/${id}`).then(r => r.data);
export const createLead = (data: CreateLeadPayload)=> client.post<Lead>('/leads', data).then(r => r.data);
export const updateLead = (id: string, data: Partial<CreateLeadPayload>) => client.put<Lead>(`/leads/${id}`, data).then(r => r.data);
export const deleteLead = (id: string)             => client.delete(`/leads/${id}`).then(r => r.data);
export const moveStage  = (id: string, stageId: string) => client.put<Lead>(`/leads/${id}/stage`, { stageId }).then(r => r.data);
