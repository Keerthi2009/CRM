import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress, Alert,
  Avatar, Divider, Tab, Tabs,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import GestureIcon from '@mui/icons-material/Gesture';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import client from '../api/client';

interface SignerInfo {
  role: string;
  name: string;
  email: string;
  signed: boolean;
  signedAt: string | null;
}

interface ContractData {
  contractId: string;
  title: string;
  content: string;
  signer: SignerInfo;
  signerIndex: number;
  orgName: string;
  leadName: string;
  contractStatus: string;
}

// ── Signature Canvas ──────────────────────────────────────────────────────────
function SignaturePad({ onReady }: { onReady: (hasData: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e instanceof TouchEvent) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      lastPos.current = getPos(e, canvas);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;
    };
    const end = () => { drawing.current = false; onReady(true); };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    return () => {
      canvas.removeEventListener('mousedown', start);
      canvas.removeEventListener('mousemove', move);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
    };
  }, [onReady]);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onReady(false);
  };

  return (
    <Box>
      <canvas
        ref={canvasRef}
        width={560}
        height={160}
        style={{
          width: '100%', height: 160, border: '1.5px solid #ccc',
          borderRadius: 6, cursor: 'crosshair', touchAction: 'none', background: '#fff',
          display: 'block',
        }}
      />
      <Button size="small" onClick={clear} sx={{ mt: 0.5, color: 'text.secondary' }}>
        Clear
      </Button>
    </Box>
  );
}

// Return the data URL of the drawn canvas
function getCanvasDataUrl(container: HTMLElement): string | null {
  const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) return null;
  return canvas.toDataURL('image/png');
}

// Convert typed name to a signature image using an offscreen canvas
function typeToDataUrl(name: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 560; canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Underline
  ctx.beginPath();
  ctx.moveTo(24, 98); ctx.lineTo(536, 98);
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1; ctx.stroke();
  // Signature text
  ctx.font = '56px Georgia, "Times New Roman", serif';
  ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, 28, 88, 510);
  return canvas.toDataURL('image/png');
}

// Replace {{signerN.*}} placeholders in HTML with a highlighted "sign here" box
function injectSignHereBox(html: string, signerIndex: number): string {
  const n = signerIndex + 1;
  const placeholder = `{{signer${n}.signature}}`;
  const box = `<span
    id="sign-here-box"
    style="display:inline-flex;align-items:center;gap:6px;padding:8px 18px;
      border:2px dashed #1976d2;border-radius:6px;background:#e3f2fd;
      color:#1565c0;font-weight:600;font-size:14px;cursor:pointer;">
    ✍ Sign Here
  </span>`;
  return html.split(placeholder).join(box);
}

export default function Sign() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const padContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    client.get<ContractData>(`/sign/${token}`)
      .then((r) => {
        setData(r.data);
        setFullName(r.data.signer.name);
        if (r.data.signer.signed) setDone(true);
      })
      .catch((e) => setError(e?.response?.data?.error ?? 'This signing link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const canSign = sigMode === 'draw' ? hasDrawn : fullName.trim().length >= 2;

  const handleSign = async () => {
    if (!canSign) return;
    let signatureData: string;
    if (sigMode === 'draw') {
      signatureData = getCanvasDataUrl(padContainerRef.current!) ?? '';
      if (!signatureData) return;
    } else {
      signatureData = typeToDataUrl(fullName.trim());
    }
    setSubmitting(true);
    try {
      await client.post(`/sign/${token}`, { fullName: fullName.trim(), signatureData });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to submit signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f8' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !data) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f8', p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 480, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>Link Not Found</Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  if (done) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f4f6f8', p: 3 }}>
        <Paper sx={{ p: 5, maxWidth: 480, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>Document Signed!</Typography>
          <Typography color="text.secondary">
            Thank you, <strong>{fullName}</strong>. Your signature has been recorded for:<br />
            <strong>{data?.title}</strong>
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.disabled' }}>
            Sent by {data?.orgName}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const renderedContent = data
    ? injectSignHereBox(data.content || '<p style="color:#999;font-style:italic">No contract content provided.</p>', data.signerIndex ?? 0)
    : '';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 780, mx: 'auto' }}>

        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#1a2035', width: 44, height: 44 }}>
            <DescriptionIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{data?.orgName}</Typography>
            <Typography variant="body2" color="text.secondary">
              has requested your e-signature on: <strong>{data?.title}</strong>
            </Typography>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Contract content */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
            Contract Document
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box
            sx={{ '& *': { fontFamily: 'inherit' }, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        </Paper>

        {/* Signature section */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Your Electronic Signature
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your signature will be embedded at the marked position in the document above.
            By signing, you agree this constitutes your legal electronic signature.
          </Typography>

          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            size="small"
            sx={{ mb: 2, maxWidth: 340 }}
            fullWidth
          />

          <Tabs
            value={sigMode}
            onChange={(_, v) => { setSigMode(v); setHasDrawn(false); }}
            sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab value="draw" icon={<GestureIcon />} iconPosition="start" label="Draw Signature" />
            <Tab value="type" icon={<TextFieldsIcon />} iconPosition="start" label="Type Signature" />
          </Tabs>

          {sigMode === 'draw' ? (
            <Box ref={padContainerRef}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Draw your signature below using mouse or touch:
              </Typography>
              <SignaturePad onReady={setHasDrawn} />
            </Box>
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Your typed signature will be rendered in cursive:
              </Typography>
              <Box
                sx={{
                  width: '100%', maxWidth: 560, height: 120, border: '1.5px solid #ccc',
                  borderRadius: 1, display: 'flex', alignItems: 'center', pl: 3,
                  bgcolor: '#fff', overflow: 'hidden',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Georgia","Times New Roman",serif',
                    fontSize: '2.6rem',
                    color: '#1a1a2e',
                    lineHeight: 1,
                    borderBottom: '1px solid #ddd',
                    pb: 0.5,
                    width: '100%',
                    userSelect: 'none',
                  }}
                >
                  {fullName || <span style={{ color: '#bbb', fontStyle: 'italic', fontSize: '1.2rem' }}>Your name will appear here</span>}
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSign}
              disabled={submitting || !canSign || fullName.trim().length < 2}
              startIcon={submitting ? <CircularProgress size={18} /> : <CheckCircleIcon />}
            >
              {submitting ? 'Signing…' : 'Sign Document'}
            </Button>
            <Typography variant="caption" color="text.secondary">
              Signing as: {data?.signer.email}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
