import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, MenuItem, Avatar,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useSnackbar } from 'notistack';
import { register } from '../../api/auth';
import { getOrganisations } from '../../api/users';
import { Organisation } from '../../types';

export default function Register() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', orgId: '', role: 'SALES_REP' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrganisations().then(setOrgs).catch(() => {});
  }, []);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      enqueueSnackbar('Account created. Please sign in.', { variant: 'success' });
      navigate('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 440, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', mb: 1 }}><PersonAddIcon /></Avatar>
            <Typography variant="h5">Create Account</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={handleChange('name')} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Password" type="password" value={form.password} onChange={handleChange('password')} sx={{ mb: 2 }} required inputProps={{ minLength: 6 }} />
            <TextField fullWidth select label="Organisation" value={form.orgId} onChange={handleChange('orgId')} sx={{ mb: 2 }} required>
              {orgs.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
            </TextField>
            <TextField fullWidth select label="Role" value={form.role} onChange={handleChange('role')} sx={{ mb: 3 }}>
              <MenuItem value="SALES_REP">Sales Rep</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
            </TextField>
            <Button fullWidth variant="contained" type="submit" disabled={loading} size="large">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <RouterLink to="/login" style={{ color: 'inherit', fontWeight: 600 }}>Sign in</RouterLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
