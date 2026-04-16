import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Chip, Avatar, Box, Tooltip } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Lead } from '../../types';
import { useNavigate } from 'react-router-dom';

interface Props { lead: Lead }

export default function KanbanCard({ lead }: Props) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => navigate(`/leads/${lead.id}`)}
      sx={{
        mb: 1,
        cursor: isDragging ? 'grabbing' : 'pointer',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        '&:hover': { boxShadow: 3 },
        userSelect: 'none',
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
          {lead.name}
        </Typography>
        {lead.company && (
          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mb: 1 }}>
            {lead.company}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          {lead.value > 0 ? (
            <Chip
              icon={<AttachMoneyIcon sx={{ fontSize: '14px !important' }} />}
              label={lead.value.toLocaleString()}
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          ) : <Box />}
          {lead.assignedTo && (
            <Tooltip title={lead.assignedTo.name}>
              <Avatar sx={{ width: 22, height: 22, fontSize: 11, bgcolor: 'primary.main' }}>
                {lead.assignedTo.name.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
