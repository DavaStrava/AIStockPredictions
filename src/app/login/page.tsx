'use client';

/**
 * Login Page
 * 
 * Social authentication with Google (and optionally GitHub).
 * Redirects to dashboard after successful login.
 * 
 * In demo mode (without Supabase config), redirects to main app.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/auth/supabase-client';
import { TrendingUp, Chrome, Github, Loader2, LineChart, Shield, Smartphone, FlaskConical } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    // In demo mode, redirect to main app
    if (!isSupabaseConfigured()) {
      setIsDemoMode(true);
    }
  }, []);

  const handleDemoAccess = () => {
    router.push(redirectTo);
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(provider);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Authentication is not configured');
        setLoading(null);
        return;
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(null);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              AI Stock Predictions
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Technical analysis powered by artificial intelligence
            </p>
          </div>

          {/* Login card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Sign in to continue
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {isDemoMode ? (
                <>
                  {/* Demo Mode Notice */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <FlaskConical className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-300 text-sm font-medium">Demo Mode Active</p>
                    <p className="text-amber-400/70 text-xs mt-1">
                      Authentication is not configured. Using demo user.
                    </p>
                  </div>

                  {/* Continue to Demo */}
                  <button
                    onClick={handleDemoAccess}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <FlaskConical className="w-5 h-5" />
                    Continue with Demo Account
                  </button>
                </>
              ) : (
                <>
                  {/* Google Login */}
                  <button
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {loading === 'google' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Chrome className="w-5 h-5" />
                    )}
                    Continue with Google
                  </button>

                  {/* GitHub Login */}
                  <button
                    onClick={() => handleSocialLogin('github')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-600 hover:-translate-y-0.5"
                  >
                    {loading === 'github' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Github className="w-5 h-5" />
                    )}
                    Continue with GitHub
                  </button>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isDemoMode 
                ? 'Configure Supabase for social login' 
                : 'By signing in, you agree to our terms of service'}
            </p>
          </div>

          {/* Features highlight */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-xl mb-3">
                <LineChart className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-400">Technical Analysis</p>
            </div>
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-xl mb-3">
                <Smartphone className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-sm text-slate-400">Multi-Device Sync</p>
            </div>
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-xl mb-3">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-400">Secure Login</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} AI Stock Predictions. All rights reserved.
      </footer>
    </div>
  );
}

