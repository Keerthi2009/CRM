import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Typography, Chip, Button, Grid, Card, CardContent,
  TextField, MenuItem, IconButton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Checkbox, Divider, Paper, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  CircularProgress, InputAdornment, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSnackbar } from 'notistack';

import { getLead, updateLead } from '../api/leads';
import { getTasks, createTask, updateTask, completeTask, deleteTask } from '../api/tasks';
import { getDocuments, uploadDocument, deleteDocument } from '../api/documents';
import { getContracts, createContract, sendContract, deleteContract } from '../api/contracts';
import { getPayments, createPayment, updatePayment, deletePayment } from '../api/payments';
import { getPipelines } from '../api/pipelines';
import { getUsers } from '../api/users';
import { getTemplates, applyTemplate } from '../api/taskTemplates';
import { getContractTemplates, getContractTemplate } from '../api/contractTemplates';
import { Lead, Task, Document, Contract, Payment, Pipeline, User, TaskTemplate, ContractTemplate, ContractSigner } from '../types';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ lead, pipelines, users, onUpdated }: { lead: Lead; pipelines: Pipeline[]; users: User[]; onUpdated: (l: Lead) => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [editing, setEditing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [form, setForm] = useState({
    name: lead.name, email: lead.email ?? '', phone: lead.phone ?? '',
    company: lead.company ?? '', address: lead.address ?? '',
    lat: lead.lat, lng: lead.lng,
    value: lead.value, stageId: lead.stageId, assignedToId: lead.assignedToId ?? '',
    pipelineId: lead.pipelineId,
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const geocodeAddress = async () => {
    if (!form.address) return;
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1`, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data[0]) setForm((p) => ({ ...p, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
    } finally { setGeocoding(false); }
  };

  const save = async () => {
    try {
      const updated = await updateLead(lead.id, { ...form, value: parseFloat(String(form.value)) });
      onUpdated(updated);
      setEditing(false);
      enqueueSnackbar('Lead updated', { variant: 'success' });
    } catch { enqueueSnackbar('Error updating lead', { variant: 'error' }); }
  };

  const pipeline = pipelines.find((p) => p.id === form.pipelineId);
  const stageColor = lead.stage?.type === 'WON' ? 'success' : lead.stage?.type === 'LOST' ? 'error' : 'primary';

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Lead Info</Typography>
              <IconButton size="small" onClick={() => setEditing(!editing)}><EditIcon fontSize="small" /></IconButton>
            </Box>
            {editing ? (
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label="Name" value={form.name} onChange={set('name')} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Email" value={form.email} onChange={set('email')} /></Grid>
                <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Company" value={form.company} onChange={set('company')} /></Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" value={form.address} onChange={set('address')} onBlur={geocodeAddress}
                    helperText={geocoding ? 'Geocoding...' : form.lat ? `📍 ${form.lat?.toFixed(4)}, ${form.lng?.toFixed(4)}` : ''}
                    InputProps={{ endAdornment: geocoding ? <CircularProgress size={16} /> : null }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Value" type="number" value={form.value} onChange={set('value')}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth select label="Stage" value={form.stageId} onChange={set('stageId')}>
                    {(pipeline?.stages ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth select label="Assigned To" value={form.assignedToId} onChange={set('assignedToId')}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" onClick={save}>Save</Button>
                    <Button onClick={() => setEditing(false)}>Cancel</Button>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={1}>
                {[
                  ['Name', lead.name],
                  ['Email', lead.email || '—'],
                  ['Phone', lead.phone || '—'],
                  ['Company', lead.company || '—'],
                  ['Address', lead.address || '—'],
                  ['Value', `$${(lead.value || 0).toLocaleString()}`],
                  ['Assigned To', lead.assignedTo?.name || 'Unassigned'],
                  ['Pipeline', lead.pipeline?.name || '—'],
                ].map(([label, val]) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{val}</Typography>
                  </Grid>
                ))}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Stage</Typography><br />
                  <Chip label={lead.stage?.name} size="small" color={stageColor} />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Location</Typography>
            {lead.lat && lead.lng ? (
              <Box sx={{ height: 280, borderRadius: 1, overflow: 'hidden' }}>
                <MapContainer center={[lead.lat, lead.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  <Marker position={[lead.lat, lead.lng]}>
                    <Popup>{lead.name}{lead.address && <><br />{lead.address}</>}</Popup>
                  </Marker>
                </MapContainer>
              </Box>
            ) : (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">No location data</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ─── Tasks Tab ───────────────────────────────────────────────────────────────
function TasksTab({ leadId, templates }: { leadId: string; templates: TaskTemplate[] }) {
  const { enqueueSnackbar } = useSnackbar();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const load = () => getTasks(leadId).then(setTasks).finally(() => setLoading(false));
  useEffect(() => { load(); }, [leadId]);

  const handleAdd = async () => {
    if (!newTitle) return;
    const task = await createTask(leadId, { title: newTitle, description: newDesc, dueDate: newDue || undefined });
    setTasks((p) => [...p, task]);
    setAddOpen(false); setNewTitle(''); setNewDesc(''); setNewDue('');
    enqueueSnackbar('Task added', { variant: 'success' });
  };

  const handleToggle = async (task: Task) => {
    const updated = await completeTask(leadId, task.id);
    setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = async () => {
    await deleteTask(leadId, deletingId);
    setTasks((p) => p.filter((t) => t.id !== deletingId));
    setConfirmOpen(false);
    enqueueSnackbar('Task deleted', { variant: 'success' });
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;
    const newTasks = await applyTemplate(selectedTemplate, leadId);
    setTasks((p) => [...p, ...newTasks]);
    setApplyOpen(false);
    enqueueSnackbar(`${newTasks.length} tasks added from template`, { variant: 'success' });
  };

  if (loading) return <LoadingSpinner />;
  const done = tasks.filter((t) => t.completedAt).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Task</Button>
        {templates.length > 0 && (
          <Button variant="outlined" onClick={() => setApplyOpen(true)}>Apply Template</Button>
        )}
        {tasks.length > 0 && (
          <Chip label={`${done}/${tasks.length} done`} color={done === tasks.length ? 'success' : 'default'} sx={{ ml: 'auto' }} />
        )}
      </Box>

      {tasks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No tasks yet.</Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {tasks.map((task, i) => (
              <Box key={task.id}>
                {i > 0 && <Divider />}
                <ListItem dense>
                  <Checkbox
                    checked={!!task.completedAt}
                    onChange={() => handleToggle(task)}
                    color="success" size="small"
                  />
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ textDecoration: task.completedAt ? 'line-through' : 'none', color: task.completedAt ? 'text.disabled' : 'text.primary' }}>{task.title}</Typography>}
                    secondary={[task.description, task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString()}`, task.assignedTo?.name].filter(Boolean).join(' · ')}
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => { setDeletingId(task.id); setConfirmOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* Add task dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField autoFocus fullWidth label="Title *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <TextField fullWidth label="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} multiline rows={2} />
          <TextField fullWidth label="Due Date" type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newTitle}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Apply template dialog */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Apply Task Template</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label="Template" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} sx={{ mt: 1 }}>
            {templates.map((t) => <MenuItem key={t.id} value={t.id}>{t.name} ({(t.steps as unknown[]).length} steps)</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply} disabled={!selectedTemplate}>Apply</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirmOpen} message="Delete this task?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </Box>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────────────────
function DocumentsTab({ leadId }: { leadId: string }) {
  const { enqueueSnackbar } = useSnackbar();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getDocuments(leadId).then(setDocs).finally(() => setLoading(false)); }, [leadId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(leadId, file);
      setDocs((p) => [doc, ...p]);
      enqueueSnackbar('File uploaded', { variant: 'success' });
    } catch { enqueueSnackbar('Upload failed', { variant: 'error' }); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const handleDelete = async () => {
    await deleteDocument(leadId, deletingId);
    setDocs((p) => p.filter((d) => d.id !== deletingId));
    setConfirmOpen(false);
    enqueueSnackbar('Document deleted', { variant: 'success' });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <input ref={inputRef} type="file" hidden onChange={handleFileChange} />
        <Button variant="contained" startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AttachFileIcon />}
          onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </Box>

      {docs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No documents yet.</Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {docs.map((doc, i) => (
              <Box key={doc.id}>
                {i > 0 && <Divider />}
                <ListItem>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', mr: 2, width: 36, height: 36, fontSize: 13 }}>
                    {doc.name.split('.').pop()?.toUpperCase().slice(0, 3) ?? 'DOC'}
                  </Avatar>
                  <ListItemText
                    primary={doc.name}
                    secondary={[doc.uploadedBy?.name, formatSize(doc.size), new Date(doc.createdAt).toLocaleDateString()].filter(Boolean).join(' · ')}
                  />
                  <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download">
                      <IconButton size="small" component="a" href={doc.url} target="_blank" rel="noopener noreferrer"><DownloadIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => { setDeletingId(doc.id); setConfirmOpen(true); }}><DeleteIcon fontSize="small" /></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}
      <ConfirmDialog open={confirmOpen} message="Delete this document?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </Box>
  );
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────
// ─── Contract Wizard ─────────────────────────────────────────────────────────
type WizardStep = 'template' | 'signers' | 'preview';

function resolvePlaceholders(html: string, lead: Lead, signers: ContractSigner[]): string {
  let out = html;
  out = out.replace(/\{\{lead\.name\}\}/g, lead.name ?? '');
  out = out.replace(/\{\{lead\.email\}\}/g, lead.email ?? '');
  out = out.replace(/\{\{lead\.phone\}\}/g, lead.phone ?? '');
  out = out.replace(/\{\{lead\.company\}\}/g, lead.company ?? '');
  out = out.replace(/\{\{lead\.address\}\}/g, lead.address ?? '');
  out = out.replace(/\{\{lead\.value\}\}/g, String(lead.value ?? 0));
  signers.forEach((s, i) => {
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{signer${n}\\.name\\}\\}`, 'g'), s.name);
    out = out.replace(new RegExp(`\\{\\{signer${n}\\.email\\}\\}`, 'g'), s.email);
    out = out.replace(new RegExp(`\\{\\{signer${n}\\.signature\\}\\}`, 'g'),
      `<span style="display:inline-block;min-width:180px;border-bottom:1px solid #000;font-style:italic;color:#555">&nbsp;[Signature]&nbsp;</span>`);
    out = out.replace(new RegExp(`\\{\\{signer${n}\\.initials\\}\\}`, 'g'),
      `<span style="display:inline-block;min-width:60px;border-bottom:1px solid #000;font-style:italic;color:#555">&nbsp;[Initials]&nbsp;</span>`);
    out = out.replace(new RegExp(`\\{\\{signer${n}\\.date\\}\\}`, 'g'),
      `<span style="display:inline-block;min-width:120px;border-bottom:1px solid #000;color:#555">&nbsp;[Date]&nbsp;</span>`);
  });
  return out;
}

function ContractWizard({
  lead, open, onClose, onCreated,
}: { lead: Lead; open: boolean; onClose: () => void; onCreated: (c: Contract) => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const previewRef = useRef<HTMLDivElement>(null);

  const [step, setStep]               = useState<WizardStep>('template');
  const [templates, setTemplates]     = useState<ContractTemplate[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<ContractTemplate | null>(null);
  const [title, setTitle]             = useState('');
  const [signers, setSigners]         = useState<ContractSigner[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (open) {
      setStep('template'); setSelectedTpl(null); setTitle(''); setSigners([]); setPreviewHtml('');
      getContractTemplates().then(setTemplates).catch(console.error);
    }
  }, [open]);

  const handleSelectTemplate = async (tpl: ContractTemplate) => {
    const full = await getContractTemplate(tpl.id);
    setSelectedTpl(full);
    setTitle(full.name);
    setSigners(Array.from({ length: full.signerCount }, (_, i) => ({
      role: `Signer ${i + 1}`, name: i === 0 ? lead.name : '', email: i === 0 ? (lead.email ?? '') : '',
    })));
    setStep('signers');
  };

  const handlePreview = () => {
    if (!selectedTpl) return;
    setPreviewHtml(resolvePlaceholders(selectedTpl.content, lead, signers));
    setStep('preview');
  };

  const handleDownloadPdf = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    if (!previewRef.current) return;
    html2pdf().set({
      margin: [15, 20],
      filename: `${title}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(previewRef.current).save();
  };

  const handleCreateAndSend = async () => {
    if (!selectedTpl) return;
    setSaving(true);
    try {
      const contract = await createContract(lead.id, {
        title,
        templateId: selectedTpl.id,
        content: previewHtml,
        signers,
      });
      // Send immediately
      const sent = await sendContract(lead.id, contract.id, signers);
      enqueueSnackbar('Contract created and sent for signing!', { variant: 'success' });
      if (sent.signingUrl) window.open(sent.signingUrl, '_blank');
      onCreated(sent);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => {
    if (!selectedTpl) return;
    setSaving(true);
    try {
      const contract = await createContract(lead.id, {
        title, templateId: selectedTpl.id, content: previewHtml, signers,
      });
      enqueueSnackbar('Contract saved as draft', { variant: 'success' });
      onCreated(contract);
      onClose();
    } catch { enqueueSnackbar('Error saving contract', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const updateSigner = (i: number, field: keyof ContractSigner, value: string) =>
    setSigners((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        New Contract
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          Step {step === 'template' ? 1 : step === 'signers' ? 2 : 3} of 3 —{' '}
          {step === 'template' ? 'Select Template' : step === 'signers' ? 'Configure Signers' : 'Preview & Send'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 400 }}>
        {/* Step 1: Template selection */}
        {step === 'template' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Select a contract template:</Typography>
            {templates.length === 0 ? (
              <Alert severity="info">No templates found. Create one in <strong>Contract Templates</strong> first.</Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {templates.map((t) => (
                  <Paper
                    key={t.id} variant="outlined"
                    sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => handleSelectTemplate(t)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight={500}>{t.name}</Typography>
                      <Chip label={`${t.signerCount} signer${t.signerCount > 1 ? 's' : ''}`} size="small" />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Signers */}
        {step === 'signers' && selectedTpl && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth label="Contract Title" size="small"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <Divider />
            <Typography variant="subtitle2">
              Signer details — {signers.length} signer{signers.length > 1 ? 's' : ''} required by this template
            </Typography>
            {signers.map((s, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="caption" fontWeight={600} color="primary" sx={{ mb: 1, display: 'block' }}>
                  {s.role}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Full Name *" size="small" fullWidth
                    value={s.name} onChange={(e) => updateSigner(i, 'name', e.target.value)}
                  />
                  <TextField
                    label="Email *" size="small" fullWidth type="email"
                    value={s.email} onChange={(e) => updateSigner(i, 'email', e.target.value)}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button size="small" startIcon={<DownloadIcon />} onClick={handleDownloadPdf}>
                Download PDF
              </Button>
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 4, bgcolor: '#fff', minHeight: 600,
                fontFamily: 'Georgia, serif', lineHeight: 1.8,
                '& p': { marginBottom: '1em' },
              }}
            >
              <div
                ref={previewRef}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step === 'signers' && (
          <Button onClick={() => setStep('template')}>Back</Button>
        )}
        {step === 'preview' && (
          <Button onClick={() => setStep('signers')}>Back</Button>
        )}
        {step === 'signers' && (
          <Button
            variant="outlined"
            disabled={!title || signers.some((s) => !s.name || !s.email)}
            onClick={handlePreview}
          >
            Preview
          </Button>
        )}
        {step === 'preview' && (
          <>
            <Button variant="outlined" onClick={handleSaveDraft} disabled={saving}>
              Save as Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleCreateAndSend}
              disabled={saving}
            >
              {saving ? 'Sending…' : 'Send for Signature'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────
function ContractsTab({ lead }: { lead: Lead }) {
  const { enqueueSnackbar } = useSnackbar();
  const authUser = useAuthStore((s) => s.user);
  const canEdit = authUser?.role === 'ADMIN' || authUser?.role === 'MANAGER';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payAmount, setPayAmount]   = useState('');
  const [payCurrency, setPayCurrency] = useState('USD');
  const [payNotes, setPayNotes]     = useState('');
  const [payContractId, setPayContractId] = useState('');
  const [payStatus, setPayStatus]   = useState('PENDING');

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg]   = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const load = async () => {
    const [c, p] = await Promise.all([getContracts(lead.id), getPayments(lead.id)]);
    setContracts(c); setPayments(p); setLoading(false);
  };
  useEffect(() => { load(); }, [lead.id]);

  const confirm = (msg: string, action: () => void) => {
    setConfirmMsg(msg); setConfirmAction(() => action); setConfirmOpen(true);
  };

  const handleSend = (contractId: string, signers?: ContractSigner[]) =>
    confirm('Send this contract for e-signing?', async () => {
      try {
        const updated = await sendContract(lead.id, contractId, signers);
        setContracts((p) => p.map((c) => (c.id === updated.id ? updated : c)));
        enqueueSnackbar('Contract sent for signing', { variant: 'success' });
        if (updated.signingUrl) window.open(updated.signingUrl, '_blank');
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error';
        enqueueSnackbar(msg, { variant: 'error' });
      }
      setConfirmOpen(false);
    });

  const handleDeleteContract = (contractId: string) =>
    confirm('Delete this contract?', async () => {
      await deleteContract(lead.id, contractId);
      setContracts((p) => p.filter((c) => c.id !== contractId));
      enqueueSnackbar('Contract deleted', { variant: 'success' });
      setConfirmOpen(false);
    });

  const handleAddPayment = async () => {
    const p = await createPayment(lead.id, {
      amount: parseFloat(payAmount), currency: payCurrency,
      notes: payNotes, contractId: payContractId || undefined, status: payStatus,
    });
    setPayments((prev) => [p, ...prev]);
    setPaymentDialog(false); setPayAmount(''); setPayNotes(''); setPayContractId(''); setPayStatus('PENDING');
    enqueueSnackbar('Payment recorded', { variant: 'success' });
  };

  const handleMarkPaid = async (payment: Payment) => {
    const updated = await updatePayment(lead.id, payment.id, { status: 'PAID', paidAt: new Date().toISOString() });
    setPayments((p) => p.map((x) => (x.id === updated.id ? updated : x)));
    enqueueSnackbar('Payment marked as paid', { variant: 'success' });
  };

  const handleDeletePayment = (paymentId: string) =>
    confirm('Delete this payment record?', async () => {
      await deletePayment(lead.id, paymentId);
      setPayments((p) => p.filter((x) => x.id !== paymentId));
      enqueueSnackbar('Payment deleted', { variant: 'success' });
      setConfirmOpen(false);
    });

  const handleDownload = (c: Contract) => {
    const signerLines = (c.signers ?? [])
      .map((s) => {
        const signed = (s as ContractSigner & { signed?: boolean; signedAt?: string }).signed;
        const signedAt = (s as ContractSigner & { signed?: boolean; signedAt?: string }).signedAt;
        return `<tr>
          <td style="padding:6px 12px;border:1px solid #ddd">${s.role}</td>
          <td style="padding:6px 12px;border:1px solid #ddd">${s.name}</td>
          <td style="padding:6px 12px;border:1px solid #ddd">${s.email}</td>
          <td style="padding:6px 12px;border:1px solid #ddd">${signed ? `Signed ${signedAt ? new Date(signedAt).toLocaleDateString() : ''}` : 'Pending'}</td>
        </tr>`;
      }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${c.title}</title>
  <style>
    @media print { .no-print { display:none; } }
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; color: #333; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
    .contract-body { border: 1px solid #ddd; border-radius: 6px; padding: 28px; margin-bottom: 28px; min-height: 200px; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th { background: #f5f5f5; padding: 6px 12px; border: 1px solid #ddd; text-align: left; }
    .print-btn { display: inline-block; padding: 10px 24px; background: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 20px; }
    .status { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
      background: ${{ DRAFT: '#e0e0e0', SENT: '#bbdefb', COMPLETED: '#c8e6c9', DECLINED: '#ffcdd2' }[c.status] ?? '#e0e0e0'}; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">⬇ Save / Print as PDF</button>
  <h1>${c.title}</h1>
  <div class="meta">
    Status: <span class="status">${c.status}</span>
    ${c.sentAt ? ` &nbsp;·&nbsp; Sent: ${new Date(c.sentAt).toLocaleDateString()}` : ''}
    ${c.completedAt ? ` &nbsp;·&nbsp; Completed: ${new Date(c.completedAt).toLocaleDateString()}` : ''}
    &nbsp;·&nbsp; Lead: ${lead.name}
  </div>

  <div class="contract-body">
    ${c.content ? c.content : '<p style="color:#999;font-style:italic">No contract content.</p>'}
  </div>

  ${signerLines ? `<h3 style="margin-bottom:10px">Signers</h3>
  <table><thead><tr>
    <th>Role</th><th>Name</th><th>Email</th><th>Status</th>
  </tr></thead><tbody>${signerLines}</tbody></table>` : ''}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) w.focus();
    // Clean up object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const contractStatusColor: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
    DRAFT: 'default', SENT: 'info', COMPLETED: 'success', DECLINED: 'error',
  };
  const payStatusColor: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
    PENDING: 'warning', PAID: 'success', FAILED: 'error', REFUNDED: 'default',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      {/* Contracts section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>Contracts</Typography>
        {canEdit && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setWizardOpen(true)}>
            New Contract
          </Button>
        )}
      </Box>

      {contracts.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>No contracts yet.</Typography>
      ) : (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <List disablePadding>
            {contracts.map((c, i) => (
              <Box key={c.id}>
                {i > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500}>{c.title}</Typography>
                        <Chip label={c.status} size="small" color={contractStatusColor[c.status]} />
                        {c.signers && c.signers.length > 0 && (
                          <Chip label={`${c.signers.length} signer${c.signers.length > 1 ? 's' : ''}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={[
                      c.signers?.map((s) => s.name).join(', '),
                      c.sentAt && `Sent: ${new Date(c.sentAt).toLocaleDateString()}`,
                      c.completedAt && `Completed: ${new Date(c.completedAt).toLocaleDateString()}`,
                    ].filter(Boolean).join(' · ')}
                  />
                  <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download / Print PDF">
                      <IconButton size="small" onClick={() => handleDownload(c)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEdit && c.status === 'DRAFT' && (
                      <Tooltip title="Send for signature">
                        <IconButton size="small" onClick={() => handleSend(c.id, c.signers ?? undefined)}>
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <IconButton size="small" onClick={() => handleDeleteContract(c.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* Payments section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600}>Payments</Typography>
        {canEdit && <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setPaymentDialog(true)}>Record Payment</Button>}
      </Box>

      {payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No payments yet.</Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {payments.map((p, i) => (
              <Box key={p.id}>
                {i > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{p.currency} {p.amount.toLocaleString()}</Typography>
                      <Chip label={p.status} size="small" color={payStatusColor[p.status]} />
                    </Box>}
                    secondary={[p.notes, p.paidAt && `Paid: ${new Date(p.paidAt).toLocaleDateString()}`].filter(Boolean).join(' · ')}
                  />
                  <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                    {canEdit && p.status === 'PENDING' && (
                      <Tooltip title="Mark as paid">
                        <Button size="small" variant="outlined" color="success" onClick={() => handleMarkPaid(p)}>Mark Paid</Button>
                      </Tooltip>
                    )}
                    {canEdit && <IconButton size="small" onClick={() => handleDeletePayment(p.id)}><DeleteIcon fontSize="small" /></IconButton>}
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
          <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>
              Total paid: ${payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      )}

      <ContractWizard
        lead={lead}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={(c) => setContracts((prev) => [c, ...prev])}
      />

      {/* Payment dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField autoFocus fullWidth label="Amount *" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
          <TextField fullWidth select label="Currency" value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}>
            {['USD','EUR','GBP','INR','AUD'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Status" value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
          </TextField>
          {contracts.length > 0 && (
            <TextField fullWidth select label="Linked Contract (optional)" value={payContractId} onChange={(e) => setPayContractId(e.target.value)}>
              <MenuItem value="">None</MenuItem>
              {contracts.map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
            </TextField>
          )}
          <TextField fullWidth label="Notes" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirmOpen} message={confirmMsg} onConfirm={confirmAction} onCancel={() => setConfirmOpen(false)} />
    </Box>
  );
}

// ─── Main LeadDetail ──────────────────────────────────────────────────────────
export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    Promise.all([getLead(id), getPipelines(), getUsers().catch(() => []), getTemplates()])
      .then(([l, p, u, t]) => { setLead(l); setPipelines(p); setUsers(u); setTemplates(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!lead) return <Typography p={3}>Lead not found.</Typography>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/leads')}><ArrowBackIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={700}>{lead.name}</Typography>
          {lead.company && <Typography variant="body2" color="text.secondary">{lead.company}</Typography>}
        </Box>
        <Chip
          label={lead.stage?.name}
          color={lead.stage?.type === 'WON' ? 'success' : lead.stage?.type === 'LOST' ? 'error' : 'primary'}
          size="small"
        />
        <Typography variant="h6" fontWeight={700} color="success.main">${(lead.value || 0).toLocaleString()}</Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Tasks" />
          <Tab label="Documents" />
          <Tab label="Contracts" />
        </Tabs>
      </Box>

      {tab === 0 && <OverviewTab lead={lead} pipelines={pipelines} users={users} onUpdated={setLead} />}
      {tab === 1 && <TasksTab leadId={lead.id} templates={templates} />}
      {tab === 2 && <DocumentsTab leadId={lead.id} />}
      {tab === 3 && <ContractsTab lead={lead} />}
    </Box>
  );
}