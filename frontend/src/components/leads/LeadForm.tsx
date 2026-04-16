import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, InputAdornment, CircularProgress,
} from '@mui/material';
import { Lead, Pipeline, User } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  pipelines: Pipeline[];
  users: User[];
  initial?: Partial<Lead>;
  title?: string;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  lat?: number;
  lng?: number;
  value: number;
  pipelineId: string;
  stageId: string;
  assignedToId: string;
}

export default function LeadForm({ open, onClose, onSubmit, pipelines, users, initial, title = 'New Lead' }: Props) {
  const [form, setForm] = useState<LeadFormData>({
    name: '', email: '', phone: '', company: '', address: '',
    value: 0, pipelineId: '', stageId: '', assignedToId: '',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        phone: initial?.phone ?? '',
        company: initial?.company ?? '',
        address: initial?.address ?? '',
        lat: initial?.lat,
        lng: initial?.lng,
        value: initial?.value ?? 0,
        pipelineId: initial?.pipelineId ?? (pipelines[0]?.id ?? ''),
        stageId: initial?.stageId ?? '',
        assignedToId: initial?.assignedToId ?? '',
      });
    }
  }, [open, initial, pipelines]);

  const selectedPipeline = pipelines.find((p) => p.id === form.pipelineId);

  const set = (field: keyof LeadFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const geocodeAddress = async () => {
    if (!form.address) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      if (data[0]) {
        setForm((p) => ({ ...p, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Name *" value={form.name} onChange={set('name')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone" value={form.phone} onChange={set('phone')} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Company" value={form.company} onChange={set('company')} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Address" value={form.address} onChange={set('address')}
              onBlur={geocodeAddress}
              helperText={geocoding ? 'Geocoding...' : form.lat ? `📍 ${form.lat?.toFixed(4)}, ${form.lng?.toFixed(4)}` : 'Blur to geocode'}
              InputProps={{ endAdornment: geocoding ? <CircularProgress size={18} /> : null }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth select label="Pipeline *" value={form.pipelineId}
              onChange={(e) => setForm((p) => ({ ...p, pipelineId: e.target.value, stageId: '' }))}
            >
              {pipelines.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth select label="Stage *" value={form.stageId}
              onChange={(e) => setForm((p) => ({ ...p, stageId: e.target.value }))}
              disabled={!selectedPipeline}
            >
              {(selectedPipeline?.stages ?? []).map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Value" type="number" value={form.value}
              onChange={set('value')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="Assigned To" value={form.assignedToId} onChange={set('assignedToId')}>
              <MenuItem value="">Unassigned</MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!form.name || !form.pipelineId || !form.stageId || loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
