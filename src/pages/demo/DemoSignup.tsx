import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ChefHat, AlertCircle, Phone, Eye, EyeOff } from 'lucide-react';
import { useDemoAuth } from '../../contexts/DemoAuthContext';
import { auth } from '../../firebase/config';

const DemoSignup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [googleEmail, setGoogleEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signInWithGoogle, signUp, currentUser } = useDemoAuth();
  const navigate = useNavigate();

  // Step 1: Google sign-in
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Get email from currentUser in context
      if (auth.currentUser && auth.currentUser.email) {
        setGoogleEmail(auth.currentUser.email);
      } else if (currentUser && currentUser.email) {
        setGoogleEmail(currentUser.email);
      }
      setStep(2);
    } catch (error: any) {
      setError('Failed to sign in with Google');
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Phone and password setup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      toast.error('Password should be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      // Use the email from Google sign-in
      await signUp(googleEmail, password, phone);
      toast.success('Demo account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      setError('Failed to create demo account');
      toast.error('Failed to create demo account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ChefHat size={48} className="text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create Demo Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Try the restaurant app with a demo account
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {step === 1 && (
            <div>
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>
            </div>
          )}
          {step === 2 && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={googleEmail}
                    disabled
                    className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="e.g. +237612345678"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          )}
          <div className="mt-6 text-center">
            <p className="text-sm">
              Already have a demo account?{' '}
              <Link to="/demo-login" className="font-medium text-primary hover:text-primary-dark">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoSignup; 