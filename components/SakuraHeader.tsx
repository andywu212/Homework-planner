// Decorative mountain-and-sakura banner adapted from the provided mockup,
// used behind the header on every screen for a consistent look. Pure
// inline SVG, no image assets. Anchored to the top (xMidYMin) so the sun
// and cherry blossoms stay visible even in the shorter banner heights
// used on non-Today screens.
export default function SakuraHeader({ height = 190 }: { height?: number }) {
  return (
    <div
      className="absolute inset-x-0 top-0 overflow-hidden rounded-b-3xl -z-10"
      style={{ height }}
    >
      <svg
        viewBox="0 0 320 230"
        preserveAspectRatio="xMidYMin slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sakuraSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#341418" />
            <stop offset="55%" stopColor="#221316" />
            <stop offset="100%" stopColor="#161616" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="320" height="230" fill="url(#sakuraSky)" />
        <circle cx="250" cy="46" r="34" fill="#c0392b" opacity="0.18" />
        <circle cx="250" cy="46" r="22" fill="#e0574a" opacity="0.55" />

        <path d="M-10 168 L46 150 L92 120 L120 132 L150 118 L150 175 L-10 175 Z" fill="#3a2226" opacity="0.9" />
        <path d="M150 175 L150 118 L182 96 L205 78 L214 66 L226 80 L238 72 L262 96 L300 128 L330 150 L330 175 Z" fill="#4a2c30" />
        <path d="M188 92 L205 78 L214 66 L226 80 L238 72 L232 86 L224 82 L214 74 L206 84 L198 80 L192 88 Z" fill="#e8dcdc" opacity="0.85" />
        <path d="M205 78 L214 66 L219 74 L214 78 L210 74 Z" fill="#f5eeee" opacity="0.85" />
        <path d="M214 66 L226 80 L238 72 L262 96 L246 92 L236 82 L228 90 L220 80 Z" fill="#5a3438" opacity="0.75" />
        <path d="M20 172 L70 138 L104 158 L140 132 L176 160 L176 175 L20 175 Z" fill="#502e33" opacity="0.95" />
        <path d="M92 146 L104 136 L116 146 L110 149 L104 143 L98 149 Z" fill="#d8c8c8" opacity="0.8" />
        <ellipse cx="160" cy="190" rx="175" ry="26" fill="#1e1416" opacity="0.8" />
        <path d="M6 176 Q90 168 170 178 T330 176" stroke="#5a3438" strokeWidth="1" fill="none" opacity="0.6" />

        <path d="M14 4 Q40 34 34 74 Q60 58 78 66" stroke="#6b3a3a" strokeWidth="3.5" fill="none" opacity="0.9" />
        <path d="M34 74 Q22 92 30 110" stroke="#6b3a3a" strokeWidth="2.5" fill="none" opacity="0.85" />
        <path d="M300 0 Q286 26 296 50 Q276 44 262 54" stroke="#6b3a3a" strokeWidth="3" fill="none" opacity="0.85" />

        <g>
          <circle cx="30" cy="30" r="6" fill="#f0a8bc" /><circle cx="42" cy="26" r="5.5" fill="#f5b8c8" />
          <circle cx="24" cy="44" r="5" fill="#e895ab" /><circle cx="52" cy="40" r="5.5" fill="#f5b8c8" />
          <circle cx="40" cy="52" r="4.5" fill="#f0a8bc" /><circle cx="66" cy="34" r="5" fill="#e895ab" />
          <circle cx="60" cy="52" r="5.5" fill="#f5b8c8" /><circle cx="76" cy="46" r="4.5" fill="#f0a8bc" />
          <circle cx="20" cy="60" r="4.5" fill="#f5b8c8" /><circle cx="34" cy="66" r="5" fill="#e895ab" />
          <circle cx="296" cy="18" r="5.5" fill="#f5b8c8" /><circle cx="286" cy="30" r="5" fill="#f0a8bc" />
          <circle cx="304" cy="36" r="5" fill="#e895ab" /><circle cx="292" cy="46" r="5.5" fill="#f5b8c8" />
          <circle cx="278" cy="42" r="4.5" fill="#f0a8bc" /><circle cx="270" cy="54" r="5" fill="#e895ab" />
          <circle cx="286" cy="56" r="4.5" fill="#f5b8c8" />
        </g>
        <g opacity="0.85">
          <circle cx="96" cy="72" r="3" fill="#f5b8c8" /><circle cx="150" cy="96" r="2.5" fill="#f0a8bc" />
          <circle cx="60" cy="104" r="3" fill="#f5c2d0" /><circle cx="232" cy="120" r="2.5" fill="#f0a8bc" />
          <circle cx="128" cy="140" r="2.5" fill="#f5b8c8" /><circle cx="200" cy="150" r="3" fill="#f5c2d0" />
          <circle cx="84" cy="158" r="2.5" fill="#f0a8bc" />
        </g>
      </svg>
      {/* Scrim so header text stays legible over busy parts of the scene,
          plus a fade at the bottom to blend into the page. */}
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
    </div>
  );
}
