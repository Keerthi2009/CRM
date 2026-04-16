import client from './client';
import { User } from '../types';

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; password: string; orgId: string; role?: string }
export interface AuthResponse { token: string; user: User }

export const login    = (data: LoginPayload)    => client.post<AuthResponse>('/auth/login', data).then(r => r.data);
export const register = (data: RegisterPayload) => client.post<{ user: User }>('/auth/register', data).then(r => r.data);
export const getMe    = ()                       => client.get<User>('/auth/me').then(r => r.data);
