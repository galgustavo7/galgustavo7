/**
 * Prueba de humo end-to-end: levanta la API en un puerto temporal y ejecuta
 * los flujos principales (registro, verificación, login, crédito, aprobación, pago).
 *
 * Uso: npm run smoke
 */
import { createApp } from '../app';
import { connectDatabases, closeDatabases, db } from '../db';
import { logger } from '../lib/logger';

const PORT = Number(process.env.SMOKE_PORT ?? 4321);
const BASE = `http://127.0.0.1:${PORT}`;

interface Resumen {
  nombre: string;
  ok: boolean;
  detalle: string;
}

const resultados: Resumen[] = [];

function check(nombre: string, ok: boolean, detalle = ''): void {
  resultados.push({ nombre, ok, detalle });
  console.log(`${ok ? '✅' : '❌'} ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: response.status, body };
}

async function main(): Promise<void> {
  await connectDatabases({ migrate: true });

  const app = createApp();
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // 1. Salud
    const salud = await api('/api/health');
    check('GET /api/health', salud.status === 200, `base=${String(salud.body?.baseDatos)}`);

    // 2. Login admin
    const login = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@polloskeny.com', password: 'AdminKeny2026!' }),
    });
    const adminToken = (login.body as { accessToken?: string }).accessToken ?? '';
    check('POST /api/auth/login (admin)', login.status === 200 && Boolean(adminToken), `status=${login.status}`);
    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Métricas
    const metricas = await api('/api/dashboard/metricas', { headers: authHeaders });
    const m = (metricas.body as { metricas?: Record<string, number> }).metricas ?? {};
    check('GET /api/dashboard/metricas', metricas.status === 200, `prestado=${m.totalPrestado ?? 0}`);

    // 4. Registro de emprendedor
    const email = `test${Date.now()}@polloskeny.test`;
    const registro = await api('/api/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Emprendedor Prueba',
        email,
        password: 'Prueba2026!',
        cedula: `V-${Date.now()}`,
        telefono: '+58 412-0001111',
        ubicacion: 'Barquisimeto',
        actividad: 'AVICOLA',
      }),
    });
    check('POST /api/auth/registro', registro.status === 201, `status=${registro.status}`);

    // 5. Verificación de correo (token simulado en storage/emails)
    const usuario = await db.get<{ id: string; token_verificacion: string }>(
      'SELECT id, token_verificacion FROM usuarios WHERE email = ?',
      [email]
    );
    if (!usuario) throw new Error('No se creó el usuario de prueba');

    const fila = await db.get<{ preview_path: string | null }>(
      'SELECT preview_path FROM email_logs WHERE destinatario = ? ORDER BY creado_en DESC LIMIT 1',
      [email]
    );
    check('Correo de verificación registrado', Boolean(fila?.preview_path), fila?.preview_path ?? 'sin preview');

    // 6. Login de emprendedor (debe exigir verificación)
    const loginSinVerificar = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'Prueba2026!' }),
    });
    const codigo = (loginSinVerificar.body as { error?: { codigo?: string } }).error?.codigo;
    check(
      'Login de emprendedor sin verificar es rechazado',
      loginSinVerificar.status === 403 && codigo === 'EMAIL_NO_VERIFICADO',
      `status=${loginSinVerificar.status}`
    );

    // 7. Solicitar crédito como emprendedor verificado (se usa uno del seed)
    const emp = await db.get<{ id: string; email: string }>(
      'SELECT id, email FROM emprendedores ORDER BY fecha_registro ASC LIMIT 1'
    );
    const loginEmp = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emp?.email, password: 'Emprendedor2026!' }),
    });
    const tokenEmp = (loginEmp.body as { accessToken?: string }).accessToken ?? '';
    check('POST /api/auth/login (emprendedor)', Boolean(tokenEmp), `status=${loginEmp.status}`);

    const solicitud = await api('/api/creditos/solicitar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ tipo: 'POLLOS', cantidad: 120 }),
    });
    const creditoId = (solicitud.body as { credito?: { id?: string } }).credito?.id ?? '';
    check('POST /api/creditos/solicitar', solicitud.status === 201 && Boolean(creditoId), `id=${creditoId.slice(0, 8)}`);

    // 8. Aprobar crédito (admin) -> genera factura PDF
    const aprobacion = await api(`/api/creditos/${creditoId}/aprobar`, {
      method: 'POST',
      headers: authHeaders,
    });
    const facturaNumero = (aprobacion.body as { credito?: { facturaNumero?: string } }).credito?.facturaNumero ?? '';
    check('POST /api/creditos/:id/aprobar', aprobacion.status === 200 && Boolean(facturaNumero), facturaNumero);

    // 9. Registrar pago parcial
    const pago = await api(`/api/creditos/${creditoId}/pagos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEmp}` },
      body: JSON.stringify({ monto: 100, metodoPago: 'EFECTIVO', referencia: 'SMOKE-001' }),
    });
    const saldo = (pago.body as { saldoPendiente?: number }).saldoPendiente;
    check('POST /api/creditos/:id/pagos', pago.status === 201, `saldo=${saldo}`);

    // 10. Descargar factura
    const facturaResp = await fetch(`${BASE}/api/creditos/${creditoId}/factura`, { headers: authHeaders });
    const pdf = Buffer.from(await facturaResp.arrayBuffer());
    check(
      'GET /api/creditos/:id/factura (PDF)',
      facturaResp.status === 200 && pdf.subarray(0, 4).toString() === '%PDF',
      `${pdf.length} bytes`
    );

    // 11. Cartera crypto
    const crypto = await api('/api/crypto/cartera', { headers: authHeaders });
    const resumen = (crypto.body as { resumen?: { valorTotal?: number } }).resumen;
    check('GET /api/crypto/cartera', crypto.status === 200, `valorTotal=${resumen?.valorTotal ?? 0}`);

    // 12. Listados
    const creditos = await api('/api/creditos?limit=5', { headers: authHeaders });
    const emprendedores = await api('/api/emprendedores', { headers: authHeaders });
    check('GET /api/creditos', creditos.status === 200, `total=${(creditos.body as { meta?: { total?: number } }).meta?.total}`);
    check('GET /api/emprendedores', emprendedores.status === 200, `total=${(emprendedores.body as { total?: number }).total}`);
  } finally {
    server.close();
    await closeDatabases();
  }

  const fallidas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallidas.length}/${resultados.length} comprobaciones correctas`);
  if (fallidas.length) {
    logger.error(`Pruebas fallidas: ${fallidas.map((f) => f.nombre).join(', ')}`);
    process.exit(1);
  }
  logger.ok('Prueba de humo completada correctamente');
  process.exit(0);
}

main().catch((error) => {
  logger.error('Error en la prueba de humo', error);
  process.exit(1);
});
