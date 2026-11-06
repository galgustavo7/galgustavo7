import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, Mail, MailWarning, Send } from 'lucide-react';
import { PageHeader, Loader, ErrorState, EmptyState } from '@/components/ui/Feedback';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useEmails } from '@/hooks/queries';
import { api, tokenStorage } from '@/api/client';
import { cx, formatDateTime } from '@/lib/format';
import type { EmailLog } from '@/types';

const ESTADO_CHIP: Record<string, string> = {
  ENVIADO: 'bg-emerald-100 text-emerald-700',
  SIMULADO: 'bg-amber-100 text-amber-700',
  ERROR: 'bg-rose-100 text-rose-700',
};

export function CorreosPage() {
  const { data, isLoading, isError, error } = useEmails(50);
  const [preview, setPreview] = useState<{ email: EmailLog; html: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  const verPreview = async (email: EmailLog) => {
    setCargando(true);
    try {
      const response = await api.get(`/emails/${email.id}/preview`, {
        responseType: 'text',
        headers: { Authorization: `Bearer ${tokenStorage.get()}` },
      });
      setPreview({ email, html: String(response.data) });
    } catch {
      toast.error('Este correo no tiene vista previa disponible');
    } finally {
      setCargando(false);
    }
  };

  if (isLoading) return <Loader label="Cargando bandeja de salida..." />;
  if (isError)
    return (
      <div className="p-8">
        <ErrorState message={(error as Error)?.message ?? 'No se pudieron cargar los correos'} />
      </div>
    );

  const emails = data ?? [];
  const simulados = emails.filter((e) => e.estado === 'SIMULADO').length;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title="Correos"
        subtitle="Bandeja de salida de las notificaciones de la plataforma"
        actions={
          <span className="chip bg-amber-100 text-amber-700">
            {simulados} en modo simulado (sin SMTP)
          </span>
        }
      />

      <Card>
        <CardContent className="p-0">
          {emails.length === 0 ? (
            <EmptyState
              title="Sin correos"
              description="Cuando se aprueben créditos o se registren pagos aparecerán aquí"
              icon={<Send className="h-6 w-6" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-ink-100 bg-ink-50/60">
                  <tr>
                    <th className="th">Asunto</th>
                    <th className="th">Destinatario</th>
                    <th className="th">Tipo</th>
                    <th className="th">Estado</th>
                    <th className="th">Fecha</th>
                    <th className="th text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {emails.map((email) => (
                    <tr key={email.id} className="transition hover:bg-ink-50/60">
                      <td className="td">
                        <p className="font-medium text-ink-900">{email.asunto}</p>
                        {email.mensaje_error && (
                          <p className="text-xs text-rose-500">{email.mensaje_error}</p>
                        )}
                      </td>
                      <td className="td text-sm">{email.destinatario}</td>
                      <td className="td">
                        <span className="chip bg-ink-100 text-ink-600">{email.tipo}</span>
                      </td>
                      <td className="td">
                        <span className={cx('chip', ESTADO_CHIP[email.estado] ?? 'bg-ink-100 text-ink-600')}>
                          {email.estado === 'SIMULADO' ? (
                            <MailWarning className="h-3.5 w-3.5" />
                          ) : (
                            <Mail className="h-3.5 w-3.5" />
                          )}
                          {email.estado}
                        </span>
                      </td>
                      <td className="td text-xs text-ink-500">{formatDateTime(email.creado_en)}</td>
                      <td className="td text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={cargando}
                          onClick={() => void verPreview(email)}
                          icon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.email.asunto}
        description={`Para: ${preview?.email.destinatario} · ${preview ? formatDateTime(preview.email.creado_en) : ''}`}
      >
        {preview && (
          <iframe
            title="Vista previa del correo"
            srcDoc={preview.html}
            className="h-[60vh] w-full rounded-xl border border-ink-100 bg-white"
          />
        )}
      </Modal>
    </div>
  );
}
