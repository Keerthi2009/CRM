import { NavLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Divider, Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import { useAuthStore } from '../../store/authStore';

export const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard',       path: '/',               icon: <DashboardIcon />,   roles: ['ADMIN','MANAGER','SALES_REP'] },
  { label: 'Pipelines',       path: '/pipelines',      icon: <AccountTreeIcon />, roles: ['ADMIN','MANAGER'] },
  { label: 'Leads',           path: '/leads',          icon: <PeopleIcon />,      roles: ['ADMIN','MANAGER','SALES_REP'] },
  { label: 'Task Templates',      path: '/task-templates',      icon: <AssignmentIcon />,  roles: ['ADMIN','MANAGER'] },
  { label: 'Contract Templates',  path: '/contract-templates',  icon: <DescriptionIcon />, roles: ['ADMIN','MANAGER'] },
  { label: 'Organisations',   path: '/organisations',  icon: <BusinessIcon />,    roles: ['AGGREGATOR','ADMIN'] },
  { label: 'Users',           path: '/users',          icon: <GroupIcon />,       roles: ['AGGREGATOR','ADMIN'] },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const visible = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#1a2035',
          color: '#fff',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar sx={{ px: 2, py: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 16 }}>C</Avatar>
          <Typography variant="h6" sx={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
            CRM
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ px: 1, pt: 1 }}>
        {visible.map((item) => {
          const isActive =
            item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                  bgcolor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
                  py: 1,
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.2 }} noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
