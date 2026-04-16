import client from './client';
import { DashboardStats } from '../types';

export const getDashboard = () => client.get<DashboardStats>('/dashboard').then(r => r.data);
