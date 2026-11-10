import React from 'react';

interface NakoLivaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NakoLivaLogo: React.FC<NakoLivaLogoProps> = ({
  className = 'w-4 h-4',
  size = 'md',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Vibrant primary holographic gradient */}
        <linearGradient
          id="nakoliva-glow-grad"
          x1="2"
          y1="2"
          x2="22"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#38BDF8" />
          <stop offset="0.4" stopColor="#6366F1" />
          <stop offset="0.75" stopColor="#A855F7" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>

        {/* Diagonal highlight gradient */}
        <linearGradient
          id="nakoliva-diag-grad"
          x1="6"
          y1="3"
          x2="18"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60A5FA" />
          <stop offset="0.5" stopColor="#818CF8" />
          <stop offset="1" stopColor="#F43F5E" />
        </linearGradient>

        {/* Right pillar light gradient */}
        <linearGradient
          id="nakoliva-right-grad"
          x1="18"
          y1="3"
          x2="18"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#C084FC" />
          <stop offset="1" stopColor="#F43F5E" />
        </linearGradient>
      </defs>

      {/* Modern sculpted letter 'N' logo */}
      {/* Left Pillar */}
      <rect
        x="3.75"
        y="3"
        width="4"
        height="18"
        rx="2"
        fill="url(#nakoliva-glow-grad)"
      />

      {/* Right Pillar */}
      <rect
        x="16.25"
        y="3"
        width="4"
        height="18"
        rx="2"
        fill="url(#nakoliva-right-grad)"
      />

      {/* Connecting Dynamic Diagonal Ribbon with Soft Corners */}
      <path
        d="M 5.8 4.2 C 6.5 3.3 7.8 3.3 8.5 4.3 L 17.5 17.8 C 18.3 18.9 17.7 20.5 16.3 20.8 C 15.6 20.9 14.9 20.6 14.5 20.0 L 5.5 6.5 C 4.7 5.4 5.3 3.8 6.7 3.5 C 7.0 3.4 7.4 3.5 7.6 3.7 Z"
        fill="url(#nakoliva-diag-grad)"
      />

      {/* Subtle Specular Core Sparkle on N joint */}
      <circle cx="16.5" cy="5.5" r="1.2" fill="#FFFFFF" fillOpacity="0.85" />
      <circle cx="7.5" cy="18.5" r="1.2" fill="#FFFFFF" fillOpacity="0.75" />
    </svg>
  );
};
