import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, children, disabled, ...rest }) => {
  return (
    <Button
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <CircularProgress size={24} /> : children}
    </Button>
  );
};

export default LoadingButton;
