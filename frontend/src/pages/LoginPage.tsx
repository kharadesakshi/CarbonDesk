import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../schemas/auth.schema';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated]);

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
      setError('email', { message: errorMsg });
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="hidden bg-forest p-14 text-white lg:block">
        <div className="text-3xl font-bold">◉ CarbonDesk</div>
        <h1 className="mt-40 text-5xl font-bold">Enterprise Carbon Management</h1>
        <p className="mt-5 max-w-md text-lg text-white/75">
          A unified workspace for project teams, MRV collection, and land management.
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md rounded border border-line bg-white p-8 shadow-panel"
          noValidate
        >
          <span className="rounded bg-stone-100 px-2 py-1 text-xs font-bold text-forest">BETA</span>
          <h1 className="mt-4 text-3xl font-bold text-forest-deep">Welcome back</h1>
          <p className="mt-2 text-sm text-stone-600">Sign in with your CarbonDesk account.</p>

          <div className="mt-7 space-y-5">
            <label className="block text-sm font-bold text-ink">
              Email Address
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

            <label className="block text-sm font-bold text-ink">
              Password
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded bg-forest px-4 py-3 font-bold text-white hover:bg-forest-deep disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="mt-5 text-center text-xs text-stone-600">
            Don't have an account?{' '}
            <a href="/register" className="font-bold text-forest hover:underline">
              Create one
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
