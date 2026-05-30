type PinIconProps = {
  className?: string;
};

/** Pushpin / thumbtack (Tabler-style — distinct from star) */
export default function PinIcon({ className }: PinIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M15 4.5 12 7 9 4.5V10.5L7 12.5V14.5H11V19.5L12 21 13 19.5V14.5H17V12.5L15 10.5V4.5Z" />
    </svg>
  );
}
