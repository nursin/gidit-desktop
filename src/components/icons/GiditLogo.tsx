import React from "react";

export interface GiditLogoProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

/**
 * Simple SVG logo component for the renderer.
 * Kept as a pure React component so it can be used anywhere in the Vite + React app.
 */
export const GiditLogo: React.FC<GiditLogoProps> = ({ title = "Gidit", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    role="img"
    aria-label={title}
    {...props}
  >
    <title>{title}</title>
    <rect width="24" height="24" rx="6" fill="#6d28d9" />
    <path
      d="M3.75 3.75H20.25V12.75C20.25 12.75 14.25 4.5 12 4.5C9.75 4.5 3.75 12.75 3.75 12.75V3.75Z"
      fill="white"
    />
    <circle cx="12" cy="15.75" r="1.5" fill="white" />
    <circle cx="12" cy="19.5" r="1.5" fill="white" />
  </svg>
);

export default GiditLogo;
