import { SignJWT, importPKCS8 } from 'npm:jose@5';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface Aviso {
  tipo?: 'mensaje' | 'emergencia';
  user_id?: string;
  excluir_user_id?: string;
  titulo?: string;
  cuerpo?: string;
  url?: string;
}

interface CuentaServicio {
  project_id?: string;
  client_email?: string;
  private_key?: string;
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

async function tokenAcceso(cuenta: CuentaServicio, projectId: string): Promise<string> {
  if (!cuenta.client_email || !cuenta.private_key) {
    throw new Error('El service account no tiene client_email/private_key');
  }

  const llave = await importPKCS8(cuenta.private_key, 'RS256');
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(cuenta.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('50m')
    .sign(llave);

  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`OAuth FCM ${respuesta.status}: ${await respuesta.text()}`);
  }
  const datos = (await respuesta.json()) as { access_token?: string };
  if (!datos.access_token) throw new Error(`OAuth FCM sin access_token (${projectId})`);
  return datos.access_token;
}

async function enviarUno(
  acceso: string,
  projectId: string,
  token: string,
  aviso: Aviso,
): Promise<'ok' | 'invalido' | 'error'> {
  const respuesta = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acceso}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: aviso.titulo, body: aviso.cuerpo },
        data: { url: aviso.url ?? '/tabs/chat' },
        android: { priority: 'high' },
      },
    }),
  });

  if (respuesta.ok) return 'ok';

  const detalle = await respuesta.text();
  console.error('FCM', respuesta.status, detalle);
  return respuesta.status === 404 || detalle.includes('UNREGISTERED') ? 'invalido' : 'error';
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);

    const crudo = Deno.env.get('FCM_SERVICE_ACCOUNT');
    if (!crudo) return responder({ error: 'Falta FCM_SERVICE_ACCOUNT' }, 503);

    let valor: unknown;
    try {
      valor = JSON.parse(crudo);
    } catch {
      return responder({ error: 'FCM_SERVICE_ACCOUNT no es JSON válido' }, 503);
    }

    if (typeof valor === 'string') {
      try {
        valor = JSON.parse(valor);
      } catch {
        return responder({ error: 'FCM_SERVICE_ACCOUNT está entre comillas; pega el JSON sin comillas externas' }, 503);
      }
    }

    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      return responder({ error: 'FCM_SERVICE_ACCOUNT no es un objeto JSON' }, 503);
    }

    const cuenta = valor as CuentaServicio;
    if ('project_info' in cuenta || 'client' in cuenta) {
      return responder(
        {
          error:
            'FCM_SERVICE_ACCOUNT contiene google-services.json. Usa el JSON del service account (Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada).',
        },
        503,
      );
    }

    const projectId = cuenta.project_id;
    if (!projectId || !cuenta.client_email || !cuenta.private_key) {
      return responder(
        {
          error: 'FCM_SERVICE_ACCOUNT incompleto (project_id/client_email/private_key)',
          claves: Object.keys(cuenta),
        },
        503,
      );
    }

    let aviso: Aviso;
    try {
      aviso = (await req.json()) as Aviso;
    } catch {
      return responder({ error: 'JSON inválido' }, 400);
    }
    if (!aviso.titulo || !aviso.cuerpo) return responder({ error: 'Datos incompletos' }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    let consulta = supabase.from('push_tokens').select('token');
    if (aviso.user_id) consulta = consulta.eq('user_id', aviso.user_id);
    if (aviso.excluir_user_id) consulta = consulta.neq('user_id', aviso.excluir_user_id);

    const { data, error } = await consulta;
    if (error) return responder({ error: error.message }, 500);

    const tokens = (data ?? []).map((fila) => fila.token as string);
    if (tokens.length === 0) return responder({ enviados: 0, fallidos: 0 });

    const acceso = await tokenAcceso(cuenta, projectId);
    const resultados = await Promise.all(tokens.map((token) => enviarUno(acceso, projectId, token, aviso)));

    const invalidos = tokens.filter((_, indice) => resultados[indice] === 'invalido');
    if (invalidos.length > 0) {
      await supabase.from('push_tokens').delete().in('token', invalidos);
    }

    return responder({
      enviados: resultados.filter((r) => r === 'ok').length,
      fallidos: resultados.filter((r) => r !== 'ok').length,
    });
  } catch (error) {
    return responder({ error: error instanceof Error ? error.message : 'Error inesperado' }, 500);
  }
});
