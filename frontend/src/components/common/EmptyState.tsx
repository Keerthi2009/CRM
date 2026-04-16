import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface Props {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message = 'No data yet', actionLabel, onAction }: Props) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
      <InboxIcon sx={{ fontSize: 56, mb: 1, opacity: 0.3 }} />
      <Typography variant="body1" sx={{ mb: 2 }}>{message}</Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
      )}
    </Box>
  );
}
