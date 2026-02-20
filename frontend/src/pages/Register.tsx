import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { User, Mail, Lock, Loader2, CheckCircle, XCircle } from 'lucide-react';

function Register() {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        firstname,
        lastname,
        email,
        password,
        confirm_password: confirmPassword
      });
      
      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.removeItem('onboarding_complete');
        setSuccessMessage('Profile created! Let\'s set up your metrics...');

        setTimeout(() => navigate('/onboarding'), 1500);
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Registration failed. System error.");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordLength = password.length >= 8;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation showAuthButtons={true} />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-12">
        <div className="w-full max-w-md">
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription>Join PeakPath and start your fitness journey</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">First name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input 
                        type="text" 
                        placeholder="John" 
                        value={firstname} 
                        onChange={(e) => setFirstname(e.target.value)} 
                        className="pp-input pl-12" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Last name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                      <input 
                        type="text" 
                        placeholder="Doe" 
                        value={lastname} 
                        onChange={(e) => setLastname(e.target.value)} 
                        className="pp-input pl-12" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="pp-input pl-12" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="pp-input pl-12" 
                    />
                  </div>
                  {password && (
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
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

                {/* Status Messages */}
                {errorMessage && (
                  <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-[var(--radius-md)]">
                    <p className="text-sm text-[var(--error)] text-center font-medium">{errorMessage}</p>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-[var(--radius-md)]">
                    <p className="text-sm text-[var(--success)] text-center font-medium">{successMessage}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--border-default)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                    Already have an account?
                  </span>
                </div>
              </div>

              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  Sign in
                </Button>
              </Link>

              <p className="text-center text-xs text-[var(--text-muted)] mt-6">
                By registering, you agree to our{' '}
                <a href="#" className="text-[var(--brand-primary)] hover:underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-[var(--brand-primary)] hover:underline">Privacy Policy</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Register;