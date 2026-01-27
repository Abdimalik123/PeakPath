import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";

function Register() {
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      setErrorMessage('All fields are required')
      return
    }
    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await register({
        firstname,
        lastname,
        email,
        password,
        confirm_password: confirmPassword
      })
      
      const token = response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.removeItem('onboarding_complete');
        setSuccessMessage('Profile created! Lets set up your metrics...')

        setTimeout(() => navigate('/onboarding'), 1500);
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Registration failed. System error.")
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordLength = password.length >= 8;

  // Shared Input Styles to match the sleek dark theme
  const inputClass = "w-full bg-[#1c1f2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all";

  return (
    <div className="min-h-screen bg-[#121420] text-gray-300 font-sans selection:bg-cyan-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-[#121420]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
              <h1 className="text-xl font-bold text-white tracking-tight">LIFE<span className="text-cyan-400">TRACKER</span></h1>
            </Link>
            <Link to="/login" className="text-sm font-medium hover:text-cyan-400 transition">Login</Link>
          </div>
        </div>
      </nav>

      {/* Register Form Container */}
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#1c1f2e] border border-white/5 rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden">
          {/* Subtle background glow inside the card */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]"></div>

          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-2">Create Profile</h2>
            <p className="text-sm text-gray-500 uppercase tracking-widest">Start your physical optimization</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">First Name</label>
                <input type="text" placeholder="John" value={firstname} onChange={(e) => setFirstname(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Last Name</label>
                <input type="text" placeholder="Doe" value={lastname} onChange={(e) => setLastname(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Secure Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              {password && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={passwordLength ? 'text-cyan-400' : 'text-amber-500'}>
                    {passwordLength ? '●' : '○'} Min. 8 characters
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Verify Password</label>
              <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
              {confirmPassword && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {passwordsMatch ? (
                    <span className="text-cyan-400">● Identity Confirmed</span>
                  ) : (
                    <span className="text-red-400">○ Passwords mismatch</span>
                  )}
                </div>
              )}
            </div>

            {/* Status Messages */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 text-center font-medium">{errorMessage}</p>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <p className="text-xs text-cyan-400 text-center font-medium">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.15)] ${
                loading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 text-[#121420] hover:bg-cyan-400 active:scale-[0.98]'
              }`}
            >
              {loading ? 'Initializing...' : 'Complete Registration'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-tighter"><span className="px-4 bg-[#1c1f2e] text-gray-600">Established User?</span></div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-sm text-white hover:bg-white/5 transition-all"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-gray-600 text-[11px] mt-8 uppercase tracking-widest">
          By registering, you accept our <a href="#" className="text-cyan-500 hover:underline">Protocols</a> & <a href="#" className="text-cyan-500 hover:underline">Privacy</a>
        </p>
      </div>
    </div>
  );
}

export default Register;