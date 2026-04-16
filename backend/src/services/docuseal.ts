import https from 'https';
import http from 'http';

export interface DocusealSigner {
  role: string;   // e.g. "Signer 1"
  name: string;
  email: string;
}

export interface DocusealSubmission {
  submissionId: string;
  signers: Array<{ role: string; email: string; url: string }>;
}

interface DocusealWebhookPayload {
  event: string;
  data: { id: number; status: string; [key: string]: unknown };
}

function apiRequest(path: string, method: string, bodyStr: string): Promise<unknown> {
  const apiKey = process.env.DOCUSEAL_API_KEY!;
  const baseUrl = process.env.DOCUSEAL_BASE_URL || 'https://api.docuseal.com';
  const url = new URL(`${baseUrl}${path}`);
  const lib = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': apiKey,
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => {
          if (data.trimStart().startsWith('<')) {
            reject(new Error(`DocuSeal API ${res.statusCode}: returned HTML instead of JSON (invalid API key or wrong URL)`));
            return;
          }
          try {
            const json = JSON.parse(data);
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`DocuSeal API ${res.statusCode}: ${JSON.stringify(json)}`));
            } else { resolve(json); }
          } catch (e) { reject(e); }
        });
      },
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

export async function createSubmission(
  contractTitle: string,
  signers: DocusealSigner[],
  htmlContent?: string,
): Promise<DocusealSubmission> {
  const apiKey = process.env.DOCUSEAL_API_KEY;

  if (!apiKey) {
    console.warn('[DocuSeal] No API key — returning stub');
    return {
      submissionId: `stub_${Date.now()}`,
      signers: signers.map((s) => ({
        role: s.role,
        email: s.email,
        url: `https://docuseal.com/sign/stub_${Date.now()}`,
      })),
    };
  }

  try {
    // Create a DocuSeal template from HTML if content is provided
    let templateId: number | null = null;
    if (htmlContent) {
      const tmpl = await apiRequest('/api/v1/templates/html', 'POST', JSON.stringify({
        name: contractTitle,
        html: htmlContent,
      })) as { id: number };
      templateId = tmpl.id;
    }

    const result = await apiRequest('/api/v1/submissions', 'POST', JSON.stringify({
      template_id: templateId,
      send_email: true,
      submitters: signers.map((s) => ({ role: s.role, name: s.name, email: s.email })),
      message: {
        subject: `Please sign: ${contractTitle}`,
        body: `You have been requested to sign "${contractTitle}". Please review and sign.`,
      },
    })) as {
      id: number;
      submitters?: Array<{ role: string; email: string; embed_src?: string; url?: string }>;
    };

    return {
      submissionId: String(result.id),
      signers: (result.submitters ?? []).map((sub) => ({
        role: sub.role,
        email: sub.email,
        url: sub.embed_src ?? sub.url ?? '',
      })),
    };
  } catch (err) {
    console.warn('[DocuSeal] API call failed, returning stub:', (err as Error).message);
    return {
      submissionId: `stub_${Date.now()}`,
      signers: signers.map((s) => ({
        role: s.role,
        email: s.email,
        url: `https://docuseal.com/sign/stub_${Date.now()}`,
      })),
    };
  }
}

export function parseWebhookPayload(body: unknown): DocusealWebhookPayload {
  return body as DocusealWebhookPayload;
}
