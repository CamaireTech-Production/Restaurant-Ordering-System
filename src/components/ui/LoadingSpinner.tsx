import React from 'react';
import { Oval } from 'react-loader-spinner';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40, 
  color = '#8B0000' 
}) => {
  return (
    <Oval
      height={size}
      width={size}
      color={color}
      visible={true}
      secondaryColor="#FFD700"
      strokeWidth={4}
      strokeWidthSecondary={4}
    />
  );
};

export default LoadingSpinner;