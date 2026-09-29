export const ACCENTS = {
  coral: { bright: "#FF6F91", text: "#C93465", tint: "rgba(255,111,145,0.14)", border: "rgba(255,111,145,0.55)" },
  turquoise: { bright: "#1FC8B4", text: "#0B8A7A", tint: "rgba(31,200,180,0.14)", border: "rgba(31,200,180,0.55)" },
  sunny: { bright: "#FFC93C", text: "#A66A00", tint: "rgba(255,201,60,0.16)", border: "rgba(255,201,60,0.55)" },
  lavender: { bright: "#9B7EDE", text: "#6D3FC7", tint: "rgba(155,126,222,0.14)", border: "rgba(155,126,222,0.55)" },
} as const;

export type PillarAccent = keyof typeof ACCENTS;
