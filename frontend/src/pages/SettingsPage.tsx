import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Shield,
  FileText,
  Building2,
  MapPin,
  Lock,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AppShell, PageHeader } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/auth.service';

export function SettingsPage() {
  const { developer, updateProfile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security'>(
    initialTab === 'account' ? 'account' : initialTab === 'security' ? 'security' : 'profile'
  );

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'account' || tabParam === 'security' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'profile' | 'account' | 'security') => {
    setActiveTab(tab);
    setSearchParams(tab === 'profile' ? {} : { tab });
  };

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: developer?.fullName || '',
    phone: developer?.phone || '',
    organizationName: developer?.organizationName || '',
    organizationType: developer?.organizationType || '',
    registrationNumber: developer?.registrationNumber || '',
    country: developer?.country || '',
    state: developer?.state || '',
    city: developer?.city || '',
    address: developer?.address || '',
    bio: developer?.bio || '',
    website: developer?.website || '',
  });

  // Keep form data in sync if developer updates
  useEffect(() => {
    if (developer) {
      setFormData({
        fullName: developer.fullName || '',
        phone: developer.phone || '',
        organizationName: developer.organizationName || '',
        organizationType: developer.organizationType || '',
        registrationNumber: developer.registrationNumber || '',
        country: developer.country || '',
        state: developer.state || '',
        city: developer.city || '',
        address: developer.address || '',
        bio: developer.bio || '',
        website: developer.website || '',
      });
    }
  }, [developer]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        throw new Error('Full Name must be at least 2 characters long.');
      }

      await updateProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || null,
        organizationName: formData.organizationName.trim() || null,
        organizationType: formData.organizationType.trim() || null,
        registrationNumber: formData.registrationNumber.trim() || null,
        country: formData.country.trim() || null,
        state: formData.state.trim() || null,
        city: formData.city.trim() || null,
        address: formData.address.trim() || null,
        bio: formData.bio.trim() || null,
        website: formData.website.trim() || null,
      });

      setProfileSuccess('Your profile has been saved successfully.');
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err?.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess('Password has been changed successfully. Your account is secured.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to change password. Please verify your current password.'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // Copy Account ID
  const [copiedId, setCopiedId] = useState(false);
  const handleCopyId = () => {
    if (developer?.id) {
      navigator.clipboard.writeText(developer.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const initials = developer?.fullName
    ? developer.fullName
        .split(' ')
        .filter(Boolean)
        .map((x) => x[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CD';

  return (
    <AppShell>
      <PageHeader
        title="Settings & Profile"
        description="Manage your enterprise carbon developer profile, organization details, and account security."
      />

      {/* Profile Overview Header Card */}
      <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-forest font-black text-2xl text-white shadow-md ring-4 ring-emerald-500/10">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight text-forest-deep">
                  {developer?.fullName || 'Carbon Developer'}
                </h2>
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-success border border-emerald-200">
                  {developer?.profileStatus || 'Active Account'}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-600 flex items-center gap-2">
                <Mail size={13} className="text-stone-400" />
                <span>{developer?.email}</span>
                {developer?.organizationName && (
                  <>
                    <span className="text-stone-300">•</span>
                    <Building2 size={13} className="text-stone-400" />
                    <span className="font-semibold text-stone-700">{developer.organizationName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {activeTab === 'profile' && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-forest-deep active:scale-95 self-start sm:self-auto"
            >
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-stone-200 gap-6 overflow-x-auto">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-forest text-forest'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User size={18} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => handleTabChange('account')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'account'
                ? 'border-forest text-forest'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText size={18} />
            <span>Account Information</span>
          </button>

          <button
            onClick={() => handleTabChange('security')}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-forest text-forest'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Shield size={18} />
            <span>Security & Password</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {profileSuccess && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-success animate-in fade-in">
          <CheckCircle2 size={18} />
          <span>{profileSuccess}</span>
        </div>
      )}
      {profileError && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-danger animate-in fade-in">
          <AlertCircle size={18} />
          <span>{profileError}</span>
        </div>
      )}

      {/* TAB 1: My Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {isEditing ? (
            /* Edit Profile Form */
            <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
              <div className="mb-6 border-b border-stone-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-forest-deep">Edit Profile Details</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Update your personal and organizational carbon developer credentials
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Personal Information
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleFormChange}
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="pt-4 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Organization Details
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleFormChange}
                        placeholder="e.g., Green Earth Carbon Ltd."
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Organization Type
                      </label>
                      <select
                        name="organizationType"
                        value={formData.organizationType}
                        onChange={handleFormChange}
                        className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      >
                        <option value="">Select type...</option>
                        <option value="Private Corporation">Private Corporation</option>
                        <option value="Non-Profit / NGO">Non-Profit / NGO</option>
                        <option value="Community Cooperative">Community Cooperative</option>
                        <option value="Government Entity">Government Entity</option>
                        <option value="Academic / Research">Academic / Research</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Registration / Tax ID
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleFormChange}
                        placeholder="e.g., REG-8921893"
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Location & Address */}
                <div className="pt-4 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    Headquarters / Location
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleFormChange}
                        placeholder="e.g., Kenya"
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleFormChange}
                        placeholder="e.g., Nairobi"
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleFormChange}
                        placeholder="e.g., Nairobi"
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      placeholder="e.g., 45 Kilimani Road, Suite 200"
                      className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="pt-4 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    About & Web
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Website URL
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleFormChange}
                        placeholder="https://example.com"
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Developer Bio / Statement
                      </label>
                      <textarea
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleFormChange}
                        placeholder="Describe your carbon project development experience and portfolio focus..."
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-forest-deep disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{savingProfile ? 'Saving Changes...' : 'Save Profile'}</span>
                  </button>
                </div>
              </form>
            </section>
          ) : (
            /* View Profile Mode */
            <div className="grid gap-6 md:grid-cols-2">
              {/* Card 1: Personal & Organization Details */}
              <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4 border-b border-stone-100 pb-3">
                  <User size={18} className="text-forest" />
                  <h3 className="font-bold text-forest-deep text-base">Identity & Organization</h3>
                </div>

                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Full Legal Name
                    </dt>
                    <dd className="mt-1 font-semibold text-ink text-base">
                      {developer?.fullName || 'Not specified'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Organization Name
                    </dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {developer?.organizationName || 'Individual Developer'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Organization Type
                    </dt>
                    <dd className="mt-1 text-stone-700">
                      {developer?.organizationType || 'Not specified'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Registration / Tax Number
                    </dt>
                    <dd className="mt-1 font-mono text-stone-700 text-xs">
                      {developer?.registrationNumber || 'Not provided'}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Card 2: Contact & Communications */}
              <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4 border-b border-stone-100 pb-3">
                  <Phone size={18} className="text-forest" />
                  <h3 className="font-bold text-forest-deep text-base">Contact & Communications</h3>
                </div>

                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Account Email Address
                    </dt>
                    <dd className="mt-1 font-medium text-stone-800 flex items-center gap-1.5">
                      <Mail size={14} className="text-stone-400" />
                      <span>{developer?.email}</span>
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
                        Primary
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Phone Number
                    </dt>
                    <dd className="mt-1 text-stone-700 flex items-center gap-1.5">
                      <Phone size={14} className="text-stone-400" />
                      <span>{developer?.phone || 'Not provided'}</span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Website
                    </dt>
                    <dd className="mt-1 text-stone-700 flex items-center gap-1.5">
                      <Globe size={14} className="text-stone-400" />
                      {developer?.website ? (
                        <a
                          href={developer.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-forest font-semibold hover:underline"
                        >
                          {developer.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Primary Location
                    </dt>
                    <dd className="mt-1 text-stone-700 flex items-center gap-1.5">
                      <MapPin size={14} className="text-stone-400" />
                      <span>
                        {[developer?.city, developer?.state, developer?.country]
                          .filter(Boolean)
                          .join(', ') || 'Not specified'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Card 3: Address & Bio */}
              <section className="md:col-span-2 rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4 border-b border-stone-100 pb-3">
                  <MapPin size={18} className="text-forest" />
                  <h3 className="font-bold text-forest-deep text-base">Address & Developer Bio</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Physical Address
                    </p>
                    <p className="mt-1 text-stone-700">
                      {developer?.address || 'No street address specified.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Developer Bio
                    </p>
                    <p className="mt-1 text-stone-700 leading-relaxed">
                      {developer?.bio || 'No bio or background statement provided yet.'}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Account Information */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="mb-4 border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-forest-deep flex items-center gap-2">
                <FileText size={18} className="text-forest" />
                <span>Account Identifiers & Status</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                System credentials, database identifiers, and regulatory KYC tracking
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Developer Account ID
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-stone-800 select-all truncate">
                    {developer?.id || '—'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-bold text-stone-700 border border-stone-200 hover:bg-stone-100"
                  >
                    {copiedId ? (
                      <>
                        <Check size={12} className="text-success" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Account Email (Protected)
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Lock size={14} className="text-stone-400" />
                  <span className="font-semibold text-stone-800 text-sm">
                    {developer?.email}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Locked for authentication integrity. Contact support to request email changes.
                </p>
              </div>

              <div className="rounded-lg bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  KYC Verification Status
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-success" />
                  <span className="font-bold text-success text-sm uppercase">
                    {developer?.kycStatus || 'Not Started'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-stone-500">
                  Required for issuing verified carbon units (VCUs) onto registry accounts.
                </p>
              </div>

              <div className="rounded-lg bg-stone-50 p-4 border border-stone-200">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Account Timeline
                </p>
                <div className="mt-2 space-y-1 text-xs text-stone-700">
                  <p>
                    Member Since:{' '}
                    <strong>
                      {developer?.createdAt
                        ? new Date(developer.createdAt).toLocaleDateString()
                        : 'Active'}
                    </strong>
                  </p>
                  <p>
                    Last Login:{' '}
                    <strong>
                      {developer?.lastLoginAt
                        ? new Date(developer.lastLoginAt).toLocaleString()
                        : 'Active session'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Isolation Card */}
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
            <h4 className="font-bold text-sm text-forest-deep flex items-center gap-2">
              <Shield size={16} className="text-forest" />
              <span>Security & Data Ownership</span>
            </h4>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              All project portfolios, participant records, Mapbox GIS boundaries, and document uploads in this tenant are cryptographically scoped to your Developer ID. Access tokens are generated with JWT HMAC-SHA256 signatures and valid for 7 days.
            </p>
          </section>
        </div>
      )}

      {/* TAB 3: Security & Password Change */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs max-w-2xl">
            <div className="mb-6 border-b border-stone-100 pb-4">
              <h3 className="text-base font-bold text-forest-deep flex items-center gap-2">
                <KeyRound size={18} className="text-forest" />
                <span>Change Account Password</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Passwords are encrypted using bcrypt hashing (12 salt rounds)
              </p>
            </div>

            {passwordSuccess && (
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-success">
                <CheckCircle2 size={18} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-danger">
                <AlertCircle size={18} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-lg border border-stone-300 p-2.5 pr-10 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    className="w-full rounded-lg border border-stone-300 p-2.5 pr-10 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    aria-label="Toggle password visibility"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full rounded-lg border border-stone-300 p-2.5 pr-10 text-sm text-ink outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirement Checklist */}
              <div className="rounded-lg bg-stone-50 p-4 border border-stone-200 space-y-2 text-xs">
                <p className="font-bold text-stone-700">Password Requirements:</p>
                <div className="space-y-1 text-stone-600">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hasMinLength ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                    <span className={hasMinLength ? 'text-forest font-semibold' : ''}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hasUppercase ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                    <span className={hasUppercase ? 'text-forest font-semibold' : ''}>
                      At least one uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hasNumber ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                    <span className={hasNumber ? 'text-forest font-semibold' : ''}>
                      At least one number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        passwordsMatch ? 'bg-emerald-500' : 'bg-stone-300'
                      }`}
                    />
                    <span className={passwordsMatch ? 'text-forest font-semibold' : ''}>
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={changingPassword || !isPasswordValid || !currentPassword}
                  className="flex items-center justify-center gap-2 rounded-lg bg-forest px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-forest-deep disabled:opacity-40 transition"
                >
                  <Lock size={15} />
                  <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}
