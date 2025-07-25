import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Store, MapPin, FileText, Upload, X, ChefHat, Eye, EyeOff } from 'lucide-react';
import ColorPicker from '../../components/ui/ColorPicker';
import { generateColorPalette } from '../../utils/generateColorPalette';
import { applyColorPaletteToCSSVariables } from '../../utils/applyColorPaletteToCSS';
import designSystem from '../../designSystem';
import PaymentSetup from '../../components/payment/PaymentSetup';
import { PaymentInfo } from '../../types';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { t } from '../../utils/i18n';
import { useLanguage } from '../../contexts/LanguageContext';
import CurrencyDropdown from '../../components/ui/CurrencyDropdown';
import { currencies } from '../../data/currencies';

const ProfileSetup: React.FC = () => {
  const location = useLocation();
  const { restaurant, updateRestaurantProfile } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const [name, setName] = useState(restaurant?.name || '');
  const [address, setAddress] = useState(restaurant?.address || '');
  const [phone, setPhone] = useState(restaurant?.phone || '');
  const [description, setDescription] = useState(restaurant?.description || '');
  const [, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant?.logo || null);
  // Store base64 string for logo
  const [logoBase64, setLogoBase64] = useState<string | null>(restaurant?.logo || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Color palette state
  // Always default to black and white for new users
  const [primaryColor, setPrimaryColor] = useState(restaurant?.colorPalette?.primary || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(restaurant?.colorPalette?.secondary || '#FFFFFF');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(restaurant?.paymentInfo || {});
  const [email, setEmail] = useState(restaurant?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currency, setCurrency] = useState(restaurant?.currency || 'XAF');
  const [deliveryFee, setDeliveryFee] = useState(restaurant?.deliveryFee || 0);
  // Remove mtnFee, orangeFee, and their input fields from the UI and state
  // Always show the currency dropdown in the settings page (not just in payment section)
  // Only show the delivery fee field for the manager to set
  const [mtnMerchantCode, setMtnMerchantCode] = useState(restaurant?.paymentInfo?.mtnMerchantCode || '');
  const [orangeMerchantCode, setOrangeMerchantCode] = useState(restaurant?.paymentInfo?.orangeMerchantCode || '');
  const [paymentLink, setPaymentLink] = useState(restaurant?.paymentInfo?.paymentLink || '');

  // Keep local state in sync if restaurant changes (e.g., after fetch)
  useEffect(() => {
    setPrimaryColor(restaurant?.colorPalette?.primary || designSystem.colors.primary);
    setSecondaryColor(restaurant?.colorPalette?.secondary || designSystem.colors.secondary);
  }, [restaurant]);

  // Apply palette live when colors change
  useEffect(() => {
    // Only apply palette if not on login/register page
    const palette = generateColorPalette(primaryColor, secondaryColor);
    applyColorPaletteToCSSVariables(palette);
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setAddress(restaurant.address || '');
      setPhone(restaurant.phone || '');
      setDescription(restaurant.description || '');
      setLogoPreview(restaurant.logo || null);
      setPaymentInfo(restaurant.paymentInfo || {});
      setEmail(restaurant.email || (auth.currentUser?.email ?? ''));
      setCurrency(restaurant.currency || 'XAF');
      setDeliveryFee(restaurant.deliveryFee || 0);
      setMtnMerchantCode(restaurant.paymentInfo?.mtnMerchantCode || '');
      setOrangeMerchantCode(restaurant.paymentInfo?.orangeMerchantCode || '');
      setPaymentLink(restaurant.paymentInfo?.paymentLink || '');
    }
  }, [restaurant]);


  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      const base64 = await fileToBase64(file);
      setLogoBase64(base64);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    setLogoBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError(t('restaurant_name_required_profile', language));
      toast.error(t('restaurant_name_required_profile', language));
      return;
    }
    setIsLoading(true);
    try {
      // Use base64 logo if available, otherwise keep existing
      let logoData = logoBase64 || restaurant?.logo || '';
      await updateRestaurantProfile({
        name,
        logo: logoData,
        address,
        description,
        phone,
        currency,
        deliveryFee,
        colorPalette: {
          primary: primaryColor,
          secondary: secondaryColor,
        } as any, // allow extra property for Firestore
        paymentInfo: {
          ...paymentInfo,
          mtnMerchantCode,
          orangeMerchantCode,
          paymentLink,
        },
      });
      toast.success(t('profile_updated_success_profile', language), {
        style: {
          background: designSystem.colors.success,
          color: designSystem.colors.textInverse,
        },
      });
      if (!showSidebar) {
        navigate('/dashboard');
      }
      // If showSidebar, do not redirect
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(t('failed_update_profile', language));
      toast.error(t('failed_update_profile', language), {
        style: {
          background: designSystem.colors.error,
          color: designSystem.colors.textInverse,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if we are in dashboard/settings (show sidebar) or onboarding (hide sidebar)
  const showSidebar = location.state && location.state.fromSettings === true;

  // Feature toggles
  const paymentInfoEnabled = !!restaurant?.paymentInfo;
  const colorCustomizationEnabled = restaurant?.colorCustomization === true;

  const content = (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <ChefHat size={48} className="mx-auto text-primary" />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('setup_profile_title_profile', language)}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('setup_profile_desc_profile', language)}
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('logo_colors_label_profile', language)}</label>
              <div className="flex items-center gap-10 flex-wrap">
                {/* Logo upload */}
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Restaurant logo preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#8B0000] transition-colors"
                  >
                    <Upload size={24} className="text-gray-400" />
                    <span className="mt-2 text-xs text-gray-500">{t('upload_logo_profile', language)}</span>
                  </label>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                {/* Color pickers after logo */}
                {colorCustomizationEnabled && (
                  <ColorPicker
                    initialPrimary={primaryColor}
                    initialSecondary={secondaryColor}
                    onChange={(p, s) => {
                      setPrimaryColor(p);
                      setSecondaryColor(s);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('restaurant_name_label_profile', language)}*
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder={t('restaurant_name_placeholder_profile', language)}
                  />
                </div>
              </div>

              {/* Currency Dropdown */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  {t('currency', language)}
                </label>
                <CurrencyDropdown
                  value={currency}
                  onChange={setCurrency}
                  currencies={currencies}
                  language={language}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  {t('phone_label_profile', language)}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm flex">
                  <select
                    className="block appearance-none w-24 py-3 pl-3 pr-8 border border-gray-300 bg-white rounded-l-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    value={'+237'}
                    disabled
                  >
                    <option value="+237">🇨🇲 +237</option>
                  </select>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full py-3 border-t border-b border-r border-gray-300 rounded-r-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3"
                    placeholder={t('phone_placeholder_profile', language)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('phone_hint_profile', language)}</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  {t('address_label_profile', language)}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder={t('address_placeholder_profile', language)}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  {t('description_label_profile', language)}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="pl-10 block w-full py-3 border border-gray-300 rounded-md shadow-sm focus:ring-rose focus:border-rose sm:text-sm"
                    placeholder={t('description_placeholder_profile', language)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Info Section */}
            {paymentInfoEnabled && (
              <div className="mt-8">
                <PaymentSetup
                  paymentInfo={paymentInfo}
                  onPaymentInfoChange={setPaymentInfo}
                  isRequired={false}
                  deliveryFee={deliveryFee}
                  onDeliveryFeeChange={setDeliveryFee}
                  mtnMerchantCode={mtnMerchantCode}
                  setMtnMerchantCode={setMtnMerchantCode}
                  orangeMerchantCode={orangeMerchantCode}
                  setOrangeMerchantCode={setOrangeMerchantCode}
                  paymentLink={paymentLink}
                  setPaymentLink={setPaymentLink}
                />
              </div>
            )}

            {/* Email & Password Edit Section (dashboard only) */}
            {showSidebar && (
              <>
                {/* Change Email */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('change_email_title_profile', language)}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('current_email_label_profile', language)}</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('new_email_label_profile', language)}</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md"
                        placeholder={t('new_email_placeholder_profile', language)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 md:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('current_password_label_profile', language)}</label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={e => setEmailPassword(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md"
                      placeholder={t('current_password_placeholder_profile', language)}
                    />
                  </div>
                  {emailError && <div className="mt-2 text-red-600 text-sm">{emailError}</div>}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isEmailLoading || !newEmail || !emailPassword}
                      className="px-6 py-2 rounded-md bg-primary text-white font-medium disabled:opacity-50"
                      onClick={async () => {
                        setEmailError('');
                        setIsEmailLoading(true);
                        try {
                          if (!auth.currentUser) throw new Error('No user');
                          const credential = EmailAuthProvider.credential(auth.currentUser.email!, emailPassword);
                          await reauthenticateWithCredential(auth.currentUser, credential);
                          await updateEmail(auth.currentUser, newEmail);
                          setEmail(newEmail);
                          setNewEmail('');
                          setEmailPassword('');
                          toast.success(t('email_updated_success_profile', language));
                        } catch (err: any) {
                          setEmailError(err.message || t('failed_update_email_profile', language));
                          toast.error(err.message || t('failed_update_email_profile', language));
                        } finally {
                          setIsEmailLoading(false);
                        }
                      }}
                    >
                      {isEmailLoading ? t('updating_profile', language) : t('update_email_profile', language)}
                    </button>
                  </div>
                </div>
                {/* Change Password */}
                <div className="mt-12 border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('change_password_title_profile', language)}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('current_password_label_profile', language)}</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-md"
                          placeholder={t('current_password_placeholder_profile', language)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(v => !v)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          tabIndex={-1}
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('new_password_label_profile', language)}</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-md"
                          placeholder={t('new_password_placeholder_profile', language)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(v => !v)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('confirm_new_password_label_profile', language)}</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-md"
                          placeholder={t('confirm_new_password_placeholder_profile', language)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {passwordError && <div className="mt-2 text-red-600 text-sm">{passwordError}</div>}
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={isPasswordLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="px-6 py-2 rounded-md bg-primary text-white font-medium disabled:opacity-50"
                      onClick={async () => {
                        setPasswordError('');
                        setIsPasswordLoading(true);
                        try {
                          if (!auth.currentUser) throw new Error('No user');
                          if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
                          if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');
                          const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
                          await reauthenticateWithCredential(auth.currentUser, credential);
                          await updatePassword(auth.currentUser, newPassword);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          toast.success(t('password_updated_success_profile', language));
                        } catch (err: any) {
                          setPasswordError(err.message || t('failed_update_password_profile', language));
                          toast.error(err.message || t('failed_update_password_profile', language));
                        } finally {
                          setIsPasswordLoading(false);
                        }
                      }}
                    >
                      {isPasswordLoading ? t('updating_profile', language) : t('update_password_profile', language)}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t('saving_profile', language) : showSidebar ? t('save_changes_profile', language) : t('save_continue_profile', language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return showSidebar ? (
    <DashboardLayout title={""}>{content}</DashboardLayout>
  ) : content;
};

export default ProfileSetup;