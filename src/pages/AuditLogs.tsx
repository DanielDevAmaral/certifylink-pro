import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function AuditLogs() {
  return (
    <ErrorBoundary>
      <Layout>
        <PageHeader
          title="Logs de Auditoria"
          description="Visualização detalhada de todas as atividades do sistema"
        />
        
        <AuditLogViewer />
      </Layout>
    </ErrorBoundary>
  );
}