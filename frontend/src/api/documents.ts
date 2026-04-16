import client from './client';
import { Document } from '../types';

export const getDocuments  = (leadId: string) => client.get<Document[]>(`/leads/${leadId}/documents`).then(r => r.data);

export const uploadDocument = (leadId: string, file: File, name?: string) => {
  const fd = new FormData();
  fd.append('file', file);
  if (name) fd.append('name', name);
  return client.post<Document>(`/leads/${leadId}/documents`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const deleteDocument = (leadId: string, docId: string) =>
  client.delete(`/leads/${leadId}/documents/${docId}`).then(r => r.data);
