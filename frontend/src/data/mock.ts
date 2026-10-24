import type { AuditEvent, Document, EmissionRecord, MRVRecord, Parcel, Participant, Project, User } from '../types'

export const demoUser: User = { id: 'usr-001', name: 'Sarah Jenkins', role: 'Developer', email: 'sarah.jenkins@carbondesk.demo' }
export const projects: Project[] = [
  { id: 'PRJ-2024-001', name: 'Amazon Reforestation Alpha', type: 'ARR', location: 'Acre, Brazil', status: 'Active', progress: 65, phase: 'Issuance Phase', areaHa: 500, participants: 120 },
  { id: 'PRJ-2024-002', name: 'Delta Blue Carbon', type: 'Blue Carbon', location: 'Sindh, Pakistan', status: 'Under Review', progress: 40, phase: 'Validation', areaHa: 340, participants: 78 },
  { id: 'PRJ-2024-003', name: 'Highlands Soil Carbon', type: 'ALM', location: 'Nakuru, Kenya', status: 'Draft', progress: 15, phase: 'PDD Drafting', areaHa: 290, participants: 45 }
]
export const participants: Participant[] = [
  { id: 'PRT-2024-001', name: 'John Doe', email: 'john.doe@email.com', phone: '+55 68 555 0123', projectId: 'PRJ-2024-001', parcelId: 'LND-884-2A', status: 'Active', documents: 4, updated: 'Oct 12, 2023' },
  { id: 'PRT-2024-002', name: 'Sarah Jenkins', email: 's.jenkins@farmco.net', phone: '+55 68 555 0148', projectId: 'PRJ-2024-001', parcelId: 'LND-901-7B', status: 'Active', documents: 12, updated: 'Nov 01, 2023' },
  { id: 'PRT-2024-003', name: 'Michael Roberts', email: 'mroberts_agri@email.com', phone: '+55 68 555 0182', projectId: 'PRJ-2024-001', parcelId: 'LND-102-4C', status: 'Inactive', documents: 1, updated: 'Jan 15, 2023' }
]
export const parcel: Parcel = { id: 'LND-884-2A', projectId: 'PRJ-2024-001', participantId: 'PRT-2024-001', areaHa: 150.4, perimeterKm: 5.2, coordinates: [[-3.4653, -62.2159], [-3.461, -62.2045], [-3.472, -62.198], [-3.478, -62.208], [-3.471, -62.218]] }
export const mrvRecords: MRVRecord[] = [
  { id: 'MRV-004', projectId: 'PRJ-2024-001', period: 'Q3 2023', submittedBy: 'Sarah Jenkins', role: 'Admin', date: 'Oct 12, 2023', status: 'Validation Failed' },
  { id: 'MRV-005', projectId: 'PRJ-2024-002', period: 'Q3 2023', submittedBy: 'David Chen', role: 'Developer', date: 'Oct 14, 2023', status: 'Submitted' },
  { id: 'MRV-006', projectId: 'PRJ-2024-001', period: 'Q2 2023', submittedBy: 'Elena Rostova', role: 'Field Agent', date: 'Sep 28, 2023', status: 'Approved' },
  { id: 'MRV-007', projectId: 'PRJ-2024-002', period: 'Q3 2023', submittedBy: 'Marcus Thorne', role: 'Admin', date: 'Oct 15, 2023', status: 'Validated' },
  { id: 'MRV-008', projectId: 'PRJ-2024-001', period: 'Q4 2023', submittedBy: 'Sarah Jenkins', role: 'Admin', date: 'Oct 18, 2023', status: 'Under Review' }
]
export const mrvCounts = { 'Draft': 8, 'Submitted': 15, 'Under Review': 20, 'Validation Failed': 12, 'Validated': 54, 'Approved': 15 } as const
export const emissionRecords: EmissionRecord[] = [{ id: 'e1', parameter: 'Tree Count (Plot A)', value: 142, unit: 'count', source: 'Drone Survey' }, { id: 'e2', parameter: 'Average Height', value: -5.2, unit: 'meters', source: 'Field Measurement' }, { id: 'e3', parameter: 'DBH (Diameter at Breast Height)', value: 12.4, unit: 'cm', source: 'Field Measurement' }]
export const demoDocuments: Document[] = [{ id: 'd1', name: 'plot_a_canopy.jpg', size: '2.4 MB', type: 'image/jpeg' }, { id: 'd2', name: 'field_notes_oct24.pdf', size: '845 KB', type: 'application/pdf' }]
export const auditEvents: AuditEvent[] = [{ id: 'a1', actor: 'Sarah Jenkins', action: 'uploaded Baseline_Report_v2.pdf', timestamp: '2 hours ago' }, { id: 'a2', actor: 'System', action: 'registered Participant PRT-2024-001', timestamp: '5 hours ago' }, { id: 'a3', actor: 'Marcus Vance', action: 'updated GIS boundaries', timestamp: 'Yesterday' }]
