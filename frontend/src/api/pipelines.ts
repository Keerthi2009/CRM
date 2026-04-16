import client from './client';
import { Pipeline, PipelineStage } from '../types';

export const getPipelines  = ()                                    => client.get<Pipeline[]>('/pipelines').then(r => r.data);
export const getPipeline   = (id: string)                          => client.get<Pipeline>(`/pipelines/${id}`).then(r => r.data);
export const createPipeline= (name: string)                        => client.post<Pipeline>('/pipelines', { name }).then(r => r.data);
export const updatePipeline= (id: string, name: string)            => client.put<Pipeline>(`/pipelines/${id}`, { name }).then(r => r.data);
export const deletePipeline= (id: string)                          => client.delete(`/pipelines/${id}`).then(r => r.data);

export const createStage = (pipelineId: string, data: { name: string; type: string; order?: number }) =>
  client.post<PipelineStage>(`/pipelines/${pipelineId}/stages`, data).then(r => r.data);

export const updateStage = (pipelineId: string, stageId: string, data: Partial<{ name: string; type: string; order: number }>) =>
  client.put<PipelineStage>(`/pipelines/${pipelineId}/stages/${stageId}`, data).then(r => r.data);

export const deleteStage = (pipelineId: string, stageId: string) =>
  client.delete(`/pipelines/${pipelineId}/stages/${stageId}`).then(r => r.data);
