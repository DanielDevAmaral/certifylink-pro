import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PlatformManagement } from "./certification/PlatformManagement";
import { CategoryManagement } from "./certification/CategoryManagement";
import { TypeManagement } from "./certification/TypeManagement";
import { DataMigration } from "./certification/DataMigration";

export function CertificationManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestão de Certificações</h2>
        <p className="text-muted-foreground">
          Gerencie plataformas, categorias e tipos de certificação padronizados
        </p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="platforms">Plataformas</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="types">Tipos</TabsTrigger>
          <TabsTrigger value="migration">Inconsistências</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plataformas de Certificação</CardTitle>
              <CardDescription>
                Gerencie as plataformas disponíveis (Google, AWS, Microsoft, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlatformManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categorias Funcionais</CardTitle>
              <CardDescription>
                Gerencie as categorias funcionais das certificações (Arquitetura, Desenvolvimento, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Certificação</CardTitle>
              <CardDescription>
                Gerencie os tipos específicos de certificação por plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TypeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inconsistências</CardTitle>
              <CardDescription>
                Detecta e corrige inconsistências, duplicatas e tipos não padronizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataMigration />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}