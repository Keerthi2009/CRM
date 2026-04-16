import client from './client';
import { Contract, ContractSigner } from '../types';

export interface CreateContractPayload {
  title: string;
  templateId?: string;
  content?: string;
  signers?: ContractSigner[];
}

export const getContracts   = (leadId: string) =>
  client.get<Contract[]>(`/leads/${leadId}/contracts`).then((r) => r.data);

export const createContract = (leadId: string, payload: CreateContractPayload) =>
  client.post<Contract>(`/leads/${leadId}/contracts`, payload).then((r) => r.data);

export const updateContract = (leadId: string, contractId: string, data: { title?: string; status?: string; content?: string; signers?: ContractSigner[] }) =>
  client.put<Contract>(`/leads/${leadId}/contracts/${contractId}`, data).then((r) => r.data);

export const sendContract   = (leadId: string, contractId: string, signers?: ContractSigner[]) =>
  client.post<Contract & { signingUrl: string }>(`/leads/${leadId}/contracts/${contractId}/send`, { signers }).then((r) => r.data);

export const deleteContract = (leadId: string, contractId: string) =>
  client.delete(`/leads/${leadId}/contracts/${contractId}`).then((r) => r.data);
