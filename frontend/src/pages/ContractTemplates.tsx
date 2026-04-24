import { useEffect, useRef, useState } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, MenuItem, Divider, Alert,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import JoditEditor from 'jodit-react';
import { useSnackbar } from 'notistack';
import {
  getContractTemplates, createContractTemplate,
  updateContractTemplate, deleteContractTemplate, getContractTemplate,
} from '../api/contractTemplates';
import { ContractTemplate } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';

// ─── Placeholder groups ───────────────────────────────────────────────────────
const LEAD_PLACEHOLDERS = [
  { label: 'Lead Name',    token: '{{lead.name}}' },
  { label: 'Lead Email',   token: '{{lead.email}}' },
  { label: 'Lead Phone',   token: '{{lead.phone}}' },
  { label: 'Lead Company', token: '{{lead.company}}' },
  { label: 'Lead Address', token: '{{lead.address}}' },
  { label: 'Lead Value',   token: '{{lead.value}}' },
];

function signerPlaceholders(n: number) {
  return [
    { label: `Signer ${n} Name`,       token: `{{signer${n}.name}}` },
    { label: `Signer ${n} Email`,      token: `{{signer${n}.email}}` },
    { label: `Signer ${n} Signature`,  token: `{{signer${n}.signature}}` },
    { label: `Signer ${n} Initials`,   token: `{{signer${n}.initials}}` },
    { label: `Signer ${n} Date`,       token: `{{signer${n}.date}}` },
  ];
}

// ─── Jodit config ─────────────────────────────────────────────────────────────
const joditConfig = {
  height: 500,
  toolbarAdaptive: false,
  buttons: [
    'bold', 'italic', 'underline', 'strikethrough', '|',
    'font', 'fontsize', 'brush', '|',
    'align', 'outdent', 'indent', '|',
    'ul', 'ol', '|',
    'table', 'hr', '|',
    'undo', 'redo', '|',
    'fullsize',
  ],
};

// ─── Template Editor Dialog ───────────────────────────────────────────────────
function TemplateEditorDialog({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: ContractTemplate | null;
  onClose: () => void;
  onSaved: (t: ContractTemplate) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const [name, setName]             = useState('');
  const [signerCount, setSignerCount] = useState(1);
  const [content, setContent]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setSignerCount(initial.signerCount);
        setContent(initial.content);
      } else {
        setName(''); setSignerCount(1);
        setContent('<p>Dear {{lead.name}},</p><p>This agreement is made between {{lead.company}} and the undersigned parties.</p>');
      }
      setError('');
    }
  }, [open, initial]);

  const insertPlaceholder = (token: string) => {
    // Insert at current cursor position via Jodit's internal value
    setContent((prev) => prev + ` ${token} `);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    enqueueSnackbar(`Copied ${token}`, { variant: 'info', autoHideDuration: 1500 });
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Template name is required.'); return; }
    if (!content.trim()) { setError('Content cannot be empty.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), content, signerCount };
      const saved = initial
        ? await updateContractTemplate(initial.id, payload)
        : await createContractTemplate(payload);
      onSaved(saved);
      enqueueSnackbar(`Template "${saved.name}" ${initial ? 'updated' : 'created'}`, { variant: 'success' });
      onClose();
    } catch {
      setError('Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const allSignerTokens = Array.from({ length: signerCount }, (_, i) => signerPlaceholders(i + 1));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>{initial ? 'Edit Template' : 'New Contract Template'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 2, pt: '12px !important', overflow: 'hidden' }}>
        {/* Left: placeholder panel */}
        <Box sx={{ width: 260, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid', borderColor: 'divider', pr: 1.5 }}>
          <TextField
            select label="Number of Signers" size="small" fullWidth
            value={signerCount}
            onChange={(e) => setSignerCount(Number(e.target.value))}
            sx={{ mb: 2 }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <MenuItem key={n} value={n}>{n} signer{n > 1 ? 's' : ''}</MenuItem>
            ))}
          </TextField>

          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Lead Fields
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            {LEAD_PLACEHOLDERS.map((p) => (
              <Box key={p.token} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Button
                  size="small" variant="outlined" fullWidth
                  sx={{ justifyContent: 'flex-start', fontSize: '0.72rem', textTransform: 'none', py: 0.3 }}
                  onClick={() => insertPlaceholder(p.token)}
                >
                  {p.label}
                </Button>
                <Tooltip title="Copy token">
                  <IconButton size="small" onClick={() => copyToken(p.token)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>

          {allSignerTokens.map((tokens, idx) => (
            <Accordion key={idx} disableGutters defaultExpanded={idx === 0} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0, minHeight: 36 }}>
                <Typography variant="caption" fontWeight={600}>Signer {idx + 1}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0.5, pb: 1 }}>
                {tokens.map((p) => (
                  <Box key={p.token} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <Button
                      size="small" variant="outlined" fullWidth
                      sx={{ justifyContent: 'flex-start', fontSize: '0.72rem', textTransform: 'none', py: 0.3 }}
                      onClick={() => insertPlaceholder(p.token)}
                    >
                      {p.label}
                    </Button>
                    <Tooltip title="Copy token">
                      <IconButton size="small" onClick={() => copyToken(p.token)}><ContentCopyIcon sx={{ fontSize: 14 }} /></IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Right: editor */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'auto' }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            fullWidth label="Template Name *" size="small"
            value={name} onChange={(e) => setName(e.target.value)}
          />
          <JoditEditor
            ref={editorRef}
            value={content}
            config={joditConfig}
            onBlur={(val) => setContent(val)}
          />
          <Typography variant="caption" color="text.secondary">
            Click a placeholder on the left to insert it, or copy and paste it manually into the editor.
            Signature/initials/date tokens are rendered as signing fields when sent via DocuSeal.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ContractTemplates() {
  const { enqueueSnackbar } = useSnackbar();

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing]     = useState<ContractTemplate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId]   = useState('');

  useEffect(() => {
    getContractTemplates()
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openNew  = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = async (t: ContractTemplate) => {
    // Load full content (list endpoint omits content for brevity)
    const full = await getContractTemplate(t.id);
    setEditing(full); setEditorOpen(true);
  };

  const handleSaved = (t: ContractTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = t; return next; }
      return [t, ...prev];
    });
  };

  const handleDelete = async () => {
    try {
      await deleteContractTemplate(deletingId);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingId));
      enqueueSnackbar('Template deleted', { variant: 'success' });
    } catch { enqueueSnackbar('Error deleting template', { variant: 'error' }); }
    setConfirmOpen(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5">Contract Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Create reusable templates with lead & signer placeholders
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>New Template</Button>
      </Box>

      {templates.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>No contract templates yet.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Create First Template</Button>
        </Paper>
      ) : (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Signers</TableCell>
                <TableCell>Created</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{t.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${t.signerCount} signer${t.signerCount > 1 ? 's' : ''}`} size="small" />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(t)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => { setDeletingId(t.id); setConfirmOpen(true); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <TemplateEditorDialog
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={confirmOpen}
        message="Delete this template? Existing contracts using it will not be affected."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
