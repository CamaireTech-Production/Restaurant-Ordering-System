import { PaymentInfo } from '../types';
import { t } from './i18n';

// Cameroon mobile money USSD codes
export const CAMEROON_PAYMENT_CODES = {
  MOMO: {
    prefix: '*126#',
    transfer: '*126*1*{number}*{amount}#',
    balance: '*126*2#',
  },
  OM: {
    prefix: '*150#',
    transfer: '*150*1*{number}*{amount}#',
    balance: '*150*2#',
  },
};

// Generate USSD code for payment
export const generatePaymentCode = (
  paymentType: 'momo' | 'om',
  phoneNumber: string,
  amount: number
): string => {
  // Remove +237 prefix and clean the number
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '').replace(/^237/, '');
  const code = CAMEROON_PAYMENT_CODES[paymentType.toUpperCase() as keyof typeof CAMEROON_PAYMENT_CODES];
  
  if (!code) {
    throw new Error(`Unsupported payment type: ${paymentType}`);
  }
  
  return code.transfer
    .replace('{number}', cleanNumber)
    .replace('{amount}', amount.toString());
};

// Generate payment message for WhatsApp
export const generatePaymentMessage = (
  restaurantName: string,
  orderItems: Array<{ title: string; quantity: number; price: number }>,
  totalAmount: number,
  customerPhone: string,
  customerLocation: string,
  paymentInfo?: PaymentInfo,
  language: string = 'en',
  customerName?: string
): string => {
  const itemsList = orderItems
    .map(item => `- ${item.title} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} FCFA`)
    .join('\n');

  let message = `🍽️ *${t('new_order_from', language)} ${restaurantName}*\n\n`;
  message += `📋 *${t('order_details', language)}*\n${itemsList}\n\n`;
  message += `💰 *${t('total', language)}: ${totalAmount.toLocaleString()} FCFA*\n\n`;
  message += `📞 *${t('customer_phone', language)}:* ${customerPhone}\n`;
  if (customerName) {
    message += `👤 *${t('customer_name', language)}:* ${customerName}\n`;
  }
  message += `📍 *${t('customer_location', language)}:* ${customerLocation}\n\n`;

  // Add payment information if available
  if (paymentInfo && (paymentInfo.momo || paymentInfo.om)) {
    message += `💳 *${t('payment_methods', language)}*\n`;
    if (paymentInfo.momo) {
      const momoCode = generatePaymentCode('momo', paymentInfo.momo.number, totalAmount);
      message += `📱 *${t('mtn_mobile_money', language)}*\n`;
      message += `   ${t('number', language)}: ${paymentInfo.momo.number}\n`;
      message += `   ${t('name', language)}: ${paymentInfo.momo.name}\n`;
      message += `   ${t('ussd_code', language)}: _*${momoCode}*_\n\n`;
    }
    if (paymentInfo.om) {
      const omCode = generatePaymentCode('om', paymentInfo.om.number, totalAmount);
      message += `📱 *${t('orange_money', language)}*\n`;
      message += `   ${t('number', language)}: ${paymentInfo.om.number}\n`;
      message += `   ${t('name', language)}: ${paymentInfo.om.name}\n`;
      message += `   ${t('ussd_code', language)}: _*${omCode}*_\n\n`;
    }
    message += `💡 *${t('payment_instructions', language)}*\n`;
    message += `1. ${t('copy_ussd_code', language)}\n`;
    message += `2. ${t('open_phone_app', language)}\n`;
    message += `3. ${t('complete_payment_and_send_screenshot', language)}\n`;
  }
  return message;
};

// Open USSD code in phone app
export const openUSSDCode = (code: string): void => {
  // For mobile devices, this will open the phone app with the USSD code
  const telUrl = `tel:${code}`;
  window.location.href = telUrl;
};

// Validate Cameroon phone number format
export const validateCameroonPhone = (phone: string): boolean => {
  // Remove all non-digit characters and +237 prefix
  const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^237/, '');
  
  // Cameroon phone numbers should be 9 digits (without country code)
  if (cleanPhone.length === 9) {
    // 9 digits - local format
    return /^[236789]\d{8}$/.test(cleanPhone);
  }
  
  return false;
};

// Format phone number for display
export const formatCameroonPhone = (phone: string): string => {
  // Remove all non-digit characters and +237 prefix
  const cleanPhone = phone.replace(/[^\d]/g, '').replace(/^237/, '');
  
  if (cleanPhone.length === 9) {
    return `+237 ${cleanPhone}`;
  }
  
  return phone;
}; 