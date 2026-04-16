import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Chip,
  Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Paper, Avatar,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getDashboard } from '../api/dashboard';
import { DashboardStats, Lead } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 44, height: 44 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function stageChip(type: string) {
  if (type === 'WON')  return <Chip label="Won"  size="small" color="success" />;
  if (type === 'LOST') return <Chip label="Lost" size="small" color="error" />;
  return <Chip label="Active" size="small" color="primary" variant="outlined" />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return null;

  const maxStageCount = Math.max(...stats.leadsPerStage.map((s) => s.count), 1);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Overview</Typography>

      {/* Stat cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Leads" value={stats.totalLeads} color="primary" icon={<PeopleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Active" value={stats.activeLeads} color="info" icon={<TrendingUpIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Won" value={stats.wonLeads} sub={`$${stats.wonValue.toLocaleString()}`} color="success" icon={<CheckCircleIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Conversion" value={`${stats.conversionRate}%`} color="warning" icon={<CancelIcon />} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Stage breakdown */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Leads by Stage</Typography>
              {stats.leadsPerStage.map((s) => (
                <Box key={s.stage} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{s.stage}</Typography>
                    <Typography variant="body2" fontWeight={600}>{s.count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(s.count / maxStageCount) * 100}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
              {stats.leadsPerStage.length === 0 && (
                <Typography variant="body2" color="text.secondary">No data yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent leads */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: '16px !important' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recent Leads</Typography>
              <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Company</TableCell>
                      <TableCell>Stage</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentLeads.map((lead: Lead) => (
                      <TableRow
                        key={lead.id} hover
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{lead.name}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{lead.company || '—'}</TableCell>
                        <TableCell>{lead.stage ? stageChip(lead.stage.type) : '—'}</TableCell>
                        <TableCell align="right">${(lead.value || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {stats.recentLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>No leads yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
