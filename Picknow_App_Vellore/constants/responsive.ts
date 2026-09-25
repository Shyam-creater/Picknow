import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { PixelRatio } from 'react-native';

/**
 * Responsive Font Size - scales based on screen size
 * @param size The font size defined in the design (e.g., 16)
 * @returns Scaled font size
 */
export const rf = (size: number) => {
  const scale = wp('100%') / 375; // 375 is standard design width (iPhone X/11)
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export { wp, hp };
