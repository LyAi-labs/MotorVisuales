import React from "react";
import { DownloadCloud, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface IconLabelSubtextButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  label: string;
  subtext?: string;
  badge?: React.ReactNode;
  tooltip?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  success?: boolean;
  className?: string;
}

function sizeClasses(size: "sm" | "md" | "lg" = "md") {
  switch (size) {
    case "sm":
      return {
        padding: "px-3 py-2",
        icon: "w-4 h-4",
        label: "text-sm",
        subtext: "text-xs",
      };
    case "lg":
      return {
        padding: "px-5 py-3",
        icon: "w-6 h-6",
        label: "text-base",
        subtext: "text-sm",
      };
    case "md":
    default:
      return {
        padding: "px-4 py-2.5",
        icon: "w-5 h-5",
        label: "text-sm font-medium",
        subtext: "text-xs",
      };
  }
}

function variantClasses(variant: "default" | "outline" | "ghost" = "default") {
  switch (variant) {
    case "ghost":
      return "bg-transparent hover:bg-muted/50 border-transparent";
    case "outline":
      return "bg-transparent border border-border hover:bg-muted";
    case "default":
    default:
      return "bg-primary text-primary-foreground hover:bg-primary/90";
  }
}

export const IconLabelSubtextButton = React.forwardRef<
  HTMLButtonElement,
  IconLabelSubtextButtonProps
>(
  (
    {
      icon,
      label,
      subtext,
      badge,
      tooltip,
      variant = "default",
      size = "md",
      loading = false,
      success = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const s = sizeClasses(size);
    const v = variantClasses(variant);

    const buttonElement = (
      <button
        ref={ref}
        type="button"
        className={cn(
          "relative inline-flex items-center gap-3 rounded-2xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring",
          s.padding,
          v,
          className,
          disabled && "opacity-60 cursor-not-allowed"
        )}
        disabled={disabled || loading}
        {...props}
      >
        <span
          className={cn("flex items-center justify-center rounded-md", s.icon)}
          aria-hidden="true"
        >
          {loading ? (
            <Loader2 className={cn(s.icon, "animate-spin")} />
          ) : success ? (
            <Check className={cn(s.icon)} />
          ) : (
            icon ?? <DownloadCloud className={cn(s.icon)} />
          )}
        </span>

        <span className="flex flex-col items-start leading-none text-left">
          <span className={cn(s.label)}>{label}</span>
          {subtext && (
            <span className={cn("text-muted-foreground mt-1", s.subtext)}>
              {subtext}
            </span>
          )}
        </span>

        {badge !== undefined && (
          <span className="absolute -top-2 -right-2">
            <Badge className="p-1 min-w-[1.25rem] h-5 text-[0.65rem] flex items-center justify-center">
              {badge}
            </Badge>
          </span>
        )}
      </button>
    );

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
            <TooltipContent side="top">
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonElement;
  }
);

IconLabelSubtextButton.displayName = "IconLabelSubtextButton";
export default IconLabelSubtextButton;
