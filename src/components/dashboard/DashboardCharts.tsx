import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { useCertificationsByPlatform } from "@/hooks/useCertificationsByPlatform";
import { memo } from 'react';
import { InteractiveCharts } from './InteractiveCharts';
import { FilterControlPanel } from './FilterControlPanel';
import { DetailedFilterPanel } from './DetailedFilterPanel';
import { DashboardFilterProvider, useDashboardFilters } from '@/contexts/DashboardFilterContext';

const DashboardChartsContent = memo(function DashboardChartsContent() {
  const { filters } = useDashboardFilters();
  
  // Transform filters to match hook interfaces
  const dashboardFilters = {
    categories: filters.categories,
    platforms: filters.platforms,
    statuses: filters.statuses,
    dateRange: filters.dateRange
  };

  const platformFilters = {
    platforms: filters.platforms,
    statuses: filters.statuses,
    dateRange: filters.dateRange
  };

  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics(dashboardFilters);
  const { data: platformData, isLoading: platformLoading } = useCertificationsByPlatform(platformFilters);
  
  return (
    <div className="space-y-6">
      <DetailedFilterPanel />
      <FilterControlPanel />
      <InteractiveCharts 
        analytics={analytics} 
        platformData={platformData}
        isLoading={analyticsLoading || platformLoading}
      />
    </div>
  );
});

const DashboardCharts = memo(function DashboardCharts() {
  return (
    <DashboardFilterProvider>
      <DashboardChartsContent />
    </DashboardFilterProvider>
  );
});
export { DashboardCharts };