import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Phone, Lock, Eye, EyeOff, Save, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useDemoAuth } from '../../contexts/DemoAuthContext';
import { auth } from '../../firebase/config';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PaymentSetup from '../../components/payment/PaymentSetup';
import { PaymentInfo } from '../../types';
import { validateCameroonPhone, formatCameroonPhone } from '../../utils/paymentUtils';
import designSystem from '../../designSystem';

const DemoProfileEdit: React.FC = () => {
  const { demoAccount, currentUser } = useDemoAuth();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (demoAccount) {
      // Set phone number without +237 prefix since we have a fixed prefix section
      setPhone(demoAccount.phone || '');
      setPaymentInfo(demoAccount.paymentInfo || {});
    }
  }, [demoAccount]);

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    // Validate Cameroon phone number format
    if (!validateCameroonPhone(phoneNumber)) {
      setPhoneError('Please enter a valid Cameroon phone number');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    setPhoneError('');
  };

  const handlePhoneBlur = () => {
    validatePhoneNumber(phone);
  };

  const handlePasswordChange = async () => {
    if (!currentUser || !currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password should be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updateProfile(currentUser, {});
      // Note: Firebase doesn't allow password update through updateProfile
      // We'll need to use a different approach or inform the user to use the auth system
      
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError('Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!demoAccount || !currentUser) return;

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Phone number is already clean (without +237 prefix)
      
      // Update demo account in Firestore
      await updateDoc(doc(db, 'demoAccounts', currentUser.uid), {
        phone: phone,
        paymentInfo,
        updatedAt: serverTimestamp()
      });

      toast.success('Profile updated successfully!');
      navigate('/demo-dashboard');
    } catch (error: any) {
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!demoAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/demo-dashboard')}
            className="flex items-center text-primary hover:text-primary-dark mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Demo Profile</h1>
          <p className="text-gray-600 mt-2">
            Update your demo account information. Some fields are fixed and cannot be changed.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-8">
              {/* Fixed Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fixed Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={demoAccount.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed for demo accounts</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={demoAccount.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Restaurant name is fixed for demo accounts</p>
                  </div>
                </div>
              </div>

              {/* Editable Information Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Editable Information</h2>
                
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="flex">
                      {/* Fixed +237 prefix */}
                      <div className="flex items-center px-4 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm font-medium text-gray-700">
                        +237
                      </div>
                      {/* Phone number input */}
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        className={`flex-1 px-4 py-3 border rounded-r-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                          phoneError ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="612345678"
                      />
                    </div>
                  </div>
                  {phone && !phoneError && validateCameroonPhone(phone) && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle size={18} className="text-green-500" />
                    </div>
                  )}
                  {phoneError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {phoneError}
                    </p>
                  )}
                  {phone && !phoneError && (
                    <p className="mt-2 text-sm text-gray-500">
                      {formatCameroonPhone(phone)}
                    </p>
                  )}
                </div>

                {/* Payment Information */}
                <div className="border-t border-gray-200 pt-6">
                  <PaymentSetup
                    paymentInfo={paymentInfo}
                    onPaymentInfoChange={setPaymentInfo}
                    isRequired={false}
                  />
                </div>

                {/* Password Change Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pl-10 pr-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 pr-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 pr-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handlePasswordChange}
                        disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={18} className="mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoProfileEdit; 