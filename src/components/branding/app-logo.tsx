import {
  PLATFORM_ICON_BLACK,
  PLATFORM_ICON_WHITE,
  PLATFORM_LOGO_BLACK,
  PLATFORM_LOGO_WHITE,
  PLATFORM_NAME,
} from "@/lib/branding";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  variant?: "white" | "black";
  size?: "icon" | "logo";
  className?: string;
  alt?: string;
}

export function AppLogo({
  variant = "black",
  size = "icon",
  className,
  alt = PLATFORM_NAME,
}: AppLogoProps) {
  const src =
    size === "logo"
      ? variant === "white"
        ? PLATFORM_LOGO_WHITE
        : PLATFORM_LOGO_BLACK
      : variant === "white"
        ? PLATFORM_ICON_WHITE
        : PLATFORM_ICON_BLACK;

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain", className)}
    />
  );
}
