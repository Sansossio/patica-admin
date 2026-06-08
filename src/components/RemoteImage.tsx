import { cn } from "@/lib/cn";

/**
 * Renders a remote (CDN) image, or a paw placeholder when there is no URL —
 * never emits <img src="">, which triggers a browser refetch warning.
 */
export function RemoteImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-surface-2 text-subtle", className)}>
        <span aria-hidden>🐾</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? ""} className={className} />;
}
