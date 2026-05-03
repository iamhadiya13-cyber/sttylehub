export function fallbackImage(src?: string) {
  return src && src.length > 0 ? src : "/next.svg";
}

export function isPollinationsImage(src?: string) {
  return Boolean(src && src.includes("image.pollinations.ai"));
}
