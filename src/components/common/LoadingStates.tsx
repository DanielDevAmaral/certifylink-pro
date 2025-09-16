import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";

export function PageLoadingSkeleton({ 
  title, 
  description,
  showActions = true 
}: { 
  title: string; 
  description: string;
  showActions?: boolean;
}) {
  return (
    <Layout>
      <PageHeader title={title} description={description}>
        {showActions && (
          <>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </>
        )}
      </PageHeader>
      
      {/* Filter bar skeleton */}
      <Card className="card-corporate mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      </Card>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="card-corporate p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>

              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Layout>
  );
}

export function TableLoadingSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="grid grid-cols-5 gap-4 p-4 border-b border-border">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-5 gap-4 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}