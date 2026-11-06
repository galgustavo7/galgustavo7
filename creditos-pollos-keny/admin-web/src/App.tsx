import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { EmprendedorLayout } from '@/components/layout/EmprendedorLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';

import { LoginPage } from '@/pages/Login/LoginPage';
import { RegistroPage } from '@/pages/Auth/RegistroPage';
import { VerificarEmailPage } from '@/pages/Auth/VerificarEmailPage';
import { ReenviarVerificacionPage } from '@/pages/Auth/ReenviarVerificacionPage';
import { RecuperarPasswordPage } from '@/pages/Auth/RecuperarPasswordPage';
import { ResetPasswordPage } from '@/pages/Auth/ResetPasswordPage';
import { SinPermisoPage } from '@/pages/Auth/SinPermisoPage';

import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { CreditosPage } from '@/pages/Creditos/CreditosPage';
import { EmprendedoresPage } from '@/pages/Emprendedores/EmprendedoresPage';
import { CryptoPage } from '@/pages/Crypto/CryptoPage';
import { CorreosPage } from '@/pages/Correos/CorreosPage';

import { MiPanelPage } from '@/pages/Emprendedor/MiPanelPage';
import { SolicitarCreditoPage } from '@/pages/Emprendedor/SolicitarCreditoPage';
import { MisCreditosPage } from '@/pages/Emprendedor/MisCreditosPage';
import { MiPerfilPage } from '@/pages/Emprendedor/MiPerfilPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/registro" element={<RegistroPage />} />
          <Route path="/verificar-email" element={<VerificarEmailPage />} />
          <Route path="/reenviar-verificacion" element={<ReenviarVerificacionPage />} />
          <Route path="/recuperar" element={<RecuperarPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/sin-permiso" element={<SinPermisoPage />} />

          {/* Administración */}
          <Route
            element={
              <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/creditos" element={<CreditosPage />} />
            <Route path="/emprendedores" element={<EmprendedoresPage />} />
            <Route path="/crypto" element={<CryptoPage />} />
            <Route path="/correos" element={<CorreosPage />} />
          </Route>

          {/* Emprendedor */}
          <Route
            element={
              <ProtectedRoute roles={['EMPRENDEDOR']}>
                <EmprendedorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/mi-panel" element={<MiPanelPage />} />
            <Route path="/solicitar" element={<SolicitarCreditoPage />} />
            <Route path="/mis-creditos" element={<MisCreditosPage />} />
            <Route path="/mi-perfil" element={<MiPerfilPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
