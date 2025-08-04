// Token debugging utility
export const debugTokens = () => {
  console.log('=== TOKEN DEBUG ===');
  console.log('auth_token:', localStorage.getItem('auth_token'));
  console.log('token:', localStorage.getItem('token'));
  console.log('user:', localStorage.getItem('user'));
  
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    try {
      // Decode JWT to check expiration (without verification)
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires at:', new Date(payload.exp * 1000));
      console.log('Current time:', new Date());
      console.log('Token expired:', payload.exp * 1000 < Date.now());
    } catch (e) {
      console.log('Could not decode token:', e);
    }
  }
  console.log('==================');
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true; // Consider invalid tokens as expired
  }
};

// Get token info
export const getTokenInfo = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      role: payload.role,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      exp: payload.exp,
      expiresAt: new Date(payload.exp * 1000),
      isExpired: payload.exp * 1000 < Date.now()
    };
  } catch (e) {
    return null;
  }
};