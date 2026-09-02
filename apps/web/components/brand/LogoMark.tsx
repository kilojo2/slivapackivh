import type { SVGProps } from 'react';

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <defs>
        <linearGradient
          id="slivapack-mark"
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF2D6F" />
          <stop offset="1" stopColor="#A238FF" />
        </linearGradient>
      </defs>
      <path
        d="M15.5 8.4c0-2.1-1.7-3.6-3.7-3.6H9.5C7.7 4.8 6.5 6.1 6.5 8.4c0 2.1 1.4 3.4 3.6 3.4h2.3c2.2 0 3.6 1.3 3.6 3.5 0 2.3-1.7 3.7-4 3.7H9.2c-1.9 0-3.3-1.5-3.3-3.7"
        stroke="url(#slivapack-mark)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}