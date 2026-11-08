import { asyncHandler, AppError } from '../lib/errors';
import { AuthService } from '../services/auth.service';
import { EmailVerificationService } from '../services/email-verification.service';
import { emailHabilitado } from '../services/email.service';

const meta = (req: { ip?: string; headers: Record<string, unknown> }) => ({
  ip: req.ip,
  dispositivo: String(req.headers['user-agent'] ?? 'desconocido').slice(0, 120),
});

export class AuthController {
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const resultado = await AuthService.login(email, password, meta(req));
    res.json({ ok: true, ...resultado });
  });

  static registrar = asyncHandler(async (req, res) => {
    const resultado = await AuthService.registrarEmprendedor(req.body as never);
    res.status(201).json({ ok: true, ...resultado, smtpConfigurado: emailHabilitado() });
  });

  static refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) throw AppError.badRequest('refreshToken es obligatorio');
    const resultado = await AuthService.refresh(refreshToken);
    res.json({ ok: true, ...resultado });
  });

  static logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    const resultado = await AuthService.logout(refreshToken, req.usuario?.userId);
    res.json({ ok: true, ...resultado });
  });

  static me = asyncHandler(async (req, res) => {
    if (!req.usuario) throw AppError.unauthorized();
    const perfil = await AuthService.perfil(req.usuario.userId);
    res.json({ ok: true, usuario: perfil });
  });

  static verificarEmail = asyncHandler(async (req, res) => {
    const { token, id } = req.body as { token: string; id: string };
    const resultado = await EmailVerificationService.verificar(token, id);
    res.json({ ok: true, ...resultado });
  });

  static reenviarVerificacion = asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const resultado = await EmailVerificationService.reenviar(email);
    res.json({ ok: true, ...resultado });
  });

  static solicitarRecuperacion = asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const resultado = await AuthService.solicitarRecuperacion(email);
    res.json({ ok: true, ...resultado });
  });

  static restablecerPassword = asyncHandler(async (req, res) => {
    const { token, id, password } = req.body as { token: string; id: string; password: string };
    const resultado = await AuthService.restablecerPassword(id, token, password);
    res.json({ ok: true, ...resultado });
  });

  static cambiarPassword = asyncHandler(async (req, res) => {
    const { passwordActual, passwordNueva } = req.body as {
      passwordActual: string;
      passwordNueva: string;
    };
    if (!req.usuario) throw AppError.unauthorized();
    const resultado = await AuthService.cambiarPassword(req.usuario.userId, passwordActual, passwordNueva);
    res.json({ ok: true, ...resultado });
  });
}
