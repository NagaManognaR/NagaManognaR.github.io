/* Brand marks (Instagram, LinkedIn, Medium, Substack) and a few UI icons. */

const base = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
});

export function InstagramIcon({ size = 20 }) {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4" />
      <circle cx="12" cy="12" r="4.3" />
      <circle cx="17.45" cy="6.55" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon({ size = 20 }) {
  return (
    <svg {...base(size)} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function MediumIcon({ size = 20 }) {
  return (
    <svg {...base(size)} fill="currentColor">
      <ellipse cx="6.77" cy="12" rx="6.77" ry="6.82" />
      <ellipse cx="17.58" cy="12" rx="3.38" ry="6.42" />
      <ellipse cx="22.81" cy="12" rx="1.19" ry="5.75" />
    </svg>
  );
}

export function SubstackIcon({ size = 20 }) {
  return (
    <svg {...base(size)} fill="currentColor">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  );
}

export function ArrowIcon({ size = 16, direction = 'up-right' }) {
  const d = {
    'up-right': 'M6 18 18 6M8 6h10v10',
    right: 'M4 12h16M13 5l7 7-7 7',
    left: 'M20 12H4M11 5l-7 7 7 7',
  }[direction];
  return (
    <svg
      {...base(size)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function CalendarIcon({ size = 18 }) {
  return (
    <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export const socialIcons = {
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  medium: MediumIcon,
  substack: SubstackIcon,
};
