import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicPage } from './pages/PublicPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { CreateParticipantPage } from './pages/CreateParticipantPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { ParticipantsPage } from './pages/ParticipantsPage';
import { DocumentsLandingPage } from './pages/DocumentsLandingPage';
import { ProjectDocumentsView } from './pages/ProjectDocumentsView';
import { ParticipantDocumentsView } from './pages/ParticipantDocumentsView';
import { SettingsPage } from './pages/SettingsPage';
import { GISPage } from './pages/GISPage';
import { GlobalGISPage } from './pages/GlobalGISPage';
import { MRVPage } from './pages/MRVPage';
import { MRVCycleDetailsPage } from './pages/MRVCycleDetailsPage';
import { GlobalMRVPage } from './pages/GlobalMRVPage';
import { MeasurementFormPage } from './pages/MeasurementFormPage';
import { MRVReportPage } from './pages/MRVReportPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Projects Routes */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute>
            <CreateProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Project-specific Subroutes */}
      <Route
        path="/projects/:projectId/participants"
        element={
          <ProtectedRoute>
            <ParticipantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/participants/new"
        element={
          <ProtectedRoute>
            <CreateParticipantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/documents"
        element={
          <ProtectedRoute>
            <ProjectDocumentsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/gis"
        element={
          <ProtectedRoute>
            <GISPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/mrv"
        element={
          <ProtectedRoute>
            <MRVPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/mrv/:cycleId"
        element={
          <ProtectedRoute>
            <MRVCycleDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/mrv/:cycleId/measurements"
        element={
          <ProtectedRoute>
            <MeasurementFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/mrv/:cycleId/report/:reportId?"
        element={
          <ProtectedRoute>
            <MRVReportPage />
          </ProtectedRoute>
        }
      />

      {/* Dedicated Documents Section Workflow */}
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsLandingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDocumentsView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/projects/:projectId/participants/:participantId"
        element={
          <ProtectedRoute>
            <ParticipantDocumentsView />
          </ProtectedRoute>
        }
      />

      {/* Global GIS & MRV Views */}
      <Route
        path="/gis"
        element={
          <ProtectedRoute>
            <GlobalGISPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mrv"
        element={
          <ProtectedRoute>
            <GlobalMRVPage />
          </ProtectedRoute>
        }
      />

      {/* Settings & Profile Experience */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/profile"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
