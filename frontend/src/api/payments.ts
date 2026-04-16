import client from './client';
import { Payment } from '../types';

export interface CreatePaymentPayload {
  amount: number;
  currency?: string;
  contractId?: string;
  notes?: string;
  status?: string;
}

export const getPayments   = (leadId: string)                                        => client.get<Payment[]>(`/leads/${leadId}/payments`).then(r => r.data);
export const createPayment = (leadId: string, data: CreatePaymentPayload)            => client.post<Payment>(`/leads/${leadId}/payments`, data).then(r => r.data);
export const updatePayment = (leadId: string, paymentId: string, data: Partial<CreatePaymentPayload & { paidAt?: string }>) =>
  client.put<Payment>(`/leads/${leadId}/payments/${paymentId}`, data).then(r => r.data);
export const deletePayment = (leadId: string, paymentId: string)                     => client.delete(`/leads/${leadId}/payments/${paymentId}`).then(r => r.data);
