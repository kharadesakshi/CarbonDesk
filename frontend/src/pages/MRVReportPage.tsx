import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  Printer,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  MapPin,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { AppShell } from '../components/ui';
import {
  getReport,
  submitReport,
  recordVerification,
  generateReport,
  getMRVCycle,
  listMeasurements,
  listEvidence,
} from '../services/mrv.service';
import { getProject } from '../services/project.service';
import { recordVerificationSchema } from '../schemas/mrv.schema';
import { MRVReport, MRVCycle, Measurement, MRVEvidence } from '../types';

export function MRVReportPage() {
  const { projectId, cycleId, reportId } = useParams<{
    projectId: string;
    cycleId: string;
    reportId?: string;
  }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [cycle, setCycle] = useState<MRVCycle | null>(null);
  const [report, setReport] = useState<any>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [evidenceList, setEvidenceList] = useState<MRVEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [verificationData, setVerificationData] = useState({
    status: 'verified' as 'verified' | 'rejected' | 'requires_changes',
    comments: '',
    findings: '',
  });

  // Load data
  useEffect(() => {
    async function load() {
      if (!cycleId) return;
      try {
        const [cycleData, memsData, evData, projData] = await Promise.all([
          getMRVCycle(cycleId),
          listMeasurements(cycleId),
          listEvidence(cycleId).catch(() => []),
          projectId ? getProject(projectId).catch(() => null) : Promise.resolve(null),
        ]);

        setCycle(cycleData);
        setMeasurements(memsData.data || []);
        setEvidenceList(evData || []);
        setProject(projData);

        if (reportId) {
          const reportData = await getReport(reportId);
          setReport(reportData);
        } else if (cycleData?.reports && cycleData.reports.length > 0) {
          setReport(cycleData.reports[0]);
        }
      } catch (err: any) {
        console.error('Failed to load report data:', err);
        setActionError(err?.response?.data?.error || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cycleId, reportId, projectId]);

  const handleGenerateReport = async () => {
    if (!cycleId) return;
    setActionError(null);
    try {
      const newReport = await generateReport(cycleId);
      setReport(newReport);
      setActionSuccess('Monitoring report generated from validated measurements.');
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setActionError(err?.response?.data?.error || 'Failed to generate report.');
    }
  };

  const handleSubmitReport = async () => {
    if (!report?.id) return;
    setActionError(null);
    try {
      const updated = await submitReport(report.id);
      setReport(updated);
      setActionSuccess('Report submitted for verifier review.');
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setActionError(err?.response?.data?.error || 'Failed to submit report.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report?.id) return;
    setActionError(null);

    try {
      const validated = recordVerificationSchema.parse(verificationData);
      const verification = await recordVerification(report.id, validated);

      setReport({
        ...report,
        status: validated.status === 'verified' ? 'verified' : 'rejected',
        verifications: [verification, ...(report.verifications || [])],
      });

      setShowVerificationForm(false);
      setActionSuccess(`Verification decision recorded: ${validated.status.replace(/_/g, ' ')}.`);
      setVerificationData({
        status: 'verified',
        comments: '',
        findings: '',
      });
    } catch (err: any) {
      console.error('Verification error:', err);
      setActionError(err?.response?.data?.error || 'Failed to record verification.');
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-stone-200 border-t-forest" />
        </div>
      </AppShell>
    );
  }

  const validMeasurements = measurements.filter((m) => m.status === 'valid');
  const invalidMeasurements = measurements.filter((m) => m.status === 'invalid');
  const pendingMeasurements = measurements.filter((m) => m.status === 'submitted' || m.status === 'draft');

  // Aggregated units
  const unitsRecorded = Array.from(new Set(validMeasurements.map((m) => m.unit)));

  return (
    <AppShell>
      {/* Breadcrumbs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-stone-500 font-medium print:hidden">
        <Link to="/mrv" className="hover:text-forest">MRV Hub</Link>
        <ChevronRight size={12} />
        {projectId && (
          <>
            <Link to={`/projects/${projectId}`} className="hover:text-forest">{project?.name || 'Project'}</Link>
            <ChevronRight size={12} />
            <Link to={`/projects/${projectId}/mrv`} className="hover:text-forest">Cycles</Link>
            <ChevronRight size={12} />
          </>
        )}
        {cycleId && (
          <>
            <Link to={`/projects/${projectId}/mrv/${cycleId}`} className="hover:text-forest">{cycle?.cycleName || 'Cycle'}</Link>
            <ChevronRight size={12} />
          </>
        )}
        <span className="text-forest-deep font-semibold">Monitoring Report</span>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger print:hidden">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}><X size={14} /></button>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-success print:hidden">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {/* Action Bar (Top) */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(projectId ? `/projects/${projectId}/mrv/${cycleId}` : '/mrv')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-forest"
        >
          <ArrowLeft size={16} />
          <span>Back to Monitoring Cycle</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {report && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 shadow-xs"
            >
              <Printer size={14} className="text-forest" />
              <span>Print / Export PDF</span>
            </button>
          )}

          {report && report.status === 'draft' && (
            <button
              onClick={handleSubmitReport}
              className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep shadow-xs"
            >
              <Send size={14} />
              <span>Submit for Verification</span>
            </button>
          )}

          {report && (report.status === 'submitted' || report.status === 'under_verification') && (
            <button
              onClick={() => setShowVerificationForm(!showVerificationForm)}
              className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep shadow-xs"
            >
              <ShieldCheck size={14} />
              <span>Record Verifier Audit</span>
            </button>
          )}

          {!report && (
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep shadow-xs"
            >
              <FileSpreadsheet size={14} />
              <span>Generate Monitoring Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Verification Action Drawer / Form */}
      {showVerificationForm && report && (
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-md print:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-base font-bold text-forest-deep">Independent Verifier Audit Action</h3>
            <button onClick={() => setShowVerificationForm(false)} className="text-stone-400 hover:text-stone-600">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleVerify} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700">Verification Decision *</label>
              <select
                value={verificationData.status}
                onChange={(e) => setVerificationData({ ...verificationData, status: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs font-bold"
              >
                <option value="verified">Approve & Verify (Compliant with project monitoring rules)</option>
                <option value="requires_changes">Request Revisions / Corrections</option>
                <option value="rejected">Reject Submission (Substantial non-compliance)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700">Verifier Audit Comments *</label>
              <textarea
                value={verificationData.comments}
                onChange={(e) => setVerificationData({ ...verificationData, comments: e.target.value })}
                placeholder="Detailed reviewer commentary, sampling notes, and compliance statement..."
                required
                rows={3}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700">Audit Findings & Observations</label>
              <textarea
                value={verificationData.findings}
                onChange={(e) => setVerificationData({ ...verificationData, findings: e.target.value })}
                placeholder="Specific plot checks, document cross-referencing findings..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowVerificationForm(false)}
                className="rounded-lg border border-stone-300 px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-forest-deep"
              >
                Commit Verifier Decision
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REPORT CONTENT (Formatted for Screen & Print) */}
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xs print:border-0 print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="pb-6 border-b border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest font-mono">
                Official Project Monitoring Document
              </span>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-forest-deep">
                {report ? report.reportTitle : `Monitoring Report — ${cycle?.cycleName}`}
              </h1>
              <p className="mt-1 text-xs text-stone-500 font-mono">
                Report Code: <strong>{report?.reportCode || `REP-${cycle?.cycleCode || 'CYCLE'}`}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span
                className={`inline-block rounded px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                  report?.status === 'verified'
                    ? 'bg-emerald-50 text-success border-emerald-200'
                    : report?.status === 'rejected'
                      ? 'bg-red-50 text-danger border-red-200'
                      : report?.status === 'submitted'
                        ? 'bg-amber-50 text-warning border-amber-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                Status: {report ? report.status.replace(/_/g, ' ') : 'Draft / Uncompiled'}
              </span>
              <p className="text-[11px] text-stone-400 mt-1">
                Generated: {report ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Project & Cycle Identification */}
        <div className="py-6 border-b border-stone-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-forest mb-3">1. Project & Period Metadata</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-stone-50">
              <span className="text-[10px] font-bold uppercase text-stone-400">Project Name</span>
              <p className="font-bold text-stone-800 mt-0.5">{project?.name || 'Project Name'}</p>
              <span className="text-[10px] text-stone-400 font-mono">{project?.projectCode}</span>
            </div>
            <div className="p-3 rounded-lg bg-stone-50">
              <span className="text-[10px] font-bold uppercase text-stone-400">Project Type & Methodology</span>
              <p className="font-bold text-stone-800 mt-0.5">{project?.projectType || 'ARR'}</p>
              <span className="text-[10px] text-stone-500">{project?.methodology || 'Empirical Field Survey'}</span>
            </div>
            <div className="p-3 rounded-lg bg-stone-50">
              <span className="text-[10px] font-bold uppercase text-stone-400">Monitoring Period</span>
              <p className="font-bold text-stone-800 mt-0.5">
                {cycle ? `${new Date(cycle.monitoringStartDate).toLocaleDateString()} – ${new Date(cycle.monitoringEndDate).toLocaleDateString()}` : '—'}
              </p>
              <span className="text-[10px] text-stone-400">Cycle: {cycle?.cycleName}</span>
            </div>
            <div className="p-3 rounded-lg bg-stone-50">
              <span className="text-[10px] font-bold uppercase text-stone-400">Location / GIS Bounds</span>
              <p className="font-bold text-stone-800 mt-0.5">{project?.stateRegion || project?.country || 'India'}</p>
              <span className="text-[10px] text-stone-400">
                {project?.gisData?.totalAreaHa ? `${project.gisData.totalAreaHa} ha registered` : 'WGS84 Coordinates'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Methodology & Safety Disclosure */}
        <div className="py-6 border-b border-stone-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-forest mb-2">2. Methodology Disclosure & Limitations</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-stone-700">
            <div className="flex items-start gap-2.5">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-stone-900">Standard CPMS Monitoring Assurance Statement</p>
                <p className="mt-1 leading-relaxed text-stone-600">
                  This report summarizes empirical field measurements, plot samples, and evidence documents compiled in accordance with standard CPMS quality-assurance guidelines.
                  Internal approval confirms that monitoring records satisfy project criteria. This report does <strong>not</strong> constitute third-party carbon registry certification (e.g. Verra VCS, Gold Standard) or carbon credit issuance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Empirical Measurement Summary & Missing Data Analysis */}
        <div className="py-6 border-b border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest">
              3. Measurement Summary & Missing Data Analysis
            </h2>
            <span className="text-xs text-stone-500">
              {validMeasurements.length} valid of {measurements.length} total
            </span>
          </div>

          {/* Missing Data & Quality Callout */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Verified Valid Measurements</span>
              <p className="mt-1 text-xl font-bold text-success">{validMeasurements.length}</p>
              <span className="text-[10px] text-stone-500">Formally QA-approved records</span>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
              <span className="text-[10px] font-bold uppercase text-stone-500">Pending / Unsubmitted</span>
              <p className="mt-1 text-xl font-bold text-stone-700">{pendingMeasurements.length}</p>
              <span className="text-[10px] text-stone-500">Draft or in validation</span>
            </div>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <span className="text-[10px] font-bold uppercase text-amber-800">Missing / Unrecorded Parameters</span>
              <p className="mt-1 text-xl font-bold text-warning">{invalidMeasurements.length}</p>
              <span className="text-[10px] text-stone-500">Rejected or needing correction</span>
            </div>
          </div>

          {/* Aggregated Valid Metrics by Unit */}
          <div className="mb-4 overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-[10px] font-bold uppercase text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Monitored Parameter / Unit</th>
                  <th className="py-2.5 px-4">Validated Sum</th>
                  <th className="py-2.5 px-4">Samples Count</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {unitsRecorded.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-stone-400 italic">
                      No validated empirical measurements in this reporting period.
                    </td>
                  </tr>
                ) : (
                  unitsRecorded.map((unit) => {
                    const unitItems = validMeasurements.filter((m) => m.unit === unit);
                    const totalVal = unitItems.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
                    return (
                      <tr key={unit}>
                        <td className="py-2.5 px-4 font-bold text-stone-800">{unit}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-forest-deep">{totalVal.toLocaleString()} {unit}</td>
                        <td className="py-2.5 px-4 text-stone-600">{unitItems.length} records</td>
                        <td className="py-2.5 px-4">
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-success border border-emerald-200">
                            Validated
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Attached Evidence Documentation */}
        <div className="py-6 border-b border-stone-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-forest mb-3">
            4. Supporting Evidence & Verification Vault
          </h2>
          {evidenceList.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No supporting evidence documents attached to this cycle.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-[10px] font-bold uppercase text-stone-500 border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Document Title</th>
                    <th className="py-2.5 px-4">Evidence Type</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Attached Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {evidenceList.map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-2.5 px-4 font-bold text-stone-800">{ev.document?.documentName || 'Document'}</td>
                      <td className="py-2.5 px-4">
                        <span className="capitalize font-medium text-stone-600">{ev.evidenceType.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-2.5 px-4 text-stone-500">{ev.description || '—'}</td>
                      <td className="py-2.5 px-4 text-stone-400">{new Date(ev.attachedAt || ev.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 5: Verification Sign-off & Audit Log */}
        <div className="pt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-forest mb-3">5. Verification Sign-Off & Findings</h2>
          {report?.verifications && report.verifications.length > 0 ? (
            <div className="space-y-3">
              {report.verifications.map((v: any) => (
                <div key={v.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">
                      Audit Decision: <strong className="capitalize text-forest">{v.verificationStatus?.replace(/_/g, ' ')}</strong>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(v.verifiedAt || v.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {v.verifierComments && (
                    <p className="mt-2 text-stone-700 italic bg-white p-2.5 rounded border border-stone-200">
                      "{v.verifierComments}"
                    </p>
                  )}
                  {v.findings && (
                    <p className="mt-2 text-stone-600">
                      <strong>Findings:</strong> {v.findings}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-500 italic">
              Verification audit not yet recorded. Once submitted, qualified reviewers log formal decisions here.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
