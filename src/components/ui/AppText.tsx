import { Text, type TextProps } from 'react-native';

import { ACCENT, tabularFigures, text, type as typo } from '@/theme/tokens';

export type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'micro' | 'hero';
export type ColorKey = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: ColorKey;
  tabular?: boolean;
  uppercase?: boolean;
};

export function AppText({
  variant = 'body',
  color = 'primary',
  tabular = false,
  uppercase = false,
  style,
  ...props
}: AppTextProps) {
  const resolvedColor = color === 'accent' ? ACCENT : text[color];

  return (
    <Text
      {...props}
      style={[
        typo[variant],
        { color: resolvedColor },
        tabular && { ...tabularFigures, fontVariant: [...tabularFigures.fontVariant] },
        uppercase && styles.uppercase,
        style,
      ]}
    />
  );
}

const styles = {
  uppercase: {
    textTransform: 'uppercase',
  },
} as const;
