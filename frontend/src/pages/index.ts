export { CreateProjectPage } from './CreateProjectPage';
export { CreateParticipantPage } from './CreateParticipantPage';
export { DashboardPage } from './DashboardPage';
export { DocumentsPage, DocumentsLandingPage, ProjectDocumentsView } from './DocumentsPage';
export { ParticipantDocumentsView } from './ParticipantDocumentsView';
export { SettingsPage } from './SettingsPage';
export { GISPage } from './GISPage';
export { GlobalGISPage } from './GlobalGISPage';
export { GlobalMRVPage } from './GlobalMRVPage';
export { LoginPage } from './LoginPage';

export { ParticipantsPage } from './ParticipantsPage';
export { ProjectDetailsPage } from './ProjectDetailsPage';
export { ProjectsPage } from './ProjectsPage';
export { PublicPage } from './PublicPage';
export { RegisterPage } from './RegisterPage';

// For backwards compatibility, export ProjectDetailsPage as ProjectOverviewPage
export { ProjectDetailsPage as ProjectOverviewPage };


// Placeholder page for coming soon routes
export function PlaceholderPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-stone-900">Coming Soon</h1>
        <p className="mt-2 text-stone-600">This feature is under development.</p>
      </div>
    </div>
  );
}

// Dashboard pages
export function MRVDashboardPage() {
  return <PlaceholderPage />;
}

export function MRVSubmissionPage() {
  return <PlaceholderPage />;
}
