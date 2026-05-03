import { generateStyleHubIcon } from "@/app/icon-utils";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return generateStyleHubIcon(32);
}
