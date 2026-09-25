// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>> & Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  // Navigation & UI
  'house.fill': 'home',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.left.forwardslash.chevron.right': 'code',
  'xmark': 'close',

  // Ecommerce
  'square.grid.2x2.fill': 'grid-view',
  'cart.fill': 'shopping-cart',
  'bag.fill': 'shopping-bag',
  'heart.fill': 'favorite',
  'star.fill': 'star',

  // Person & Auth
  'person.fill': 'person',
  'person.2.fill': 'people',
  'person.3.fill': 'groups',
  'lock.fill': 'lock',

  // Payments & Finance
  'creditcard.fill': 'credit-card',
  'banknote.fill': 'payments',

  // Shipping & Orders
  'shippingbox.fill': 'inventory',
  'house.circle.fill': 'home-work',
  'clock.fill': 'schedule',

  // Actions
  'paperplane.fill': 'send',
  'trash.fill': 'delete',
  'minus': 'remove',
  'plus': 'add',
  'plus.circle': 'add-circle-outline',
  'eye.fill': 'visibility',
  'checkmark.circle.fill': 'check-circle',
  'magnifyingglass.circle': 'explore',
  'sportscourt.fill': 'sports-cricket',
  'dot.radiowaves.left.and.right': 'live-tv',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
