import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { Store, MapPin, FileText, Upload, X, ChefHat } from 'lucide-react';

const ProfileSetup: React.FC = () => {
  const { currentUser, restaurant, updateRestaurantProfile } = useAuth();
  const navigate = useNavigate();
  
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

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setAddress(restaurant.address || '');
      setPhone(restaurant.phone || '');
      setDescription(restaurant.description || '');
      setLogoPreview(restaurant.logo || null);
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
      setError('Restaurant name is required');
      toast.error('Restaurant name is required');
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
      });

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <ChefHat size={48} className="mx-auto text-primary" />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Set up your restaurant profile
          </h1>
          <p className="mt-2 text-gray-600">
            Provide information about your restaurant to get started
          </p>
          {currentUser && (
            <Link
              to="/dashboard"
              className="inline-flex items-center mt-4 px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Logo
              </label>
              <div className="flex items-center">
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
                    <span className="mt-2 text-xs text-gray-500">Upload logo</span>
                  </label>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Restaurant Name*
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
                    placeholder="Restaurant name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm flex">
                  <select
                    className="block appearance-none w-24 py-2 pl-3 pr-8 border border-gray-300 bg-white rounded-l-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
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
                    className="block w-full py-2 border-t border-b border-r border-gray-300 rounded-r-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3"
                    placeholder="6 XX XX XX XX"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Cameroon format: 6 XX XX XX XX</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
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
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Restaurant Description
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
                    className="pl-10 block w-full py-2 border border-gray-300 rounded-md shadow-sm focus:ring-rose focus:border-rose sm:text-sm"
                    placeholder="Describe your restaurant, cuisine type, specialties, etc."
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Saving...' : 'Save and Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;