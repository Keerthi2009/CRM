import { Outlet, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import TopBar from './TopBar';

const titles: Record<string, string> = {
  '/':                'Dashboard',
  '/pipelines':       'Pipelines',
  '/leads':           'Leads',
  '/task-templates':  'Task Templates',
  '/organisations':   'Organisation',
  '/users':           'Users',
};

export default function Layout() {
  const location = useLocation();
  const base = '/' + location.pathname.split('/')[1];
  const title = titles[base] ?? 'CRM';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', ml: `${DRAWER_WIDTH}px` }}>
        <TopBar title={title} />
        <Toolbar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
