export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .split(/\s+/) // Split on any number of whitespace characters
    .map(word => word[0])
    .filter(char => char && /[A-Za-z]/.test(char)) // Only keep letters
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'; // Fallback to '?' if no valid initials
}; 