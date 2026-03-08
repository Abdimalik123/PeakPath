import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { Lock, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const passwordLength = newPassword.length >= 8;
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await client.post('/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setDone(true);
      showToast('Password updated successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation showAuthButtons={true} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="py-10 text-center">
                <AlertTriangle className="w-12 h-12 text-[var(--warning)] mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Invalid reset link</h2>
                <p className="text-[var(--text-muted)] text-sm mb-6">This link is missing a token. Please request a new password reset.</p>
                <Link to="/forgot-password">
                  <Button variant="primary" className="w-full">Request new link</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation showAuthButtons={true} />

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Set new password</CardTitle>
              <CardDescription>
                {done ? 'Your password has been updated' : 'Choose a strong password for your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-14 h-14 text-[var(--success)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)] text-sm mb-2">Password updated successfully.</p>
                  <p className="text-[var(--text-muted)] text-xs">Redirecting to sign in...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-5 p-4 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-md)]">
                      <p className="text-[var(--error)] text-sm text-center font-medium">{error}</p>
                      {error.includes('expired') && (
                        <div className="mt-3 text-center">
                          <Link to="/forgot-password" className="text-[var(--brand-primary)] text-sm hover:underline">
                            Request a new reset link
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        New password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pp-input pl-12"
                          autoFocus
                        />
                      </div>
                      {newPassword && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {passwordLength ? (
                            <span className="text-[var(--success)] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Min. 8 characters
                            </span>
                          ) : (
                            <span className="text-[var(--warning)] flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Min. 8 characters
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Confirm new password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pp-input pl-12"
                        />
                      </div>
                      {confirmPassword && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {passwordsMatch ? (
                            <span className="text-[var(--success)] flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Passwords match
                            </span>
                          ) : (
                            <span className="text-[var(--error)] flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Passwords don't match
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={loading || !newPassword || !confirmPassword}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Updating password...
                        </>
                      ) : (
                        'Update password'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
