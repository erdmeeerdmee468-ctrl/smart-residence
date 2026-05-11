import Image from "next/image";

type ResidenceLogoProps = {
  className?: string;
  title?: string;
  priority?: boolean;
};

export function ResidenceLogo({
  className = "",
  title = "Undur khotkhon",
  priority = false,
}: ResidenceLogoProps) {
  return (
    <span className={`relative block overflow-hidden ${className}`} aria-label={title} role="img">
      <Image
        src="/photos/logo.png"
        alt={title}
        fill
        priority={priority}
        sizes="96px"
        className="object-contain scale-[1.7]"
      />
    </span>
  );
}
