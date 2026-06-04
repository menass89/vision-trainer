export const Dimensions = {
  get: () => ({ width: 393, height: 852, scale: 3, fontScale: 1 }),
};

export const PixelRatio = {
  get: () => 3,
};

export const Platform = {
  OS: 'ios',
  select: <T,>(options: Record<string, T>): T | undefined => options.ios ?? options.default,
};

export const StyleSheet = {
  hairlineWidth: 1,
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: <T,>(style: T): T => style,
};
