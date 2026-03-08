import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await client.post('/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation showAuthButtons={true} />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Forgot password?</CardTitle>
              <CardDescription>
                {sent
                  ? "Check your inbox for the reset link"
                  : "Enter your email and we'll send you a reset link"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center py-4">
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="w-14 h-14 text-[var(--success)]" />
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                    If an account exists for <strong className="text-[var(--text-primary)]">{email}</strong>, a password reset link has been sent. Check your spam folder if you don't see it.
                  </p>
                  <Link to="/login">
                    <Button variant="secondary" className="w-full">
                      <ArrowLeft className="w-4 h-4" />
                      Back to sign in
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-5 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-md)]">
                      <p className="text-[var(--error)] text-sm text-center font-medium">{error}</p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pp-input pl-12"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to sign in
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
