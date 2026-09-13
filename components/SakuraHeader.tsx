// Decorative mountain-and-sakura banner for the Today screen, adapted
// from the provided mockup. Pure inline SVG, no image assets.
export default function SakuraHeader() {
  return (
    <div className="absolute inset-x-0 top-0 h-[190px] overflow-hidden rounded-b-3xl -z-10">
      <svg
        viewBox="0 0 320 230"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="320" height="230" fill="#161616" />
        <circle cx="250" cy="46" r="22" fill="#c0392b" opacity="0.3" />

        <path d="M-10 168 L46 150 L92 120 L120 132 L150 118 L150 175 L-10 175 Z" fill="#242424" opacity="0.85" />
        <path d="M150 175 L150 118 L182 96 L205 78 L214 66 L226 80 L238 72 L262 96 L300 128 L330 150 L330 175 Z" fill="#2f2f2f" />
        <path d="M188 92 L205 78 L214 66 L226 80 L238 72 L232 86 L224 82 L214 74 L206 84 L198 80 L192 88 Z" fill="#dedede" opacity="0.92" />
        <path d="M205 78 L214 66 L219 74 L214 78 L210 74 Z" fill="#f2f2f2" opacity="0.9" />
        <path d="M214 66 L226 80 L238 72 L262 96 L246 92 L236 82 L228 90 L220 80 Z" fill="#3a3a3a" opacity="0.7" />
        <path d="M20 172 L70 138 L104 158 L140 132 L176 160 L176 175 L20 175 Z" fill="#3a3a3a" opacity="0.9" />
        <path d="M92 146 L104 136 L116 146 L110 149 L104 143 L98 149 Z" fill="#c8c8c8" opacity="0.85" />
        <ellipse cx="160" cy="190" rx="175" ry="26" fill="#1e1e1e" opacity="0.7" />
        <path d="M6 176 Q90 168 170 178 T330 176" stroke="#3a3a3a" strokeWidth="1" fill="none" opacity="0.5" />

        <path d="M14 4 Q40 34 34 74 Q60 58 78 66" stroke="#3d2626" strokeWidth="3.5" fill="none" opacity="0.85" />
        <path d="M34 74 Q22 92 30 110" stroke="#3d2626" strokeWidth="2.5" fill="none" opacity="0.8" />
        <path d="M300 0 Q286 26 296 50 Q276 44 262 54" stroke="#3d2626" strokeWidth="3" fill="none" opacity="0.8" />

        <g opacity="0.92">
          <circle cx="30" cy="30" r="5.5" fill="#d98ba0" /><circle cx="42" cy="26" r="5" fill="#e59db0" />
          <circle cx="24" cy="44" r="4.5" fill="#c97a92" /><circle cx="52" cy="40" r="5" fill="#e59db0" />
          <circle cx="40" cy="52" r="4" fill="#d98ba0" /><circle cx="66" cy="34" r="4.5" fill="#c97a92" />
          <circle cx="60" cy="52" r="5" fill="#e59db0" /><circle cx="76" cy="46" r="4" fill="#d98ba0" />
          <circle cx="20" cy="60" r="4" fill="#e59db0" /><circle cx="34" cy="66" r="4.5" fill="#c97a92" />
          <circle cx="296" cy="18" r="5" fill="#e59db0" /><circle cx="286" cy="30" r="4.5" fill="#d98ba0" />
          <circle cx="304" cy="36" r="4.5" fill="#c97a92" /><circle cx="292" cy="46" r="5" fill="#e59db0" />
          <circle cx="278" cy="42" r="4" fill="#d98ba0" /><circle cx="270" cy="54" r="4.5" fill="#c97a92" />
          <circle cx="286" cy="56" r="4" fill="#e59db0" />
        </g>
        <g opacity="0.75">
          <circle cx="96" cy="72" r="2.5" fill="#e59db0" /><circle cx="150" cy="96" r="2" fill="#d98ba0" />
          <circle cx="60" cy="104" r="2.5" fill="#e5a8ba" /><circle cx="232" cy="120" r="2" fill="#d98ba0" />
          <circle cx="128" cy="140" r="2" fill="#e59db0" /><circle cx="200" cy="150" r="2.5" fill="#e5a8ba" />
          <circle cx="84" cy="158" r="2" fill="#d98ba0" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
    </div>
  );
}
