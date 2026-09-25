const colors = [
  '#1976d2', // blue
  '#388e3c', // green
  '#d32f2f', // red
  '#7b1fa2', // purple
  '#c2185b', // pink
  '#0288d1', // light blue
  '#f57c00', // orange
  '#455a64', // blue grey
  '#00796b', // teal
  '#e64a19', // deep orange
  '#5d4037', // brown
  '#512da8', // deep purple
  '#004d40', // teal dark
  '#263238', // blue grey dark
  '#bf360c', // deep orange dark
  '#1a237e', // indigo dark
];

export const getAvatarColor = (name) => {
  if (!name || typeof name !== 'string') return colors[0];
  
  // Create a more stable hash of the name
  const hash = name
    .trim()
    .toLowerCase()
    .split('')
    .reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc) + code | 0;
    }, 0);
  
  // Ensure positive index and good distribution
  const positiveHash = Math.abs(hash);
  const colorIndex = positiveHash % colors.length;
  return colors[colorIndex];
}; 