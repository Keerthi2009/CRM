export type Role = 'AGGREGATOR' | 'ADMIN' | 'MANAGER' | 'SALES_REP';
export type StageType = 'NORMAL' | 'WON' | 'LOST';
export type ContractStatus = 'DRAFT' | 'SENT' | 'COMPLETED' | 'DECLINED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Organisation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: Role;
  organisation?: Organisation;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  type: StageType;
  order: number;
  _count?: { leads: number };
}

export interface Pipeline {
  id: string;
  orgId: string;
  name: string;
  stages: PipelineStage[];
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  orgId: string;
  pipelineId: string;
  stageId: string;
  assignedToId?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  lat?: number;
  lng?: number;
  value: number;
  stage?: PipelineStage;
  pipeline?: Pipeline;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'>;
  tasks?: Task[];
  documents?: Document[];
  contracts?: Contract[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStep {
  title: string;
  description?: string;
}

export interface TaskTemplate {
  id: string;
  orgId: string;
  name: string;
  steps: TaskStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  leadId: string;
  templateId?: string;
  assignedToId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string | null;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  leadId: string;
  uploadedById?: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedBy?: Pick<User, 'id' | 'name'>;
  createdAt: string;
}

export interface ContractSigner {
  role: string;    // "Signer 1", "Signer 2", …
  name: string;
  email: string;
}

export interface ContractTemplate {
  id: string;
  orgId: string;
  name: string;
  content: string;  // HTML
  signerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  leadId: string;
  templateId?: string;
  title: string;
  content?: string;
  signers?: ContractSigner[];
  docusealSubmissionId?: string;
  status: ContractStatus;
  sentAt?: string;
  completedAt?: string;
  signingUrl?: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  leadId: string;
  contractId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  activeLeads: number;
  totalValue: number;
  wonValue: number;
  conversionRate: number;
  leadsPerStage: Array<{ stage: string; count: number; value: number }>;
  recentLeads: Lead[];
}
