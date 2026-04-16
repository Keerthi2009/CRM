import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Lead, PipelineStage } from '../../types';
import KanbanCard from './KanbanCard';
import { moveStage } from '../../api/leads';
import { useSnackbar } from 'notistack';

interface ColumnProps {
  stage: PipelineStage;
  leads: Lead[];
}

function KanbanColumn({ stage, leads }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const stageColor = stage.type === 'WON' ? '#2e7d32' : stage.type === 'LOST' ? '#c62828' : '#1565c0';

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        width: 260,
        flexShrink: 0,
        bgcolor: isOver ? 'rgba(25,118,210,0.05)' : '#f8f9fa',
        border: '1px solid',
        borderColor: isOver ? 'primary.main' : 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 200px)',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Column Header */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stageColor }} />
            <Typography variant="subtitle2" fontWeight={600} fontSize="0.8rem">
              {stage.name}
            </Typography>
          </Box>
          <Chip label={leads.length} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(0,0,0,0.06)' }} />
        </Box>
      </Box>

      {/* Cards */}
      <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1 }}>
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 3 }}>
            Drop leads here
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

interface Props {
  stages: PipelineStage[];
  leads: Lead[];
  onLeadMoved: (leadId: string, stageId: string) => void;
}

export default function KanbanBoard({ stages, leads, onLeadMoved }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const leadsByStage = (stageId: string) => leads.filter((l) => l.stageId === stageId);
  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const lead = leads.find((l) => l.id === active.id);
    if (!lead) return;

    // Determine destination stage
    let destStageId: string | null = null;
    if (stages.some((s) => s.id === over.id)) {
      destStageId = String(over.id);
    } else {
      const overLead = leads.find((l) => l.id === over.id);
      if (overLead) destStageId = overLead.stageId;
    }

    if (!destStageId || destStageId === lead.stageId) return;

    try {
      await moveStage(lead.id, destStageId);
      onLeadMoved(lead.id, destStageId);
    } catch {
      enqueueSnackbar('Failed to move lead', { variant: 'error' });
    }
  };

  const handleDragOver = (_event: DragOverEvent) => {};

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
        {stages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage} leads={leadsByStage(stage.id)} />
        ))}
      </Box>
      <DragOverlay>
        {activeLead && <KanbanCard lead={activeLead} />}
      </DragOverlay>
    </DndContext>
  );
}
