import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { rf } from '../constants/responsive';

interface AppTextProps extends TextProps {
  size?: number;
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color?: string;
}

const AppText: React.FC<AppTextProps> = ({ 
  children, 
  style, 
  size = 14, 
  weight = 'normal', 
  color = '#000',
  ...props 
}) => {
  return (
    <Text 
      allowFontScaling={false} 
      style={[{ 
        fontSize: rf(size), 
        fontWeight: weight, 
        color: color 
      }, style]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export default AppText;
