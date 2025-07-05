import React, { useState } from 'react';
import { User, AlertCircle, CheckCircle } from 'lucide-react';
import { validateCameroonPhone, formatCameroonPhone } from '../../utils/paymentUtils';
import { PaymentInfo } from '../../types';

interface PaymentSetupProps {
  paymentInfo: PaymentInfo;
  onPaymentInfoChange: (paymentInfo: PaymentInfo) => void;
  isRequired?: boolean;
}

const PaymentSetup: React.FC<PaymentSetupProps> = ({
  paymentInfo,
  onPaymentInfoChange,
  isRequired = false
}) => {
  const [errors, setErrors] = useState<{
    momoNumber?: string;
    momoName?: string;
    omNumber?: string;
    omName?: string;
  }>({});

  const validateField = (_type: 'momo' | 'om', field: 'number' | 'name', value: string): string | undefined => {
    if (field === 'number' && value) {
      if (!validateCameroonPhone(value)) {
        return 'Please enter a valid Cameroon phone number';
      }
    }
    if (field === 'name' && value && value.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return undefined;
  };

  const handleFieldChange = (type: 'momo' | 'om', field: 'number' | 'name', value: string) => {
    setErrors(prev => ({
      ...prev,
      [`${type}${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined
    }));

    // Always treat phone number as a string
    let safeValue = value || '';
    if (field === 'number') {
      // Only allow digits
      safeValue = safeValue.replace(/[^0-9]/g, '');
    }

    const updatedPaymentInfo = {
      ...paymentInfo,
      [type]: {
        type,
        number: field === 'number' ? safeValue : paymentInfo[type]?.number || '',
        name: field === 'name' ? value : paymentInfo[type]?.name || ''
      }
    };

    // Remove empty payment methods
    if (type === 'momo' && (!updatedPaymentInfo.momo?.number && !updatedPaymentInfo.momo?.name)) {
      delete updatedPaymentInfo.momo;
    }
    if (type === 'om' && (!updatedPaymentInfo.om?.number && !updatedPaymentInfo.om?.name)) {
      delete updatedPaymentInfo.om;
    }

    onPaymentInfoChange(updatedPaymentInfo);
  };

  const handleFieldBlur = (type: 'momo' | 'om', field: 'number' | 'name', value: string) => {
    const error = validateField(type, field, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [`${type}${field.charAt(0).toUpperCase() + field.slice(1)}`]: error
      }));
    }
  };

  const hasValidPaymentInfo = () => {
    return (
      (paymentInfo.momo?.number && paymentInfo.momo?.name && validateCameroonPhone(paymentInfo.momo.number)) ||
      (paymentInfo.om?.number && paymentInfo.om?.name && validateCameroonPhone(paymentInfo.om.number))
    );
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          💳 Payment Information
          {isRequired && <span className="text-red-500">*</span>}
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Set up your mobile money accounts to receive payments from customers. 
          This information will be included in order notifications.
        </p>
      </div>

      {/* MTN Mobile Money */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900">MTN Mobile Money</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  value={paymentInfo.momo?.number || ''}
                  onChange={(e) => handleFieldChange('momo', 'number', e.target.value)}
                  onBlur={(e) => handleFieldBlur('momo', 'number', e.target.value)}
                  className={`flex-1 px-4 py-3 border border-gray-300 rounded-r-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                    errors.momoNumber ? 'border-red-300' : ''
                  }`}
                  placeholder="612345678"
                />
                {paymentInfo.momo?.number && validateCameroonPhone(paymentInfo.momo.number) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle size={18} className="text-green-500" />
                  </div>
                )}
              </div>
            </div>
            {errors.momoNumber && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.momoNumber}
              </p>
            )}
            {paymentInfo.momo?.number && !errors.momoNumber && (
              <p className="mt-2 text-sm text-gray-500">
                {formatCameroonPhone(paymentInfo.momo.number)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={paymentInfo.momo?.name || ''}
                onChange={(e) => handleFieldChange('momo', 'name', e.target.value)}
                onBlur={(e) => handleFieldBlur('momo', 'name', e.target.value)}
                className={`pl-12 pr-4 py-3 block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                  errors.momoName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. John Doe"
              />
              {paymentInfo.momo?.name && paymentInfo.momo.name.trim().length >= 2 && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
              )}
            </div>
            {errors.momoName && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.momoName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Orange Money */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <h4 className="text-lg font-medium text-gray-900">Orange Money</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  value={paymentInfo.om?.number || ''}
                  onChange={(e) => handleFieldChange('om', 'number', e.target.value)}
                  onBlur={(e) => handleFieldBlur('om', 'number', e.target.value)}
                  className={`flex-1 px-4 py-3 border border-gray-300 rounded-r-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                    errors.omNumber ? 'border-red-300' : ''
                  }`}
                  placeholder="612345678"
                />
                {paymentInfo.om?.number && validateCameroonPhone(paymentInfo.om.number) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle size={18} className="text-green-500" />
                  </div>
                )}
              </div>
            </div>
            {errors.omNumber && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.omNumber}
              </p>
            )}
            {paymentInfo.om?.number && !errors.omNumber && (
              <p className="mt-2 text-sm text-gray-500">
                {formatCameroonPhone(paymentInfo.om.number)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={paymentInfo.om?.name || ''}
                onChange={(e) => handleFieldChange('om', 'name', e.target.value)}
                onBlur={(e) => handleFieldBlur('om', 'name', e.target.value)}
                className={`pl-12 pr-4 py-3 block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                  errors.omName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. John Doe"
              />
              {paymentInfo.om?.name && paymentInfo.om.name.trim().length >= 2 && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
              )}
            </div>
            {errors.omName && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.omName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle size={20} className="text-blue-500 mt-0.5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">Payment Setup Complete</h4>
            <p className="text-sm text-blue-700 mt-2">
              {hasValidPaymentInfo() 
                ? 'Your payment information will be included in customer order notifications. Customers can pay directly using the provided USSD codes.'
                : 'Add at least one payment method to enable mobile money payments for your customers.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup; 