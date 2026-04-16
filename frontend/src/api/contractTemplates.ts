import client from './client';
import { ContractTemplate } from '../types';

export const getContractTemplates = () =>
  client.get<ContractTemplate[]>('/contract-templates').then((r) => r.data);

export const getContractTemplate = (id: string) =>
  client.get<ContractTemplate>(`/contract-templates/${id}`).then((r) => r.data);

export const createContractTemplate = (data: { name: string; content: string; signerCount: number }) =>
  client.post<ContractTemplate>('/contract-templates', data).then((r) => r.data);

export const updateContractTemplate = (id: string, data: { name?: string; content?: string; signerCount?: number }) =>
  client.put<ContractTemplate>(`/contract-templates/${id}`, data).then((r) => r.data);

export const deleteContractTemplate = (id: string) =>
  client.delete(`/contract-templates/${id}`).then((r) => r.data);
