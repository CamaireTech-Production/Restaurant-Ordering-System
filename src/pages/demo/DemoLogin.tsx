import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ChefHat, AlertCircle, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { useDemoAuth } from '../../contexts/DemoAuthContext';
import { auth, db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getNetworkErrorMessage, checkInternetConnection } from '../../utils/networkUtils';

const DemoLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expired, setExpired] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { signIn, signInWithPhoneAndPassword } = useDemoAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('demoExpired') === 'true') {
      setExpired(true);
      setError('Your demo account has expired.');
      localStorage.removeItem('demoExpired');
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Check internet connection first
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        setError('No internet connection. Please check your network and try again.');
        toast.error('No internet connection. Please check your network and try again.');
        return;
      }
      
      if (loginMode === 'email') {
        await signIn(email, password);
      } else {
        await signInWithPhoneAndPassword(phone, password);
      }
      // Only navigate if not expired
      const demoAccount = JSON.parse(localStorage.getItem('demoAccount') || 'null');
      if (demoAccount && demoAccount.expired) {
        setExpired(true);
        setError('Your demo account has expired.');
      } else {
        navigate('/demo-dashboard');
      }
    } catch (error: any) {
      if (error.message === 'EXPIRED_DEMO_ACCOUNT') {
        setExpired(true);
        setError('Your demo account has expired.');
      } else if (error.message === 'No demo account found with this phone number') {
        setError('No demo account found with this phone number. Please check your number or sign up.');
        toast.error('No demo account found with this phone number.');
      } else {
        const errorMessage = getNetworkErrorMessage(error);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      // Check internet connection first
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        setError('No internet connection. Please check your network and try again.');
        toast.error('No internet connection. Please check your network and try again.');
        return;
      }
      
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      if (userCredential.user && userCredential.user.email) {
        // Check if Firestore demo account exists
        const demoDoc = await getDoc(doc(db, 'demoAccounts', userCredential.user.uid));
        if (!demoDoc.exists()) {
          // Redirect to step 2 of signup with pre-filled email
          navigate('/demo-signup', { state: { email: userCredential.user.email } });
          return;
        }
        // Normal flow: navigate to dashboard
        navigate('/demo-dashboard');
      } else {
        setError('No email found from Google account');
        toast.error('No email found from Google account');
      }
    } catch (error: any) {
      const errorMessage = getNetworkErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder for phone auth (to be implemented)
  // const handlePhoneSignIn = async () => { ... };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <ChefHat size={48} className="text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Demo Account Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your demo restaurant account
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Network Status Indicator */}
          {!isOnline && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-md">
              <WifiOff size={18} />
              <span>You are currently offline. Please check your internet connection.</span>
            </div>
          )}
          
          {expired ? (
            <div className="flex flex-col items-center gap-4">
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                <AlertCircle size={18} />
                <span>Your demo account has expired.</span>
              </div>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                onClick={() => window.open('mailto:support@camairetech.com?subject=Demo%20Account%20Expired', '_blank')}
              >
                Contact Customer Service
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="flex justify-center gap-4 mb-2">
                  <button type="button" onClick={() => setLoginMode('email')} className={`px-3 py-1 rounded ${loginMode === 'email' ? 'bg-primary text-white' : 'bg-gray-200'}`}>Email</button>
                  <button type="button" onClick={() => setLoginMode('phone')} className={`px-3 py-1 rounded ${loginMode === 'phone' ? 'bg-primary text-white' : 'bg-gray-200'}`}>Phone</button>
                </div>
                {loginMode === 'email' ? (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required={loginMode === 'email'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="demo@example.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone number
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required={loginMode === 'phone'}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="e.g. +237612345678"
                      />
                    </div>
                  </div>
                )}
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
                      autoComplete="current-password"
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
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
                <div className="mt-6">
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
                    Google
                  </button>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm">
                  Don't have a demo account?{' '}
                  <Link to="/demo-signup" className="font-medium text-primary hover:text-primary-dark">
                    Create one here
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemoLogin; 