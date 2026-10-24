import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { Sidebar, Topbar } from '../components/layout';
import { DashboardPage } from '../pages/DashboardPage';
import { DocumentsLandingPage } from '../pages/DocumentsLandingPage';
import { SettingsPage } from '../pages/SettingsPage';
import * as projectService from '../services/project.service';
import * as authService from '../services/auth.service';

const mockDeveloper = {
  id: 'dev-123',
  fullName: 'Sakshi Kharade',
  email: 'sakshi@example.com',
  phone: '+1 555-1234',
  organizationName: 'EcoCarbon Solutions',
  organizationType: 'Private Corporation',
  registrationNumber: 'REG-10023',
  country: 'India',
  state: 'Maharashtra',
  city: 'Pune',
  address: '123 Tech Park',
  profileStatus: 'active' as const,
  bio: 'Carbon project developer focused on ARR and IFM.',
  website: 'https://ecocarbon.example.com',
  kycStatus: 'verified' as const,
  lastLoginAt: new Date(),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-02-20'),
};

const mockProjects = [
  {
    id: 'proj-1',
    developerId: 'dev-123',
    name: 'Western Ghats Afforestation',
    projectCode: 'WG-2024-001',
    description: 'High-density native tree planting',
    projectType: 'ARR',
    category: 'Forestry',
    methodology: 'VM0007',
    status: 'active' as const,
    country: 'India',
    stateRegion: 'Maharashtra',
    district: 'Satara',
    cityVillage: 'Mahabaleshwar',
    addressDescription: 'Plot A',
    latitude: 17.9,
    longitude: 73.6,
    startDate: '2024-01-01',
    expectedDurationYears: 30,
    projectAreaHa: 450,
    estimatedAnnualCO2Tonnes: 12000,
    expectedCarbonCredits: 360000,
    targetCertification: 'Verra VCS',
    monitoringFrequency: 'Annual',
    additionalNotes: '',
    participantCount: 14,
    hasGIS: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Navigation & Layout Tests', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('developer', JSON.stringify(mockDeveloper));
    vi.spyOn(authService, 'getMe').mockResolvedValue({ developer: mockDeveloper } as any);
  });


  it('renders all required navigation links in Sidebar', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Sidebar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('CarbonDesk')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('GIS Mapping')).toBeInTheDocument();
    expect(screen.getByText('MRV')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders breadcrumbs and user profile menu in Topbar', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Topbar />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByLabelText('User menu')).toBeInTheDocument();
  });
});

describe('Dashboard Recent Projects & Overview', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('developer', JSON.stringify(mockDeveloper));
    vi.spyOn(authService, 'getMe').mockResolvedValue({ developer: mockDeveloper } as any);

    vi.spyOn(projectService, 'getDashboardStats').mockResolvedValue({
      totalProjects: 1,
      activeProjects: 1,
      totalParticipants: 14,
      gisEnabledProjects: 1,
      totalDocuments: 5,
    });

    vi.spyOn(projectService, 'listProjects').mockResolvedValue({
      data: mockProjects,
      pagination: { total: 1, page: 1, limit: 5, totalPages: 1 },
    });
  });

  it('renders dashboard with stats and recent projects', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Western Ghats Afforestation')).toBeInTheDocument();
      expect(screen.getAllByText('View All Projects').length).toBeGreaterThan(0);
    });
  });
});

describe('Documents Landing Page', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('developer', JSON.stringify(mockDeveloper));
    vi.spyOn(authService, 'getMe').mockResolvedValue({ developer: mockDeveloper } as any);

    vi.spyOn(projectService, 'listProjects').mockResolvedValue({
      data: mockProjects,
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });

  it('renders document vault with project cards and view documents action', async () => {
    render(
      <MemoryRouter initialEntries={['/documents']}>
        <AuthProvider>
          <DocumentsLandingPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Document Management Vault')).toBeInTheDocument();
      expect(screen.getByText('Western Ghats Afforestation')).toBeInTheDocument();
      expect(screen.getByText('View Documents')).toBeInTheDocument();
    });
  });
});

describe('Settings & Profile Page', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('developer', JSON.stringify(mockDeveloper));
    vi.spyOn(authService, 'getMe').mockResolvedValue({ developer: mockDeveloper } as any);
  });

  it('renders profile fields and allows toggling edit mode', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <AuthProvider>
          <SettingsPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Settings & Profile')).toBeInTheDocument();
      expect(screen.getAllByText('Sakshi Kharade').length).toBeGreaterThan(0);
      expect(screen.getAllByText('EcoCarbon Solutions').length).toBeGreaterThan(0);
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    // Toggle edit
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByText('Edit Profile Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sakshi Kharade')).toBeInTheDocument();
  });
});
