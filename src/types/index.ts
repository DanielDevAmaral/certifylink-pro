// Corporate Document Management Platform Types

export type UserRole = 'user' | 'leader' | 'admin';
export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'pending';
export type DocumentCategory = 'certification' | 'technical_attestation' | 'legal_document';
export type LegalDocumentType = 'legal_qualification' | 'fiscal_regularity' | 'economic_financial' | 'common_declarations';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
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
  client_name: string;
  project_object: string;
  project_period_start?: string;
  project_period_end?: string;
  project_value?: number;
  issuer_name: string;
  issuer_position?: string;
  issuer_contact?: string;
  document_url?: string;
  related_certifications?: string[];
  validity_date?: string;
  status: 'valid' | 'expiring' | 'expired' | 'pending';
  created_at: string;
  updated_at: string;
}

export type DocumentSubtype = 
  // Legal Qualification
  | 'social_contract'
  | 'partner_documents'
  | 'powers_of_attorney'
  // Fiscal Regularity  
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
  document_type: LegalDocumentType;
  document_subtype?: string;
  document_name: string;
  document_url: string;
  validity_date?: string;
  is_sensitive?: boolean;
  status: DocumentStatus;
  encrypted_data?: string;
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
  categories: LegalDocumentType[];
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