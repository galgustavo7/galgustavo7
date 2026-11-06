import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditosApi, cryptoApi, dashboardApi, emprendedoresApi, emailsApi, type FiltrosCreditos } from '@/api/endpoints';
import type { MetodoPago, TipoCredito } from '@/types';

const REFRESCO = 60_000;

/* ---------------------------- Dashboard ---------------------------- */

export const useMetricas = () =>
  useQuery({ queryKey: ['metricas'], queryFn: () => dashboardApi.metricas(), refetchInterval: REFRESCO });

export const useSerieMensual = (meses = 6) =>
  useQuery({
    queryKey: ['serie-mensual', meses],
    queryFn: () => dashboardApi.serieMensual(meses),
  });

export const useResumenAdmin = () =>
  useQuery({
    queryKey: ['resumen-admin'],
    queryFn: () => dashboardApi.resumen(),
    refetchInterval: REFRESCO,
  });

export const useMiResumen = () =>
  useQuery({
    queryKey: ['mi-resumen'],
    queryFn: () => dashboardApi.miResumen(),
    refetchInterval: REFRESCO,
  });

/* ----------------------------- Créditos ---------------------------- */

export const useCreditos = (filtros: FiltrosCreditos = {}) =>
  useQuery({
    queryKey: ['creditos', filtros],
    queryFn: () => creditosApi.listar(filtros),
    placeholderData: (previo) => previo,
  });

export const useCredito = (id?: string) =>
  useQuery({
    queryKey: ['credito', id],
    queryFn: () => creditosApi.obtener(id as string),
    enabled: Boolean(id),
  });

export function useAccionesCredito() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['creditos'] });
    void queryClient.invalidateQueries({ queryKey: ['credito'] });
    void queryClient.invalidateQueries({ queryKey: ['metricas'] });
    void queryClient.invalidateQueries({ queryKey: ['resumen-admin'] });
    void queryClient.invalidateQueries({ queryKey: ['mi-resumen'] });
    void queryClient.invalidateQueries({ queryKey: ['emprendedores'] });
  };

  const solicitar = useMutation({
    mutationFn: (payload: { tipo: TipoCredito; cantidad: number; notas?: string }) =>
      creditosApi.solicitar(payload),
    onSuccess: invalidar,
  });

  const aprobar = useMutation({ mutationFn: (id: string) => creditosApi.aprobar(id), onSuccess: invalidar });
  const rechazar = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => creditosApi.rechazar(id, motivo),
    onSuccess: invalidar,
  });
  const entregar = useMutation({ mutationFn: (id: string) => creditosApi.entregar(id), onSuccess: invalidar });
  const cancelar = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => creditosApi.cancelar(id, motivo),
    onSuccess: invalidar,
  });
  const pagar = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { monto: number; metodoPago: MetodoPago; referencia?: string; nota?: string };
    }) => creditosApi.pagar(id, payload),
    onSuccess: invalidar,
  });

  return { solicitar, aprobar, rechazar, entregar, cancelar, pagar, invalidar };
}

/* -------------------------- Emprendedores -------------------------- */

export const useEmprendedores = (filtros: { q?: string; actividad?: string } = {}) =>
  useQuery({
    queryKey: ['emprendedores', filtros],
    queryFn: () => emprendedoresApi.listar(filtros),
    placeholderData: (previo) => previo,
  });

export const useEmprendedor = (id?: string) =>
  useQuery({
    queryKey: ['emprendedor', id],
    queryFn: () => emprendedoresApi.obtener(id as string),
    enabled: Boolean(id),
  });

export function useAccionesEmprendedor() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['emprendedores'] });
    void queryClient.invalidateQueries({ queryKey: ['emprendedor'] });
    void queryClient.invalidateQueries({ queryKey: ['metricas'] });
  };

  const crear = useMutation({
    mutationFn: (payload: Parameters<typeof emprendedoresApi.crear>[0]) =>
      emprendedoresApi.crear(payload),
    onSuccess: invalidar,
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      emprendedoresApi.cambiarEstado(id, activo),
    onSuccess: invalidar,
  });

  const recalcularScore = useMutation({
    mutationFn: (id: string) => emprendedoresApi.recalcularScore(id),
    onSuccess: invalidar,
  });

  return { crear, cambiarEstado, recalcularScore, invalidar };
}

/* ------------------------------ Crypto ----------------------------- */

export const useCarteraCrypto = () =>
  useQuery({
    queryKey: ['crypto'],
    queryFn: () => cryptoApi.cartera(),
    refetchInterval: 120_000,
  });

export function useAccionesCrypto() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['crypto'] });
    void queryClient.invalidateQueries({ queryKey: ['metricas'] });
  };

  const agregar = useMutation({
    mutationFn: (payload: Parameters<typeof cryptoApi.agregar>[0]) => cryptoApi.agregar(payload),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({ mutationFn: (id: string) => cryptoApi.eliminar(id), onSuccess: invalidar });

  return { agregar, eliminar };
}

/* ------------------------------ Correos ---------------------------- */

export const useEmails = (limite = 50) =>
  useQuery({ queryKey: ['emails', limite], queryFn: () => emailsApi.listar(limite), refetchInterval: 30_000 });
