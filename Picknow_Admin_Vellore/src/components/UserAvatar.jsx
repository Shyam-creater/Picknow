import { Avatar } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import { getInitials } from '../utils/stringUtils';
import { getAvatarColor } from '../utils/colorUtils';

export const UserAvatar = ({ user, size = 40 }) => {
  if (!user) return null;

  const initials = getInitials(user.name);
  const showInitials = initials && initials !== '?';

  return (
    <Avatar 
      sx={{ 
        bgcolor: user.role === 'super_admin' ? 
          'error.main' : 
          getAvatarColor(user.name || ''),
        width: size,
        height: size,
        fontSize: size * 0.4, // Scale font size with avatar size
      }}
    >
      {user.role === 'super_admin' ? (
        <SecurityIcon sx={{ fontSize: size * 0.6 }} />
      ) : showInitials ? (
        initials
      ) : (
        <PersonIcon sx={{ fontSize: size * 0.6 }} />
      )}
    </Avatar>
  );
}; 