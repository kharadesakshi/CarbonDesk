// ─── Authentication ──────────────────────────────────────────────────────────
export interface CarbonDeveloper {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  organizationName: string | null;
  organizationType: string | null;
  registrationNumber: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  profileStatus: 'active' | 'inactive' | 'pending_verification';
  bio: string | null;
  website: string | null;
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Projects ────────────────────────────────────────────────────────────────
export type ProjectStatus = 'draft' | 'active' | 'under_review' | 'validated' | 'archived';
export type ProjectType =
  | 'ARR' | 'REDD+' | 'Blue Carbon' | 'ALM' | 'IFM' | 'Urban Forestry'
  | 'Cookstoves' | 'Biogas' | 'Solar' | 'Wind' | 'Methane Capture' | 'Other';

export interface Project {
  id: string;
  developerId: string;
  name: string;
  projectCode: string | null;
  description: string | null;
  projectType: string;
  category: string | null;
  methodology: string | null;
  status: ProjectStatus;
  country: string | null;
  stateRegion: string | null;
  district: string | null;
  cityVillage: string | null;
  addressDescription: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: Date | string | null;
  expectedDurationYears: number | null;
  projectAreaHa: number | null;
  estimatedAnnualCO2Tonnes: number | null;
  expectedCarbonCredits: number | null;
  targetCertification: string | null;
  monitoringFrequency: string | null;
  additionalNotes: string | null;
  participantCount: number;
  hasGIS: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Participants ────────────────────────────────────────────────────────────
export type ParticipantStatus = 'active' | 'inactive' | 'pending';
export type ParticipantType =
  | 'Individual Farmer' | 'Community Group' | 'Land Owner' | 'Cooperative'
  | 'NGO' | 'Government' | 'Private Company' | 'Other';

export interface Participant {
  id: string;
  projectId: string;
  participantCode: string | null;
  fullName: string;
  participantType: string;
  email: string | null;
  phone: string | null;
  village: string | null;
  district: string | null;
  stateRegion: string | null;
  country: string | null;
  address: string | null;
  plotId: string | null;
  plotAreaHa: number | null;
  plotDescription: string | null;
  status: ParticipantStatus;
  enrollmentDate: Date | string | null;
  consentGiven: boolean;
  consentDate: Date | string | null;
  additionalNotes: string | null;
  documentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Documents ───────────────────────────────────────────────────────────────
export type DocumentType =
  | 'Identity Document' | 'Land Ownership Document' | 'Consent Form' | 'Agreement'
  | 'Registration Document' | 'Project Design Document' | 'Baseline Report'
  | 'Monitoring Report' | 'Verification Report' | 'Map / GIS File' | 'Photo Evidence' | 'Other';

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';
export type StorageProvider = 'local' | 's3';

export interface Document {
  id: string;
  projectId: string;
  participantId: string | null;
  uploadedById: string;
  documentName: string;
  documentType: string;
  originalFileName: string;
  storageProvider: StorageProvider;
  storagePath: string;
  storageUrl: string | null;
  fileSizeBytes: number;
  mimeType: string;
  verificationStatus: DocumentVerificationStatus;
  verificationNotes: string | null;
  notes: string | null;
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── GIS ──────────────────────────────────────────────────────────────────────
export interface ProjectGIS {
  id: string;
  projectId: string;
  centerLatitude: number | null;
  centerLongitude: number | null;
  boundaryGeoJSON: string | null;  // GeoJSON string
  calculatedAreaHa: number | null;
  perimeterKm: number | null;
  coordinateSystem: string | null;
  mapZoom: number | null;
  lastEditedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// GeoJSON types
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPolygon | GeoJSONPoint;
  properties: Record<string, any>;
}

// ─── API Responses ───────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  draftProjects?: number;
  underReviewProjects?: number;
  validatedProjects?: number;
  totalParticipants: number;
  gisEnabledProjects: number;
  totalDocuments?: number;
  raw?: {
    projects: { total: number; active: number; completed: number; archived: number };
    participants: { total: number; active: number; inactive: number };
    documents: { total: number; byType: Record<string, number> };
    gis: { projectsWithBoundary: number; totalAreaHa: number };
  };
}

// ─── MRV (Measurement, Reporting & Verification) ─────────────────────────────

export type MRVCycleStatus =
  | 'draft'
  | 'data_collection'
  | 'data_submitted'
  | 'validation'
  | 'needs_correction'
  | 'validated'
  | 'report_generated'
  | 'submitted_for_verification'
  | 'under_verification'
  | 'verified'
  | 'rejected';

export type MeasurementStatus = 'draft' | 'submitted' | 'valid' | 'invalid' | 'needs_correction';
export type MeasurementSource = 'manual' | 'field_survey' | 'document' | 'gis' | 'satellite' | 'iot' | 'import' | 'other';
export type DataCategory = 'baseline' | 'project' | 'monitoring';

export interface MeasurementType {
  id: string;
  name?: string;
  measurementName?: string;
  measurementCode?: string;
  category: string;
  unit: string;
  description: string | null;
  applicableFor?: string[];
  isStandard?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MRVEvidence {
  id: string;
  projectId: string;
  mrvCycleId: string;
  measurementId: string | null;
  documentId: string;
  evidenceType: string;
  description: string | null;
  attachedBy: string | null;
  attachedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  document?: Document;
  measurement?: Measurement;
}

export interface MRVCycle {
  id: string;
  projectId: string;
  cycleName: string;
  cycleCode: string;
  monitoringStartDate: Date | string;
  monitoringEndDate: Date | string;
  description: string | null;
  status: MRVCycleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Measurement {
  id: string;
  mrvCycleId: string;
  measurementTypeId: string;
  value: number;
  unit: string;
  measurementDate: Date | string;
  participantId: string | null;
  source: MeasurementSource;
  dataCategory: DataCategory;
  locationCoordinates?: string | null;
  plotReference?: string | null;
  notes: string | null;
  status: MeasurementStatus;
  validationNotes: string | null;
  validatedBy: string | null;
  validatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  type?: MeasurementType;
  participant?: Participant;
  evidence?: MRVEvidence[];
}

export interface MRVReport {
  id: string;
  mrvCycleId: string;
  projectId: string;
  reportTitle: string;
  reportCode: string;
  reportingPeriodStart: Date | string;
  reportingPeriodEnd: Date | string;
  totalMeasurementsCount: number;
  validMeasurementsCount: number;
  reportSummary: string | null;
  status: 'draft' | 'submitted' | 'under_verification' | 'verified' | 'rejected';
  submittedAt: Date | null;
  submittedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  reportId: string;
  verificationStatus: 'verified' | 'rejected' | 'requires_changes';
  verifierComments: string | null;
  findings: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  changes: string | null;
  timestamp: Date;
}
