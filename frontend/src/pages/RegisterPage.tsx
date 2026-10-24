import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { registerSchema, RegisterFormData } from '../schemas/auth.schema';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated]);

  async function onSubmit(data: RegisterFormData) {
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err.response?.data?.error || err.message);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="hidden bg-forest p-14 text-white lg:block">
        <div className="text-3xl font-bold">◉ CarbonDesk</div>
        <h1 className="mt-40 text-5xl font-bold">Create Your Account</h1>
        <p className="mt-5 max-w-md text-lg text-white/75">
          Register as a Carbon Developer to manage projects, participants, and
          MRV data on a unified platform.
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-4 rounded border border-line bg-white p-8 shadow-panel"
          noValidate
        >
          <div>
            <h1 className="text-3xl font-bold text-forest-deep">Create Account</h1>
            <p className="mt-2 text-sm text-stone-600">
              Fill in your information to get started.
            </p>
          </div>

          {/* Full Name */}
          <label className="block text-sm font-bold text-ink">
            Full Name *
            <input
              type="text"
              {...register('fullName')}
              className={`mt-2 w-full rounded border p-3 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 ${
                errors.fullName ? 'border-danger bg-red-50' : 'border-stone-300'
              }`}
              placeholder="Your full name"
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs text-danger">{errors.fullName.message}</span>
            )}
          </label>

          {/* Email */}
          <label className="block text-sm font-bold text-ink">
            Email Address *
            <input
              type="email"
              {...register('email')}
              className={`mt-2 w-full rounded border p-3 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 ${
                errors.email ? 'border-danger bg-red-50' : 'border-stone-300'
              }`}
              placeholder="name@company.com"
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-danger">{errors.email.message}</span>
            )}
          </label>

          {/* Password */}
          <label className="block text-sm font-bold text-ink">
            Password *
            <input
              type="password"
              {...register('password')}
              className={`mt-2 w-full rounded border p-3 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 ${
                errors.password ? 'border-danger bg-red-50' : 'border-stone-300'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-danger">{errors.password.message}</span>
            )}
          </label>

          {/* Confirm Password */}
          <label className="block text-sm font-bold text-ink">
            Confirm Password *
            <input
              type="password"
              {...register('confirmPassword')}
              className={`mt-2 w-full rounded border p-3 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20 ${
                errors.confirmPassword ? 'border-danger bg-red-50' : 'border-stone-300'
              }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <span className="mt-1 block text-xs text-danger">
                {errors.confirmPassword.message}
              </span>
            )}
          </label>

          {/* Organization (optional section) */}
          <details className="rounded bg-stone-50 p-4">
            <summary className="cursor-pointer font-bold text-forest">
              Optional: Organization Information
            </summary>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-bold text-ink">
                Organization Name
                <input
                  type="text"
                  {...register('organizationName')}
                  className="mt-1 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  placeholder="Company/NGO name"
                />
              </label>
              <label className="block text-sm font-bold text-ink">
                Organization Type
                <select
                  {...register('organizationType')}
                  className="mt-1 w-full rounded border border-stone-300 bg-white p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                >
                  <option value="">Select...</option>
                  <option>Private Company</option>
                  <option>NGO</option>
                  <option>Government</option>
                  <option>Academic Institution</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="block text-sm font-bold text-ink">
                Country
                <input
                  type="text"
                  {...register('country')}
                  className="mt-1 w-full rounded border border-stone-300 p-2.5 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  placeholder="Country"
                />
              </label>
            </div>
          </details>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded bg-forest px-4 py-3 font-bold text-white hover:bg-forest-deep disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
            {!isSubmitting && <ArrowRight className="ml-2 inline h-4" />}
          </button>

          <p className="text-center text-xs text-stone-600">
            Already have an account?{' '}
            <a href="/login" className="font-bold text-forest hover:underline">
              Sign in
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
