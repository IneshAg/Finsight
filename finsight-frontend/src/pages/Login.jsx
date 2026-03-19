import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await login(formData.email, formData.password);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      const hasConsent = !!user.consent_id || !!localStorage.getItem('consentId');
      
      toast.success("Welcome back!");
      if (hasConsent) {
        navigate('/dashboard');
      } else {
        navigate('/connect');
      }
    } catch (error) {
       toast.error(error.response?.data?.detail || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-2 text-white font-bold text-3xl mb-2">
          <span className="text-brand">⚡</span> FinSight
        </div>
        <p className="text-muted text-sm">Financial Autopilot</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-800">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-muted mt-1">Your money is waiting for you</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email Address"
                className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm bg-[#1f2937] text-white placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm transition-colors"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Password"
                className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm bg-[#1f2937] text-white placeholder-gray-400 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm transition-colors pr-10"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-brand hover:text-green-400 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-brand hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand focus:ring-offset-base transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-brand hover:text-green-400 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
