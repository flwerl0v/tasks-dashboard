interface ColorScale {
  DEFAULT: string
  [shade: string]: string
}

export interface Palette {
  ink: ColorScale
  surface: ColorScale
  border: ColorScale
  primary: ColorScale
  success: ColorScale
  warning: ColorScale
  danger: ColorScale
  accent: ColorScale
}

export const palette: Palette
