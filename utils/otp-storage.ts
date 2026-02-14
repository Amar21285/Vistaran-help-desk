// Utility functions to handle OTP storage and verification

// Store OTP with expiration time
export const storeOTP = (identifier: string, otp: string, expiryMinutes: number = 10): void => {
  const expiryTime = Date.now() + (expiryMinutes * 60 * 1000); // Convert minutes to milliseconds
  const otpData = {
    otp,
    expiryTime
  };
  
  localStorage.setItem(`vistaran-otp-${identifier}`, JSON.stringify(otpData));
};

// Get stored OTP and check if it's still valid
export const getStoredOTP = (identifier: string): { otp: string; isValid: boolean } | null => {
  try {
    const stored = localStorage.getItem(`vistaran-otp-${identifier}`);
    if (!stored) {
      return null;
    }
    
    const otpData = JSON.parse(stored);
    const isValid = Date.now() < otpData.expiryTime;
    
    return {
      otp: otpData.otp,
      isValid
    };
  } catch (error) {
    console.error('Error retrieving OTP:', error);
    return null;
  }
};

// Remove OTP after verification
export const removeOTP = (identifier: string): void => {
  localStorage.removeItem(`vistaran-otp-${identifier}`);
};

// Clean up expired OTPs (optional cleanup function)
export const cleanupExpiredOTPs = (): void => {
  const keys = Object.keys(localStorage);
  const otpKeys = keys.filter(key => key.startsWith('vistaran-otp-'));
  
  otpKeys.forEach(key => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const otpData = JSON.parse(stored);
        if (Date.now() >= otpData.expiryTime) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      // If parsing fails, remove the key anyway
      localStorage.removeItem(key);
    }
  });
};