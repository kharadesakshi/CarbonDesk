/**
 * ParticipantsPage Component Tests
 * Tests participant list, creation, deletion, and document management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParticipantsPage from '../src/pages/ParticipantsPage';

// Mock services
vi.mock('../src/services/participant.service', () => ({
  ParticipantService: {
    listParticipants: vi.fn(),
    createParticipant: vi.fn(),
    updateParticipant: vi.fn(),
    deleteParticipant: vi.fn(),
  },
}));

vi.mock('../src/services/auth.service', () => ({
  AuthService: {
    getToken: vi.fn(() => 'mock-token'),
  },
}));

describe('ParticipantsPage Component', () => {
  const mockProjectId = 'project-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock router to have projectId param
    (global as any).useParams = vi.fn(() => ({ projectId: mockProjectId }));
  });

  describe('Rendering', () => {
    it('should render participants page', () => {
      render(<ParticipantsPage />);
      expect(screen.getByText(/Participants/i)).toBeInTheDocument();
    });

    it('should display add participant button', () => {
      render(<ParticipantsPage />);
      const addButton = screen.getByRole('button', { name: /add participant/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should display search input', () => {
      render(<ParticipantsPage />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should display document count column', () => {
      render(<ParticipantsPage />);
      expect(screen.getByText(/Documents/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading skeleton initially', () => {
      render(<ParticipantsPage />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should hide skeleton when data loads', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', documentCount: 2 }],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
    });
  });

  describe('Participant List Display', () => {
    it('should display participants in table', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [
          {
            id: '1',
            fullName: 'John Doe',
            email: 'john@example.com',
            status: 'active',
            documentCount: 2,
          },
          {
            id: '2',
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            status: 'inactive',
            documentCount: 0,
          },
        ],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display document count', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', documentCount: 5 }],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Document count
      });
    });

    it('should display status badge', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', status: 'active' }],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Active/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no participants', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({ data: [] });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No participants found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Searching', () => {
    it('should filter participants by full name', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe' }],
      });

      render(<ParticipantsPage />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      await userEvent.type(searchInput, 'John');

      await waitFor(() => {
        expect(ParticipantService.listParticipants).toHaveBeenCalledWith(
          mockProjectId,
          expect.objectContaining({ search: 'John' })
        );
      });
    });

    it('should filter by email', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({ data: [] });

      render(<ParticipantsPage />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      await userEvent.type(searchInput, 'john@example.com');

      await waitFor(() => {
        expect(ParticipantService.listParticipants).toHaveBeenCalledWith(
          mockProjectId,
          expect.objectContaining({ search: 'john@example.com' })
        );
      });
    });
  });

  describe('Filtering by Status', () => {
    it('should filter by active status', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({ data: [] });

      render(<ParticipantsPage />);

      const statusSelect = screen.getByDisplayValue(/All/i);
      await userEvent.selectOptions(statusSelect, 'active');

      await waitFor(() => {
        expect(ParticipantService.listParticipants).toHaveBeenCalledWith(
          mockProjectId,
          expect.objectContaining({ status: 'active' })
        );
      });
    });

    it('should filter by inactive status', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({ data: [] });

      render(<ParticipantsPage />);

      const statusSelect = screen.getByDisplayValue(/All/i);
      await userEvent.selectOptions(statusSelect, 'inactive');

      await waitFor(() => {
        expect(ParticipantService.listParticipants).toHaveBeenCalledWith(
          mockProjectId,
          expect.objectContaining({ status: 'inactive' })
        );
      });
    });
  });

  describe('Creating Participant', () => {
    it('should open create modal on button click', async () => {
      render(<ParticipantsPage />);

      const addButton = screen.getByRole('button', { name: /add participant/i });
      await userEvent.click(addButton);

      expect(screen.getByText(/Add New Participant/i)).toBeInTheDocument();
    });

    it('should create participant with valid data', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.createParticipant as any).mockResolvedValue({
        id: '3',
        fullName: 'New Participant',
      });

      render(<ParticipantsPage />);

      const addButton = screen.getByRole('button', { name: /add participant/i });
      await userEvent.click(addButton);

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const submitButton = screen.getByRole('button', { name: /Submit/i });

      await userEvent.type(nameInput, 'New Participant');
      await userEvent.type(emailInput, 'new@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(ParticipantService.createParticipant).toHaveBeenCalledWith(
          mockProjectId,
          expect.objectContaining({
            fullName: 'New Participant',
            email: 'new@example.com',
          })
        );
      });
    });

    it('should validate required fields', async () => {
      render(<ParticipantsPage />);

      const addButton = screen.getByRole('button', { name: /add participant/i });
      await userEvent.click(addButton);

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      render(<ParticipantsPage />);

      const addButton = screen.getByRole('button', { name: /add participant/i });
      await userEvent.click(addButton);

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Submit/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument();
    });
  });

  describe('Participant Actions', () => {
    it('should open participant detail on row click', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe' }],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const row = screen.getByText('John Doe').closest('tr');
      await userEvent.click(row!);

      expect(screen.getByText(/Participant Details/i)).toBeInTheDocument();
    });

    it('should delete participant with confirmation', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe' }],
      });
      (ParticipantService.deleteParticipant as any).mockResolvedValue({});

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await userEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(ParticipantService.deleteParticipant).toHaveBeenCalledWith('1');
      });
    });

    it('should update participant status', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', status: 'active' }],
      });
      (ParticipantService.updateParticipant as any).mockResolvedValue({
        id: '1',
        status: 'inactive',
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const statusButton = screen.getByRole('button', { name: /change status/i });
      await userEvent.click(statusButton);

      const inactiveOption = screen.getByText(/Inactive/i);
      await userEvent.click(inactiveOption);

      await waitFor(() => {
        expect(ParticipantService.updateParticipant).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ status: 'inactive' })
        );
      });
    });
  });

  describe('Document Management', () => {
    it('should view participant documents', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', documentCount: 3 }],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const docsLink = screen.getByRole('link', { name: /3 documents/i });
      await userEvent.click(docsLink);

      expect(screen.getByText(/Participant Documents/i)).toBeInTheDocument();
    });

    it('should display no documents message', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', documentCount: 0 }],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const docsLabel = screen.getByText(/0 documents/i);
      expect(docsLabel).toBeInTheDocument();
    });
  });

  describe('Bulk Actions', () => {
    it('should select multiple participants', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [
          { id: '1', fullName: 'John Doe' },
          { id: '2', fullName: 'Jane Smith' },
        ],
      });

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // First participant
      await userEvent.click(checkboxes[2]); // Second participant

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it('should bulk delete participants', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [
          { id: '1', fullName: 'John Doe' },
          { id: '2', fullName: 'Jane Smith' },
        ],
      });
      (ParticipantService.deleteParticipant as any).mockResolvedValue({});

      render(<ParticipantsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);
      await userEvent.click(checkboxes[2]);

      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
      await userEvent.click(bulkDeleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(ParticipantService.deleteParticipant).toHaveBeenCalledWith('1');
        expect(ParticipantService.deleteParticipant).toHaveBeenCalledWith('2');
      });
    });
  });

  describe('Export', () => {
    it('should export participants to CSV', async () => {
      const { ParticipantService } = await import('../src/services/participant.service');
      (ParticipantService.listParticipants as any).mockResolvedValue({
        data: [{ id: '1', fullName: 'John Doe', email: 'john@example.com' }],
      });

      render(<ParticipantsPage />);

      const exportButton = await screen.findByRole('button', { name: /export/i });
      await userEvent.click(exportButton);

      const csvOption = screen.getByText(/CSV/i);
      await userEvent.click(csvOption);

      // Check if CSV was generated
      expect(screen.getByText(/Export complete/i)).toBeInTheDocument();
    });
  });
});
