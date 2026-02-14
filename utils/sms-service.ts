import { useSettings } from '../hooks/useSettings';

// Interface for SMS provider configuration
interface SMSConfig {
  provider: string;
  apiKey: string;
  apiSecret?: string;
  senderId: string;
}

// Function to get SMS configuration from localStorage
const getSMSConfig = (): SMSConfig | null => {
  const provider = localStorage.getItem('vistaran-smsProvider') || '';
  const apiKey = localStorage.getItem('vistaran-apiKey') || '';
  const apiSecret = localStorage.getItem('vistaran-apiSecret') || '';
  const senderId = localStorage.getItem('vistaran-senderId') || '';
  
  if (!provider || !apiKey) {
    return null;
  }
  
  return {
    provider,
    apiKey,
    apiSecret,
    senderId
  };
};

// Function to send SMS OTP
export const sendSMSOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
  const config = getSMSConfig();
  
  if (!config) {
    console.error('SMS configuration not found. Please configure SMS settings in Integration Settings.');
    return false;
  }
  
  try {
    // Format phone number to international format if needed
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    let response;
    
    // Send SMS based on configured provider
    switch (config.provider.toLowerCase()) {
      case 'twilio':
        response = await sendTwilioSMS(formattedNumber, otp, config);
        break;
      case 'msg91':
        response = await sendMSG91SMS(formattedNumber, otp, config);
        break;
      case 'textlocal':
        response = await sendTextLocalSMS(formattedNumber, otp, config);
        break;
      default:
        console.error(`Unsupported SMS provider: ${config.provider}`);
        return false;
    }
    
    return response.success;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    return false;
  }
};

// Twilio SMS provider implementation
const sendTwilioSMS = async (to: string, otp: string, config: SMSConfig) => {
  const accountSid = config.apiKey; // Twilio Account SID
  const authToken = config.apiSecret; // Twilio Auth Token
  
  if (!authToken) {
    throw new Error('Twilio Auth Token is required');
  }
  
  const message = `Your Vistaran Help Desk OTP is: ${otp}. Valid for 10 minutes.`;
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
    },
    body: new URLSearchParams({
      From: config.senderId || '+1234567890', // Twilio number
      To: to,
      Body: message,
    }),
  });
  
  const result = await response.json();
  
  return {
    success: response.ok,
    messageSid: result.sid,
    error: result.error ? result.error.message : null
  };
};

// MSG91 SMS provider implementation
const sendMSG91SMS = async (to: string, otp: string, config: SMSConfig) => {
  const templateId = 'YOUR_TEMPLATE_ID'; // This would need to be configured
  const message = `Your Vistaran Help Desk OTP is: ${otp}. Valid for 10 minutes.`;
  
  const response = await fetch(`https://api.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${to.replace('+', '')}&authkey=${config.apiKey}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const result = await response.json();
  
  return {
    success: response.ok,
    data: result,
  };
};

// TextLocal SMS provider implementation
const sendTextLocalSMS = async (to: string, otp: string, config: SMSConfig) => {
  const message = `Your Vistaran Help Desk OTP is: ${otp}. Valid for 10 minutes.`;
  
  const response = await fetch('https://api.textlocal.in/send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      apikey: config.apiKey,
      numbers: to,
      message: message,
      sender: config.senderId || 'TXTLCL',
    }),
  });
  
  const result = await response.json();
  
  return {
    success: response.ok && result.status === 'success',
    data: result,
  };
};

// Function to generate OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Function to verify OTP (in a real implementation, this would check against stored OTPs)
export const verifyOTP = (inputOTP: string, storedOTP: string, expiryTime: number): boolean => {
  if (Date.now() > expiryTime) {
    return false; // OTP expired
  }
  return inputOTP === storedOTP;
};