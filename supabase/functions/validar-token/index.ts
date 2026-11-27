import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: JSON_HEADERS });
  if (request.method !== 'POST') return new Response(JSON.stringify({ erro: 'Método não permitido' }), { status: 405, headers: JSON_HEADERS });
  try {
    const body = await request.json();
    const codigo = String(body?.codigo ?? '').trim().toLowerCase();
    const tipo = String(body?.tipo ?? '').trim().toLowerCase();
    if (!/^[a-z0-9]{8,64}$/.test(codigo) || !['aluno', 'encarregado'].includes(tipo)) {
      return new Response(JSON.stringify({ erro: 'Convite inválido ou expirado' }), { status: 400, headers: JSON_HEADERS });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const agent = request.headers.get('user-agent') ?? 'unknown';
    const rateKey = await sha256(`${ip}|${agent}|${tipo}`);
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const now = Date.now();
    const windowStart = new Date(now - (now % WINDOW_MS)).toISOString();
    if (Math.random() < 0.02) {
      await admin.from('token_rate_limits').delete().lt('updated_at', new Date(now - 24 * 60 * 60 * 1000).toISOString());
    }
    const { data: current } = await admin.from('token_rate_limits').select('attempts,window_start').eq('rate_key', rateKey).maybeSingle();
    const attempts = current?.window_start === windowStart ? Number(current.attempts ?? 0) : 0;
    if (attempts >= MAX_ATTEMPTS) return new Response(JSON.stringify({ erro: 'Demasiadas tentativas. Tenta novamente mais tarde.' }), { status: 429, headers: JSON_HEADERS });
    await admin.from('token_rate_limits').upsert({ rate_key: rateKey, window_start: windowStart, attempts: attempts + 1, updated_at: new Date().toISOString() });

    const { data, error } = await admin.rpc('validar_token_acesso', { p_codigo: codigo, p_tipo: tipo });
    if (error || !data?.length) return new Response(JSON.stringify({ erro: 'Convite inválido ou expirado' }), { status: 400, headers: JSON_HEADERS });
    return new Response(JSON.stringify({ valido: true, convite: data[0] }), { status: 200, headers: JSON_HEADERS });
  } catch {
    return new Response(JSON.stringify({ erro: 'Não foi possível validar o convite' }), { status: 400, headers: JSON_HEADERS });
  }
});
