import { useEffect, useState } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Avatar, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, FormControl, InputLabel, Select,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { getUsers, createUser, updateUser, deleteUser, getOrganisations } from '../api/users';
import { User, Organisation } from '../types';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

const roleColors: Record<string, 'error' | 'warning' | 'default' | 'secondary'> = {
  AGGREGATOR: 'secondary', ADMIN: 'error', MANAGER: 'warning', SALES_REP: 'default',
};
const roleLabel: Record<string, string> = {
  AGGREGATOR: 'Aggregator', ADMIN: 'Admin', MANAGER: 'Manager', SALES_REP: 'Sales Rep',
};

interface UserFormState {
  name: string; email: string; password: string; role: string; orgId: string;
}

export default function Users() {
  const { enqueueSnackbar } = useSnackbar();
  const currentUser = useAuthStore((s) => s.user);
  const isAggregator = currentUser?.role === 'AGGREGATOR';

  const [users, setUsers]         = useState<User[]>([]);
  const [orgs, setOrgs]           = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading]     = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [form, setForm]             = useState<UserFormState>({ name: '', email: '', password: '', role: 'SALES_REP', orgId: '' });
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId]   = useState('');

  // Load org list for aggregator
  useEffect(() => {
    if (!isAggregator) return;
    getOrganisations().then((list) => {
      setOrgs(list as Organisation[]);
    }).catch(console.error);
  }, [isAggregator]);

  const loadUsers = (orgId?: string) => {
    setLoading(true);
    getUsers(orgId)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAggregator) {
      // Wait until user picks an org
      setLoading(false);
    } else {
      loadUsers();
    }
  }, [isAggregator]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    loadUsers(orgId);
  };

  const set = (f: keyof UserFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const openNew = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'SALES_REP', orgId: selectedOrgId });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, orgId: u.orgId });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name || !form.email || (!editUser && !form.password)) {
      setFormError('Name, email and password are required.');
      return;
    }
    if (isAggregator && !editUser && !form.orgId) {
      setFormError('Please select an organisation.');
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) };
        const updated = await updateUser(editUser.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        enqueueSnackbar('User updated', { variant: 'success' });
      } else {
        const payload = { name: form.name, email: form.email, password: form.password, role: form.role, ...(isAggregator ? { orgId: form.orgId } : {}) };
        const created = await createUser(payload);
        // Only add to list if matches current filter
        if (!isAggregator || created.orgId === selectedOrgId) {
          setUsers((prev) => [...prev, created]);
        }
        enqueueSnackbar('User created', { variant: 'success' });
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error saving user';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deletingId);
      setUsers((prev) => prev.filter((u) => u.id !== deletingId));
      enqueueSnackbar('User deleted', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error deleting user', { variant: 'error' });
    }
    setConfirmOpen(false);
  };

  const selectedOrgName = orgs.find((o) => o.id === selectedOrgId)?.name ?? '';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Users</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openNew}
          disabled={isAggregator && !selectedOrgId}
        >
          New User
        </Button>
      </Box>

      {/* Aggregator: org selector */}
      {isAggregator && (
        <FormControl size="small" sx={{ mb: 3, minWidth: 280 }}>
          <InputLabel>Filter by Organisation</InputLabel>
          <Select
            value={selectedOrgId}
            label="Filter by Organisation"
            onChange={(e) => handleOrgChange(e.target.value)}
          >
            {orgs.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : isAggregator && !selectedOrgId ? (
        <Alert severity="info">Select an organisation above to view and manage its users.</Alert>
      ) : users.length === 0 ? (
        <EmptyState
          message={isAggregator ? `No users in ${selectedOrgName}` : 'No users found'}
          actionLabel="Add User"
          onAction={openNew}
        />
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                {isAggregator && <TableCell>Organisation</TableCell>}
                <TableCell>Joined</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                        {u.id === currentUser?.id && (
                          <Typography variant="caption" color="primary">You</Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={roleLabel[u.role] ?? u.role} size="small" color={roleColors[u.role] ?? 'default'} />
                  </TableCell>
                  {isAggregator && (
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {orgs.find((o) => o.id === u.orgId)?.name ?? u.orgId}
                    </TableCell>
                  )}
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {u.id !== currentUser?.id && (
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => { setDeletingId(u.id); setConfirmOpen(true); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* User dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editUser ? 'Edit User' : 'New User'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Org selector — only for Aggregator creating a new user */}
          {isAggregator && !editUser && (
            <TextField
              fullWidth select label="Organisation *"
              value={form.orgId}
              onChange={set('orgId')}
            >
              {orgs.map((o) => (
                <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
              ))}
            </TextField>
          )}

          <TextField autoFocus fullWidth label="Full Name *" value={form.name} onChange={set('name')} />
          <TextField fullWidth label="Email *" type="email" value={form.email} onChange={set('email')} />
          <TextField
            fullWidth label={editUser ? 'New Password (leave blank to keep)' : 'Password *'}
            type="password" value={form.password} onChange={set('password')}
            inputProps={{ minLength: 6 }}
          />
          <TextField fullWidth select label="Role" value={form.role} onChange={set('role')}>
            <MenuItem value="SALES_REP">Sales Rep</MenuItem>
            <MenuItem value="MANAGER">Manager</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen} message="Delete this user? This cannot be undone."
        onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
