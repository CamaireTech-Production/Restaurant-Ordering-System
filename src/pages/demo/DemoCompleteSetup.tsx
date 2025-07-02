import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, ChefHat, AlertCircle, Phone } from 'lucide-react';
import { useDemoAuth } from '../../contexts/DemoAuthContext';
import { auth, db } from '../../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';

const DemoCompleteSetup: React.FC = () => {
  const { currentUser, demoAccount } = useDemoAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setError('You must be signed in with Google to complete setup.');
    } else if (demoAccount && demoAccount.phone && demoAccount.phone.length > 0) {
      setError('Your demo account setup is already complete.');
    }
  }, [currentUser, demoAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!currentUser) {
      setError('You must be signed in with Google to complete setup.');
      return;
    }
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
      // Link password to Google account
      const credential = EmailAuthProvider.credential(currentUser.email!, password);
      await linkWithCredential(currentUser, credential);
      // Update phone in Firestore
      const demoDocRef = doc(db, 'demoAccounts', currentUser.uid);
      await updateDoc(demoDocRef, { phone });
      toast.success('Setup complete!');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Failed to complete setup. ' + (err.message || ''));
      toast.error('Failed to complete setup.');
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
          Complete Demo Account Setup
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Set your phone number and password to finish your demo account setup.
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
                  value={currentUser?.email || ''}
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
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="••••••••"
                />
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
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Completing setup...' : 'Complete Setup'}
              </button>
            </div>
          </form>
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

export default DemoCompleteSetup; 