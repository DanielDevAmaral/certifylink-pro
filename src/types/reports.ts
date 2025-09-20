// Report-specific type definitions for better type safety and data structure

export interface ReportField {
  key: string;
  label: string;
  format?: (value: any) => string;
  type?: 'text' | 'date' | 'number' | 'boolean' | 'array' | 'currency';
}

export interface ReportData {
  title: string;
  headers: string[];
  data: (string | number)[][];
  summary?: Record<string, string | number>;
  metadata?: {
    generatedAt: string;
    generatedBy?: string;
    totalRecords: number;
    filters?: Record<string, any>;
  };
}

export interface ReportConfig {
  title: string;
  fields: ReportField[];
  summary?: Record<string, any>;
  filename: string;
  type: 'excel' | 'csv' | 'pdf';
  pdfStyle?: 'synthetic' | 'detailed'; // New field for PDF report type
  branding?: {
    logo?: string;
    company?: string;
    subtitle?: string;
    footer?: string;
    coverTemplate?: string;
    auto_toc?: boolean;
  };
}

// Enhanced data interfaces with profile information
export interface CertificationReportData {
  id: string;
  name: string;
  function: string;
  validity_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  full_name?: string;
  approved_equivalence: boolean;
  equivalence_services?: string[];
  screenshot_url?: string;
  public_link?: string;
}

export interface TechnicalAttestationReportData {
  id: string;
  client_name: string;
  project_object: string;
  project_period_start?: string;
  project_period_end?: string;
  project_value?: number;
  issuer_name: string;
  issuer_position?: string;
  issuer_contact?: string;
  validity_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  full_name?: string;
  related_certifications?: string[];
}

export interface LegalDocumentReportData {
  id: string;
  document_name: string;
  document_type: string;
  document_subtype?: string;
  validity_date?: string;
  status: string;
  is_sensitive?: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  full_name?: string;
}

export type ReportDataType = 'certifications' | 'attestations' | 'documents' | 'dashboard';

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  includeExpired?: boolean;
  userIds?: string[];
  documentTypes?: string[];
}

export interface ReportSummary {
  totalRecords: number;
  byStatus: Record<string, number>;
  byType?: Record<string, number>;
  dateRange?: {
    from: string;
    to: string;
  };
  additionalMetrics?: Record<string, any>;
}