import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registroSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefono: z.string().min(6, 'Teléfono inválido').optional().or(z.literal('')),
  cedula: z.string().min(5, 'Cédula inválida'),
  ubicacion: z.string().optional().or(z.literal('')),
  actividad: z.enum(['AVICOLA', 'PORCICOLA', 'MIXTA']).optional(),
});

export const verificacionSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  id: z.string().min(5, 'Identificador inválido'),
});

export const reenviarSchema = z.object({
  email: z.string().email('Correo inválido'),
});

export const recuperacionSchema = z.object({
  email: z.string().email('Correo inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  id: z.string().min(5, 'Identificador inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Indica tu contraseña actual'),
  passwordNueva: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

export const solicitudCreditoSchema = z.object({
  tipo: z.enum(['POLLOS', 'CERDOS'], { errorMap: () => ({ message: 'Tipo debe ser POLLOS o CERDOS' }) }),
  cantidad: z.coerce.number().int('La cantidad debe ser entera').positive('La cantidad debe ser mayor a cero'),
  notas: z.string().max(500).optional(),
});

export const rechazarCreditoSchema = z.object({
  motivo: z.string().min(5, 'Indica el motivo del rechazo').max(500),
});

export const cancelarCreditoSchema = z.object({
  motivo: z.string().min(3, 'Indica el motivo').max(500).optional(),
});

export const pagoSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a cero'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'BINANCE', 'OTRO']).default('EFECTIVO'),
  referencia: z.string().max(120).optional(),
  nota: z.string().max(255).optional(),
});

export const emprendedorSchema = z.object({
  nombre: z.string().min(3, 'El nombre es obligatorio'),
  cedula: z.string().min(5, 'Cédula inválida'),
  email: z.string().email('Correo inválido'),
  telefono: z.string().min(6, 'Teléfono inválido').optional().or(z.literal('')),
  ubicacion: z.string().optional().or(z.literal('')),
  actividad: z.enum(['AVICOLA', 'PORCICOLA', 'MIXTA']).default('AVICOLA'),
  notas: z.string().max(1000).optional().or(z.literal('')),
  password: z.string().min(6).optional(),
  scoreCrediticio: z.coerce.number().int().min(300).max(850).optional(),
});

export const actualizarEmprendedorSchema = emprendedorSchema.partial();

export const estadoEmprendedorSchema = z.object({
  activo: z.coerce.boolean(),
});

export const cryptoSchema = z.object({
  simbolo: z.string().min(2, 'Símbolo inválido').max(10),
  nombre: z.string().optional(),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a cero'),
  precioCompra: z.coerce.number().nonnegative('El precio no puede ser negativo'),
});

export const actualizarCryptoSchema = z.object({
  cantidad: z.coerce.number().positive().optional(),
  precioCompra: z.coerce.number().nonnegative().optional(),
  nombre: z.string().optional(),
});

export const listarCreditosSchema = z.object({
  estado: z.string().optional(),
  tipo: z.enum(['POLLOS', 'CERDOS']).optional(),
  emprendedorId: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
