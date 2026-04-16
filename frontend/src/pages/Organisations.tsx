import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, Chip, Divider, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Tooltip,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSnackbar } from 'notistack';
import { getOrganisations, createOrganisation, getOrganisation, updateOrganisation } from '../api/users';
import { useAuthStore } from '../store/authStore';
import { Organisation } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Aggregator view ────────────────────────────────────────────────────────

function AggregatorOrganisations() {
  const { enqueueSnackbar } = useSnackbar();
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getOrganisations()
      .then((list) => setOrgs(list as Organisation[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const org = await createOrganisation(newName.trim());
      setOrgs((prev) => [...prev, org].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setDialogOpen(false);
      enqueueSnackbar(`Organisation "${org.name}" created`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to create organisation', { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box maxWidth={800}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Organisations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Organisation
        </Button>
      </Box>

      {orgs.length === 0 ? (
        <Alert severity="info">No organisations found.</Alert>
      ) : (
        <Card>
          <List disablePadding>
            {orgs.map((org, idx) => (
              <Box key={org.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  secondaryAction={
                    <Tooltip title="View details">
                      <IconButton size="small" href={`/organisations/${org.id}`} target="_blank">
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={org.name}
                    secondary={
                      <Chip
                        label={org.id}
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.65rem', mt: 0.5 }}
                      />
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Organisation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Organisation name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setNewName(''); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
          >
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Admin view (existing single-org view) ───────────────────────────────────

function AdminOrganisation() {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [org, setOrg] = useState<Organisation & { _count?: { users: number; pipelines: number; leads: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.orgId) return;
    getOrganisation(user.orgId)
      .then((o) => { setOrg(o as typeof org); setName(o.name); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.orgId]);

  const handleSave = async () => {
    if (!org || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateOrganisation(org.id, name);
      setOrg((prev) => prev ? { ...prev, name: updated.name } : prev);
      if (user) setUser({ ...user, organisation: updated });
      setEditing(false);
      enqueueSnackbar('Organisation updated', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error updating organisation', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!org) return <Alert severity="error">Organisation not found.</Alert>;

  return (
    <Box maxWidth={700}>
      <Typography variant="h5" gutterBottom>Organisation</Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 56, height: 56, borderRadius: 2,
                bgcolor: 'primary.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <BusinessIcon sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>{org.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Created {new Date(org.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Users',     value: (org as { _count?: { users?: number } })._count?.users     ?? '—' },
              { label: 'Pipelines', value: (org as { _count?: { pipelines?: number } })._count?.pipelines ?? '—' },
              { label: 'Leads',     value: (org as { _count?: { leads?: number } })._count?.leads     ?? '—' },
            ].map(({ label, value }) => (
              <Grid item xs={4} key={label}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h5" fontWeight={700}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ mb: 2 }} />

          {editing ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Organisation Name</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small" value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{ flexGrow: 1 }}
                  autoFocus
                />
                <Button variant="contained" onClick={handleSave} disabled={!name.trim() || saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button onClick={() => { setEditing(false); setName(org.name); }}>Cancel</Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body1" fontWeight={500}>{org.name}</Typography>
              </Box>
              <Button variant="outlined" onClick={() => setEditing(true)}>Edit Name</Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Box sx={{ mt: 2 }}>
        <Chip label={`Org ID: ${org.id}`} variant="outlined" size="small" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }} />
      </Box>
    </Box>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function Organisations() {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'AGGREGATOR' ? <AggregatorOrganisations /> : <AdminOrganisation />;
}
