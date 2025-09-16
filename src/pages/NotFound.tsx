import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              A página que você está procurando não existe ou foi movida para outro endereço.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="btn-corporate" asChild>
              <a href="/">Voltar ao Dashboard</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/certifications">Ver Certificações</a>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
