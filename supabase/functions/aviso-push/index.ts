import { createClient } from 'npm:@supabase/supabase-js@2';
import admin from 'npm:firebase-admin@13';

interface Aviso {
  tipo?: 'mensaje' | 'emergencia';
  user_id?: string;
  excluir_user_id?: string;
  titulo?: string;
  cuerpo?: string;
  url?: string;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

  const credenciales = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!credenciales) return responder({ error: 'Falta FCM_SERVICE_ACCOUNT' }, 503);

  let aviso: Aviso;
  try {
    aviso = (await req.json()) as Aviso;
  } catch {
    return responder({ error: 'JSON inválido' }, 400);
  }
  if (!aviso.titulo || !aviso.cuerpo) return responder({ error: 'Datos incompletos' }, 400);

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(credenciales)) });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  let consulta = supabase.from('push_tokens').select('token');
  if (aviso.user_id) consulta = consulta.eq('user_id', aviso.user_id);
  if (aviso.excluir_user_id) consulta = consulta.neq('user_id', aviso.excluir_user_id);

  const { data, error } = await consulta;
  if (error) return responder({ error: error.message }, 500);

  const tokens = (data ?? []).map((fila) => fila.token as string);
  if (tokens.length === 0) return responder({ enviados: 0, fallidos: 0 });

  const resultado = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: aviso.titulo, body: aviso.cuerpo },
    data: { url: aviso.url ?? '/tabs/chat' },
    android: { priority: 'high' },
  });

  const invalidos = resultado.responses
    .map((respuesta, indice) =>
      !respuesta.success && respuesta.error?.code === 'messaging/registration-token-not-registered'
        ? tokens[indice]
        : null,
    )
    .filter((token): token is string => Boolean(token));

  if (invalidos.length > 0) {
    await supabase.from('push_tokens').delete().in('token', invalidos);
  }

  return responder({ enviados: resultado.successCount, fallidos: resultado.failureCount });
});
