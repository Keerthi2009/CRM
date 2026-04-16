import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, ToggleButtonGroup, ToggleButton, TextField,
  MenuItem, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Avatar, Tooltip, IconButton, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableRowsIcon from '@mui/icons-material/TableRows';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { getLeads, createLead, deleteLead } from '../api/leads';
import { getPipelines } from '../api/pipelines';
import { getUsers } from '../api/users';
import { Lead, Pipeline, PipelineStage, User } from '../types';
import KanbanBoard from '../components/kanban/KanbanBoard';
import LeadForm, { LeadFormData } from '../components/leads/LeadForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuthStore } from '../store/authStore';

const stageChip = (stage?: PipelineStage) => {
  if (!stage) return null;
  const color = stage.type === 'WON' ? 'success' : stage.type === 'LOST' ? 'error' : 'primary';
  return <Chip label={stage.name} size="small" color={color} variant="outlined" />;
};

export default function Leads() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const load = async () => {
    const [l, p, u] = await Promise.all([getLeads(), getPipelines(), getUsers().catch(() => [])]);
    setLeads(l); setPipelines(p); setUsers(u); setLoading(false);
    if (p.length > 0 && !selectedPipeline) setSelectedPipeline(p[0].id);
  };
  useEffect(() => { load(); }, []);

  const filteredLeads = leads.filter((l) => {
    const matchesPipeline = !selectedPipeline || l.pipelineId === selectedPipeline;
    const matchesSearch = !search || [l.name, l.email, l.company].some((f) => f?.toLowerCase().includes(search.toLowerCase()));
    return matchesPipeline && matchesSearch;
  });

  const activePipeline = pipelines.find((p) => p.id === selectedPipeline);
  const stages = activePipeline?.stages.slice().sort((a, b) => a.order - b.order) ?? [];

  const handleCreate = async (data: LeadFormData) => {
    const lead = await createLead(data);
    setLeads((prev) => [lead, ...prev]);
    enqueueSnackbar('Lead created', { variant: 'success' });
  };

  const handleDelete = async () => {
    try {
      await deleteLead(deletingId);
      setLeads((prev) => prev.filter((l) => l.id !== deletingId));
      enqueueSnackbar('Lead deleted', { variant: 'success' });
    } catch { enqueueSnackbar('Error deleting lead', { variant: 'error' }); }
    setConfirmOpen(false);
  };

  const handleLeadMoved = (leadId: string, stageId: string) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stageId } : l));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Leads</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
            <ToggleButton value="table"><TableRowsIcon fontSize="small" /></ToggleButton>
            <ToggleButton value="kanban"><ViewKanbanIcon fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>New Lead</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search leads..." value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <TextField size="small" select label="Pipeline" value={selectedPipeline}
          onChange={(e) => setSelectedPipeline(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">All Pipelines</MenuItem>
          {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
      </Box>

      {/* Table view */}
      {view === 'table' && (
        filteredLeads.length === 0 ? (
          <EmptyState message="No leads found" actionLabel="Add Lead" onAction={() => setFormOpen(true)} />
        ) : (
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell align="right">Value</TableCell>
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <TableCell />}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} hover onClick={() => navigate(`/leads/${lead.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell><Typography variant="body2" fontWeight={500}>{lead.name}</Typography></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{lead.company || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{lead.email || '—'}</TableCell>
                    <TableCell>{stageChip(lead.stage)}</TableCell>
                    <TableCell>
                      {lead.assignedTo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: 'primary.main' }}>
                            {lead.assignedTo.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{lead.assignedTo.name}</Typography>
                        </Box>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="right">${(lead.value || 0).toLocaleString()}</TableCell>
                    {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => { setDeletingId(lead.id); setConfirmOpen(true); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        stages.length === 0
          ? <EmptyState message="Select a pipeline to view Kanban" />
          : <KanbanBoard stages={stages} leads={filteredLeads} onLeadMoved={handleLeadMoved} />
      )}

      <LeadForm
        open={formOpen} onClose={() => setFormOpen(false)}
        onSubmit={handleCreate} pipelines={pipelines} users={users}
      />

      <ConfirmDialog
        open={confirmOpen} message="Delete this lead and all its data?"
        onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
