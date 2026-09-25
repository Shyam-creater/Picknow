// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Check if user is logged in
export const checkUserAccess = () => {
  const token = getToken();
  if (!token) {
    throw new Error('Unauthorized access. Please login.');
  }
  return token;
};

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

export const transformImageUrl = (imagePath) => {
  if (!imagePath) return '';

  // If it's a Cloudinary URL, return it directly
  if (imagePath.includes('cloudinary.com')) {
    return imagePath;
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // For local files, construct the URL
  const baseUrl = 'https://backmern.picknow.in';
  return imagePath.startsWith('/') ? `${baseUrl}${imagePath}` : `${baseUrl}/${imagePath}`;
};