import { PaymentInfo } from '../types';

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
  paymentInfo?: PaymentInfo
): string => {
  const itemsList = orderItems
    .map(item => `- ${item.title} x ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} FCFA`)
    .join('\n');

  let message = `🍽️ *New Order from ${restaurantName}*\n\n`;
  message += `📋 *Order Details:*\n${itemsList}\n\n`;
  message += `💰 *Total: ${totalAmount.toLocaleString()} FCFA*\n\n`;
  message += `📞 *Customer Phone:* ${customerPhone}\n`;
  message += `📍 *Customer Location:* ${customerLocation}\n\n`;

  // Add payment information if available
  if (paymentInfo && (paymentInfo.momo || paymentInfo.om)) {
    message += `💳 *Payment Methods:*\n`;
    
    if (paymentInfo.momo) {
      const momoCode = generatePaymentCode('momo', paymentInfo.momo.number, totalAmount);
      message += `📱 *MTN Mobile Money:*\n`;
      message += `   Number: ${paymentInfo.momo.number}\n`;
      message += `   Name: ${paymentInfo.momo.name}\n`;
      message += `   USSD Code: \`${momoCode}\`\n\n`;
    }
    
    if (paymentInfo.om) {
      const omCode = generatePaymentCode('om', paymentInfo.om.number, totalAmount);
      message += `📱 *Orange Money:*\n`;
      message += `   Number: ${paymentInfo.om.number}\n`;
      message += `   Name: ${paymentInfo.om.name}\n`;
      message += `   USSD Code: \`${omCode}\`\n\n`;
    }
    
    message += `💡 *Payment Instructions:*\n`;
    message += `1. Dial the USSD code above\n`;
    message += `2. Follow the prompts to complete payment\n`;
    message += `3. Send payment confirmation screenshot\n`;
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