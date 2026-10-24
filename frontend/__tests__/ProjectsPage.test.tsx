/**
 * ProjectsPage Component Tests
 * Tests project list, creation, filtering, and interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsPage from '../src/pages/ProjectsPage';

// Mock services
vi.mock('../src/services/project.service', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

vi.mock('../src/services/auth.service', () => ({
  AuthService: {
    getToken: vi.fn(() => 'mock-token'),
  },
}));

describe('ProjectsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render projects page', () => {
      render(<ProjectsPage />);
      expect(screen.getByText(/Projects/i)).toBeInTheDocument();
    });

    it('should display create button', () => {
      render(<ProjectsPage />);
      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should display search input', () => {
      render(<ProjectsPage />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should display filter options', () => {
      render(<ProjectsPage />);
      expect(screen.getByText(/Filter by Status/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton initially', () => {
      render(<ProjectsPage />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should hide skeleton when data loads', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: [{ id: '1', name: 'Test Project' }],
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });
  });

  describe('Project List Display', () => {
    it('should display projects in table', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: [
          { id: '1', name: 'Project Alpha', status: 'active', projectType: 'forest_conservation' },
          { id: '2', name: 'Project Beta', status: 'draft', projectType: 'renewable_energy' },
        ],
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
        expect(screen.getByText('Project Beta')).toBeInTheDocument();
      });
    });

    it('should display empty state when no projects', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({ data: [] });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No projects found/i)).toBeInTheDocument();
      });
    });

    it('should display error message on load failure', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockRejectedValue(new Error('Network error'));

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load projects/i)).toBeInTheDocument();
      });
    });
  });

  describe('Searching', () => {
    it('should filter projects by search term', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: [{ id: '1', name: 'Carbon Project Alpha' }],
      });

      render(<ProjectsPage />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      await userEvent.type(searchInput, 'Carbon');

      await waitFor(() => {
        expect(ProjectService.listProjects).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Carbon' })
        );
      });
    });

    it('should debounce search input', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({ data: [] });

      render(<ProjectsPage />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

      // Type multiple characters quickly
      await userEvent.type(searchInput, 'test', { delay: 50 });

      // Should be called once after debounce, not for each character
      await waitFor(() => {
        expect(ProjectService.listProjects).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({ data: [] });

      render(<ProjectsPage />);

      const statusSelect = screen.getByDisplayValue(/all/i);
      await userEvent.selectOptions(statusSelect, 'active');

      await waitFor(() => {
        expect(ProjectService.listProjects).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'active' })
        );
      });
    });

    it('should filter by type', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({ data: [] });

      render(<ProjectsPage />);

      const typeSelect = screen.getByDisplayValue(/forest conservation/i);
      await userEvent.selectOptions(typeSelect, 'renewable_energy');

      await waitFor(() => {
        expect(ProjectService.listProjects).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'renewable_energy' })
        );
      });
    });
  });

  describe('Creating Project', () => {
    it('should open create modal on button click', async () => {
      render(<ProjectsPage />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(createButton);

      expect(screen.getByText(/Create New Project/i)).toBeInTheDocument();
    });

    it('should create project with valid data', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.createProject as any).mockResolvedValue({
        id: '3',
        name: 'New Project',
      });

      render(<ProjectsPage />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/Project Name/i);
      const countryInput = screen.getByLabelText(/Country/i);
      const submitButton = screen.getByRole('button', { name: /Submit/i });

      await userEvent.type(nameInput, 'New Project');
      await userEvent.type(countryInput, 'Kenya');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(ProjectService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Project',
            country: 'Kenya',
          })
        );
      });
    });

    it('should validate required fields', async () => {
      render(<ProjectsPage />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(createButton);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/Project name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Country is required/i)).toBeInTheDocument();
    });

    it('should show error on creation failure', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.createProject as any).mockRejectedValue(
        new Error('Failed to create project')
      );

      render(<ProjectsPage />);

      const createButton = screen.getByRole('button', { name: /create/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/Project Name/i);
      const submitButton = screen.getByRole('button', { name: /Submit/i });

      await userEvent.type(nameInput, 'New Project');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create project/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Actions', () => {
    it('should navigate to project on row click', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: [{ id: '1', name: 'Project Alpha' }],
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });

      const row = screen.getByText('Project Alpha').closest('tr');
      await userEvent.click(row!);

      // Should navigate to project detail page
      expect(window.location.pathname).toContain('/projects/1');
    });

    it('should delete project with confirmation', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: [{ id: '1', name: 'Project Alpha' }],
      });
      (ProjectService.deleteProject as any).mockResolvedValue({});

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await userEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(ProjectService.deleteProject).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `Project ${i}` })),
        pagination: { page: 1, totalPages: 3 },
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should load next page on pagination click', async () => {
      const { ProjectService } = await import('../src/services/project.service');
      (ProjectService.listProjects as any).mockResolvedValue({
        data: [],
        pagination: { page: 1, totalPages: 3 },
      });

      render(<ProjectsPage />);

      const nextButton = await screen.findByRole('button', { name: /next/i });
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(ProjectService.listProjects).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });
});
