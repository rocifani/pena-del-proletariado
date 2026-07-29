/** Iconos SVG inline, sin dependencias externas. */

type Props = { className?: string };

const base = "w-5 h-5";

function svgProps(className?: string) {
  return {
    className: className ?? base,
    fill: "none" as const,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": true,
  };
}

export function IconHome({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1"
      />
    </svg>
  );
}

export function IconUsers({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H2v-2a4 4 0 014-4h1m8-4a4 4 0 10-8 0 4 4 0 008 0zm6 4a3 3 0 10-6 0 3 3 0 006 0z"
      />
    </svg>
  );
}

export function IconTrophy({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4v1a4 4 0 004 4M17 6h3v1a4 4 0 01-4 4"
      />
    </svg>
  );
}

export function IconCalendar({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"
      />
    </svg>
  );
}

export function IconRanking({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-6h-4v6z"
      />
    </svg>
  );
}

export function IconLogout({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
      />
    </svg>
  );
}

export function IconMenu({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconClose({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconPlus({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSettings({ className }: Props) {
  return (
    <svg {...svgProps(className)}>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 003.6 15a1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 003.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 008 4.6 1.65 1.65 0 009 3.09V3a2 2 0 114 0v.09A1.65 1.65 0 0016 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0020.4 9c.14.36.44.63.8.79"
      />
    </svg>
  );
}
