import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function IconSymbol({ name, size = 24, color, style }: {
  name: IconName | string;
  size?: number;
  color?: string;
  style?: any;
}) {
  return <Ionicons name={name as IconName} size={size} color={color} style={style} />;
}
