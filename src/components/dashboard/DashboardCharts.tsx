import { AnalyticsData } from "@/hooks/useDashboardAnalytics";
import { useCertificationsByPlatform } from "@/hooks/useCertificationsByPlatform";
import { memo } from 'react';
import { InteractiveCharts } from './InteractiveCharts';
import { FilterControlPanel } from './FilterControlPanel';
import { DetailedFilterPanel } from './DetailedFilterPanel';
import { DashboardFilterProvider } from '@/contexts/DashboardFilterContext';
interface DashboardChartsProps {
  analytics?: AnalyticsData;
}

const DashboardCharts = memo(function DashboardCharts({
  analytics
}: DashboardChartsProps) {
  const { data: platformData } = useCertificationsByPlatform();
  
  return (
    <DashboardFilterProvider>
      <div className="space-y-6">
        <DetailedFilterPanel />
        <FilterControlPanel />
        <InteractiveCharts analytics={analytics} platformData={platformData} />
      </div>
    </DashboardFilterProvider>
  );
});
export { DashboardCharts };