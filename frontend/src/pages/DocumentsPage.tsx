import { useParams } from 'react-router-dom';
import { DocumentsLandingPage } from './DocumentsLandingPage';
import { ProjectDocumentsView } from './ProjectDocumentsView';

export function DocumentsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <DocumentsLandingPage />;
  }

  return <ProjectDocumentsView />;
}

export { DocumentsLandingPage, ProjectDocumentsView };
