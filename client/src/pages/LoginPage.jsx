import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout, Input, Button, Card } from '../components/ui/index';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Please enter email and password.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Logged in!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      <Card className="p-10">
        <h2 className="text-2xl font-extrabold font-syne text-white mb-1.5">Welcome back</h2>
        <p className="text-sm text-muted2 mb-8">Sign in to manage your WhatsApp bots</p>

        {error && (
          <div className="bg-red/10 border border-red/30 text-red text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handle}>
          <Input label="Email" icon="✉" type="email" placeholder="you@business.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" icon="🔒" type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />

          <div className="text-right -mt-2 mb-4">
            <Link to="/forgot-password" className="text-xs text-green hover:opacity-70">Forgot password?</Link>
          </div>

          <Button variant="primary" loading={loading} className="w-full mt-2" type="submit">
            Sign In →
          </Button>
        </form>
      </Card>

      <p className="text-center mt-5 text-sm text-muted2">
        Don't have an account?{' '}
        <Link to="/signup" className="text-green font-semibold hover:opacity-80">Create one free →</Link>
      </p>
    </AuthLayout>
  );
}
