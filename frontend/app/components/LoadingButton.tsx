'use client';

import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  disabled?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onClick?: () => void;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  disabled,
  variant = 'contained',
  color = 'primary',
  onClick,
  ...rest
}) => {
  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'info':
        return 'bg-cyan-600 hover:bg-cyan-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'contained':
        return getColorClass();
      case 'outlined':
        return `border border-${color}-600 text-${color}-600 hover:bg-${color}-50`;
      case 'text':
        return `text-${color}-600 hover:bg-${color}-50`;
      default:
        return getColorClass();
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium transition-colors ${getVariantClass()} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="ml-2">Loading...</span>
        </div>
      ) : children}
    </button>
  );
};

export default LoadingButton;
