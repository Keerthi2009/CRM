import client from './client';
import { User, Organisation } from '../types';

export interface CreateUserPayload { name: string; email: string; password: string; role: string; orgId?: string }
export interface UpdateUserPayload { name?: string; email?: string; role?: string; password?: string }

export const getUsers      = (orgId?: string)                    => client.get<User[]>('/users', { params: orgId ? { orgId } : undefined }).then(r => r.data);
export const createUser    = (data: CreateUserPayload)           => client.post<User>('/users', data).then(r => r.data);
export const updateUser    = (id: string, data: UpdateUserPayload) => client.put<User>(`/users/${id}`, data).then(r => r.data);
export const deleteUser    = (id: string)                        => client.delete(`/users/${id}`).then(r => r.data);

export const getOrganisations   = ()           => client.get<Organisation[]>('/organisations').then(r => r.data);
export const createOrganisation = (name: string) => client.post<Organisation>('/organisations', { name }).then(r => r.data);
export const getOrganisation    = (id: string) => client.get<Organisation>(`/organisations/${id}`).then(r => r.data);
export const updateOrganisation = (id: string, name: string) => client.put<Organisation>(`/organisations/${id}`, { name }).then(r => r.data);
