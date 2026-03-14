import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout, Input, Button, Card } from '../components/ui/index';
import toast from 'react-hot-toast';
import { AuthAPI } from '../services/api';

// ── Signup ─────────────────────────────────────────
export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName:'', lastName:'', businessName:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({
    w: "0%",
    c: "transparent",
    label: "Enter a password",
  });

  const checkPwd = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
      { w: "0%", c: "transparent", label: "Enter a password" },
      { w: "25%", c: "#FF4D4D", label: "Weak" },
      { w: "50%", c: "#FFB400", label: "Fair" },
      { w: "75%", c: "#88cc44", label: "Good" },
      { w: "100%", c: "#00D46A", label: "Strong ✓" },
      { w: "100%", c: "#00D46A", label: "Strong ✓" },
    ];
    setStrength(levels[score] || levels[0]);
    setForm(f => ({ ...f, password: val }));
  };

  const handle = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName) return setError('Please enter your name.');
    if (!form.email) return setError("Email is required.");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AuthLayout>
      <Card className="p-5 sm:p-10">
        <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white mb-1.5">
          Create your account
        </h2>
        <p className="text-xs sm:text-sm text-muted2 mb-6 sm:mb-8">
          Start with 14 days free — no credit card required
        </p>

        {error && (
          <div className="bg-red/10 border border-red/30 text-red text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handle}>
          {/* Name row — stacks on very small screens */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              icon="👤"
              placeholder="Rahul"
              value={form.firstName}
              onChange={set("firstName")}
              autoComplete="given-name"
            />
            <div className="mb-4">
              <label className="label">Last Name</label>
              <input
                className="input"
                placeholder="Sharma"
                value={form.lastName}
                onChange={set("lastName")}
                autoComplete="family-name"
              />
            </div>
          </div>

          <Input
            label="Business Name"
            icon="🏢"
            placeholder="Pizza Palace"
            value={form.businessName}
            onChange={set("businessName")}
            autoComplete="organization"
          />
          <Input
            label="Email"
            icon="✉"
            type="email"
            placeholder="you@business.com"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
            inputMode="email"
          />

          {/* Password with strength meter */}
          <div className="mb-4">
            <label className="label">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base">
                🔒
              </span>
              <input
                className="input pl-10"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => checkPwd(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="mt-2">
              <div className="h-1 bg-dark3 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: strength.w, background: strength.c }}
                />
              </div>
              <span
                className="text-xs"
                style={{
                  color: strength.c === "transparent" ? "#3A5548" : strength.c,
                }}
              >
                {strength.label}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            loading={loading}
            className="w-full mt-2 py-3 sm:py-3.5 text-sm sm:text-base"
            type="submit"
          >
            Create Account & Start Setup →
          </Button>
        </form>
      </Card>

      <p className="text-center mt-4 sm:mt-5 text-sm text-muted2">
        Already have an account?{" "}
        <Link to="/login" className="text-green font-semibold hover:opacity-80">
          Sign in →
        </Link>
      </p>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4 sm:mt-5">
        {["🔒 256-bit SSL", "✅ No credit card", "🇮🇳 Made in India"].map(
          (t) => (
            <span key={t} className="text-xs text-muted">
              {t}
            </span>
          )
        )}
      </div>
    </AuthLayout>
  );
}

// ── Forgot Password ────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e?.preventDefault();
    if (!email) return setError('Please enter your email.');
    setLoading(true);
    try {
      await AuthAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <Card className="p-6 sm:p-10">
        <h2 className="text-xl sm:text-2xl font-extrabold font-syne text-white mb-1.5">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-muted2 mb-6 sm:mb-8">
          Enter your email to receive a reset link
        </p>

        {sent ? (
          <div className="bg-green/10 border border-green/30 text-green text-sm px-4 py-3 rounded-xl">
            ✓ If that email is registered, a reset link has been sent. Check
            your inbox.
          </div>
        ) : (
          <form onSubmit={handle}>
            {error && (
              <div className="bg-red/10 border border-red/30 text-red text-sm px-4 py-2.5 rounded-xl mb-4">
                {error}
              </div>
            )}
            <Input
              label="Email"
              icon="✉"
              type="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
            <Button
              variant="primary"
              loading={loading}
              className="w-full mt-2 py-3 sm:py-3.5"
              type="submit"
            >
              Send Reset Link →
            </Button>
          </form>
        )}
      </Card>

      <p className="text-center mt-4 sm:mt-5 text-sm text-muted2">
        <Link to="/login" className="text-green hover:opacity-80">
          ← Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SignupPage;