import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const LogoutConfirmationPopup = ({ onConfirm, onCancel }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          padding: 3,
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            from: {
              opacity: 0,
              transform: 'translateY(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <LogoutIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" component="h2" gutterBottom>
          Confirm Logout
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Are you sure you want to logout? You will need to login again to access your account.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="error"
            onClick={onConfirm}
            sx={{
              minWidth: 100,
              '&:hover': {
                backgroundColor: 'error.dark',
              },
            }}
          >
            Logout
          </Button>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              minWidth: 100,
              borderColor: 'grey.300',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'grey.400',
                backgroundColor: 'grey.50',
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LogoutConfirmationPopup; 