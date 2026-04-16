import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, CardActions, Typography, Grid,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Tooltip, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import {
  getPipelines, createPipeline, updatePipeline, deletePipeline,
  createStage, updateStage, deleteStage,
} from '../api/pipelines';
import { Pipeline, PipelineStage } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

const stageTypeColors: Record<string, 'default' | 'success' | 'error'> = {
  NORMAL: 'default', WON: 'success', LOST: 'error',
};

export default function Pipelines() {
  const { enqueueSnackbar } = useSnackbar();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  // Pipeline dialog
  const [pipelineDialog, setPipelineDialog] = useState(false);
  const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null);
  const [pipelineName, setPipelineName] = useState('');

  // Stage dialog
  const [stageDialog, setStageDialog] = useState(false);
  const [editStage, setEditStage] = useState<PipelineStage | null>(null);
  const [activePipelineId, setActivePipelineId] = useState('');
  const [stageName, setStageName] = useState('');
  const [stageType, setStageType] = useState('NORMAL');

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const load = async () => { setPipelines(await getPipelines()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const confirm = (msg: string, action: () => void) => {
    setConfirmMsg(msg); setConfirmAction(() => action); setConfirmOpen(true);
  };

  // Pipeline CRUD
  const openNewPipeline = () => { setPipelineName(''); setEditPipeline(null); setPipelineDialog(true); };
  const openEditPipeline = (p: Pipeline) => { setPipelineName(p.name); setEditPipeline(p); setPipelineDialog(true); };

  const savePipeline = async () => {
    try {
      if (editPipeline) {
        const updated = await updatePipeline(editPipeline.id, pipelineName);
        setPipelines((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        enqueueSnackbar('Pipeline updated', { variant: 'success' });
      } else {
        const created = await createPipeline(pipelineName);
        setPipelines((prev) => [...prev, created]);
        enqueueSnackbar('Pipeline created', { variant: 'success' });
      }
      setPipelineDialog(false);
    } catch { enqueueSnackbar('Error saving pipeline', { variant: 'error' }); }
  };

  const handleDeletePipeline = (p: Pipeline) =>
    confirm(`Delete pipeline "${p.name}" and all its leads?`, async () => {
      try {
        await deletePipeline(p.id);
        setPipelines((prev) => prev.filter((x) => x.id !== p.id));
        enqueueSnackbar('Pipeline deleted', { variant: 'success' });
      } catch { enqueueSnackbar('Error deleting pipeline', { variant: 'error' }); }
      setConfirmOpen(false);
    });

  // Stage CRUD
  const openNewStage = (pipelineId: string) => {
    setStageName(''); setStageType('NORMAL'); setEditStage(null);
    setActivePipelineId(pipelineId); setStageDialog(true);
  };
  const openEditStage = (s: PipelineStage, pipelineId: string) => {
    setStageName(s.name); setStageType(s.type); setEditStage(s);
    setActivePipelineId(pipelineId); setStageDialog(true);
  };

  const saveStage = async () => {
    try {
      if (editStage) {
        const updated = await updateStage(activePipelineId, editStage.id, { name: stageName, type: stageType });
        setPipelines((prev) => prev.map((p) =>
          p.id === activePipelineId
            ? { ...p, stages: p.stages.map((s) => (s.id === updated.id ? updated : s)) }
            : p,
        ));
        enqueueSnackbar('Stage updated', { variant: 'success' });
      } else {
        const created = await createStage(activePipelineId, { name: stageName, type: stageType });
        setPipelines((prev) => prev.map((p) =>
          p.id === activePipelineId ? { ...p, stages: [...p.stages, created] } : p,
        ));
        enqueueSnackbar('Stage added', { variant: 'success' });
      }
      setStageDialog(false);
    } catch { enqueueSnackbar('Error saving stage', { variant: 'error' }); }
  };

  const handleDeleteStage = (s: PipelineStage, pipelineId: string) =>
    confirm(`Delete stage "${s.name}"?`, async () => {
      try {
        await deleteStage(pipelineId, s.id);
        setPipelines((prev) => prev.map((p) =>
          p.id === pipelineId ? { ...p, stages: p.stages.filter((x) => x.id !== s.id) } : p,
        ));
        enqueueSnackbar('Stage deleted', { variant: 'success' });
      } catch { enqueueSnackbar('Error deleting stage', { variant: 'error' }); }
      setConfirmOpen(false);
    });

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Pipelines</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNewPipeline}>New Pipeline</Button>
      </Box>

      {pipelines.length === 0 ? (
        <EmptyState message="No pipelines yet" actionLabel="Create Pipeline" onAction={openNewPipeline} />
      ) : (
        <Grid container spacing={2}>
          {pipelines.map((pipeline) => (
            <Grid item xs={12} md={6} lg={4} key={pipeline.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontSize="1rem">{pipeline.name}</Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openEditPipeline(pipeline)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeletePipeline(pipeline)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {pipeline.stages.map((s) => (
                      <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={s.name}
                          size="small"
                          color={stageTypeColors[s.type]}
                          variant={s.type === 'NORMAL' ? 'outlined' : 'filled'}
                          onDelete={() => handleDeleteStage(s, pipeline.id)}
                          onClick={() => openEditStage(s, pipeline.id)}
                        />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Tooltip title="Add stage">
                    <Button size="small" startIcon={<AddIcon />} onClick={() => openNewStage(pipeline.id)}>Add Stage</Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pipeline dialog */}
      <Dialog open={pipelineDialog} onClose={() => setPipelineDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editPipeline ? 'Edit Pipeline' : 'New Pipeline'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Pipeline Name" value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPipelineDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePipeline} disabled={!pipelineName}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Stage dialog */}
      <Dialog open={stageDialog} onClose={() => setStageDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editStage ? 'Edit Stage' : 'New Stage'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField autoFocus fullWidth label="Stage Name" value={stageName} onChange={(e) => setStageName(e.target.value)} />
          <TextField fullWidth select label="Type" value={stageType} onChange={(e) => setStageType(e.target.value)}>
            <MenuItem value="NORMAL">Normal</MenuItem>
            <MenuItem value="WON">Won</MenuItem>
            <MenuItem value="LOST">Lost</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveStage} disabled={!stageName}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirmOpen} message={confirmMsg} onConfirm={confirmAction} onCancel={() => setConfirmOpen(false)} />
    </Box>
  );
}
