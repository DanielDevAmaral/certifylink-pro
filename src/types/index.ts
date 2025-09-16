// Corporate Document Management Platform Types

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'leader' | 'admin';
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  created_at: string;
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  function: string;
  public_link?: string;
  screenshot_url?: string;
  validity_date: string;
  equivalence_services?: string[];
  approved_equivalence: boolean;
  status: 'valid' | 'expiring' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface TechnicalCertificate {
  id: string;
  user_id: string;
  client_issuer: string;
  object: string;
  period_start: string;
  period_end: string;
  value: number;
  responsible_issuer: string;
  pdf_url: string;
  related_certifications: string[];
  validity_date: string;
  status: 'valid' | 'expiring' | 'expired';
  created_at: string;
  updated_at: string;
}

export type DocumentCategory = 
  | 'legal_qualification'
  | 'tax_regularity' 
  | 'economic_financial'
  | 'common_declarations';

export type DocumentSubtype = 
  // Legal Qualification
  | 'social_contract'
  | 'partner_documents'
  | 'powers_of_attorney'
  // Tax Regularity  
  | 'cnpj'
  | 'federal_cnd'
  | 'fgts'
  | 'cndt'
  | 'state_clearance'
  | 'municipal_clearance'
  // Economic Financial
  | 'balance_sheet'
  | 'bankruptcy_certificate'
  // Common Declarations
  | 'requirements_compliance'
  | 'minor_employment'
  | 'proposal_independence'
  | 'me_epp';

export interface LegalDocument {
  id: string;
  user_id: string;
  category: DocumentCategory;
  subtype: DocumentSubtype;
  name: string;
  pdf_url: string;
  validity_date?: string;
  is_sensitive: boolean;
  status: 'valid' | 'expiring' | 'expired' | 'not_applicable';
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  total_certifications: number;
  expiring_certifications: number;
  total_certificates: number;
  expiring_certificates: number;
  total_documents: number;
  expiring_documents: number;
  recent_uploads: number;
  completion_percentage: number;
}

export interface ExportReport {
  id: string;
  user_id: string;
  type: 'pdf' | 'docx';
  categories: DocumentCategory[];
  generated_at: string;
  download_url: string;
  status: 'generating' | 'ready' | 'expired';
}

export interface AIEquivalence {
  certification_id: string;
  suggested_services: string[];
  confidence_score: number;
  generated_at: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'expiration_warning' | 'document_uploaded' | 'equivalence_suggested';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}