import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  showActions?: boolean;
  showImage?: boolean;
  showStatus?: boolean;
}

export function SkeletonCard({ 
  showActions = true, 
  showImage = false, 
  showStatus = true 
}: SkeletonCardProps) {
  return (
    <Card className="card-corporate p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          {showStatus && (
            <Skeleton className="h-6 w-16 rounded-full" />
          )}
        </div>

        {/* Image */}
        {showImage && (
          <Skeleton className="h-32 w-full rounded-md" />
        )}

        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}