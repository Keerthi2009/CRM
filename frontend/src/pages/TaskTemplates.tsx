import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, CardActions, Typography, Grid,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSnackbar } from 'notistack';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/taskTemplates';
import { TaskTemplate, TaskStep } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

interface StepEditorProps {
  steps: TaskStep[];
  onChange: (steps: TaskStep[]) => void;
}

function StepEditor({ steps, onChange }: StepEditorProps) {
  const add = () => onChange([...steps, { title: '', description: '' }]);
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const set = (i: number, field: keyof TaskStep, val: string) =>
    onChange(steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  return (
    <Box>
      {steps.map((step, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5 }}>
          <DragIndicatorIcon sx={{ mt: 1.5, color: 'text.disabled', fontSize: 18 }} />
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
            <TextField
              size="small" fullWidth label={`Step ${i + 1} title *`}
              value={step.title} onChange={(e) => set(i, 'title', e.target.value)}
            />
            <TextField
              size="small" fullWidth label="Description (optional)"
              value={step.description ?? ''} onChange={(e) => set(i, 'description', e.target.value)}
            />
          </Box>
          <IconButton size="small" onClick={() => remove(i)} sx={{ mt: 0.5 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={add}>Add Step</Button>
    </Box>
  );
}

export default function TaskTemplates() {
  const { enqueueSnackbar } = useSnackbar();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TaskTemplate | null>(null);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<TaskStep[]>([{ title: '', description: '' }]);
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const load = () => getTemplates().then(setTemplates).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditTemplate(null);
    setName('');
    setSteps([{ title: '', description: '' }]);
    setDialogOpen(true);
  };

  const openEdit = (t: TaskTemplate) => {
    setEditTemplate(t);
    setName(t.name);
    setSteps(t.steps.length ? t.steps : [{ title: '', description: '' }]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || steps.some((s) => !s.title)) return;
    setSaving(true);
    try {
      if (editTemplate) {
        const updated = await updateTemplate(editTemplate.id, { name, steps });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        enqueueSnackbar('Template updated', { variant: 'success' });
      } else {
        const created = await createTemplate(name, steps);
        setTemplates((prev) => [...prev, created]);
        enqueueSnackbar('Template created', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch {
      enqueueSnackbar('Error saving template', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTemplate(deletingId);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingId));
      enqueueSnackbar('Template deleted', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error deleting template', { variant: 'error' });
    }
    setConfirmOpen(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Task Templates</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>New Template</Button>
      </Box>

      {templates.length === 0 ? (
        <EmptyState message="No task templates yet" actionLabel="Create Template" onAction={openNew} />
      ) : (
        <Grid container spacing={2}>
          {templates.map((tmpl) => (
            <Grid item xs={12} sm={6} md={4} key={tmpl.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>{tmpl.name}</Typography>
                    <Chip label={`${tmpl.steps.length} steps`} size="small" variant="outlined" />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <List dense disablePadding>
                    {tmpl.steps.slice(0, 4).map((step, i) => (
                      <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap>
                              <Typography component="span" variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
                                {i + 1}.
                              </Typography>
                              {step.title}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                    {tmpl.steps.length > 4 && (
                      <Typography variant="caption" color="text.secondary">
                        +{tmpl.steps.length - 4} more steps
                      </Typography>
                    )}
                  </List>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <IconButton size="small" onClick={() => openEdit(tmpl)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => { setDeletingId(tmpl.id); setConfirmOpen(true); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editTemplate ? 'Edit Template' : 'New Task Template'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus fullWidth label="Template Name *" value={name}
            onChange={(e) => setName(e.target.value)} sx={{ mb: 3 }}
          />
          <Typography variant="subtitle2" gutterBottom>Steps</Typography>
          <StepEditor steps={steps} onChange={setSteps} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSave}
            disabled={!name || steps.some((s) => !s.title) || saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen} message="Delete this task template?"
        onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
