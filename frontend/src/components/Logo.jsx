import { Video } from "lucide-react";

export function Logo({ size = "md" }) {
  const sizes = {
    sm: { box: "h-6 w-6", icon: 14, text: "text-sm" },
    md: { box: "h-8 w-8", icon: 17, text: "text-lg" },
    lg: { box: "h-10 w-10", icon: 20, text: "text-xl" },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`${sizes.box} flex items-center justify-center rounded-lg bg-[var(--color-accent)] text-white`}
      >
        <Video size={sizes.icon} strokeWidth={2.25} />
      </span>
      <span className={`${sizes.text} font-semibold tracking-tight text-[var(--color-text)]`}>
        Video Shop
      </span>
    </div>
  );
}
