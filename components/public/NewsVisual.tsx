import styles from '@/app/landing.module.css';

const nodes: Array<[number, number, number]> = [
  [52, 42, 7],
  [88, 26, 6],
  [122, 50, 8],
  [153, 24, 5],
  [183, 49, 7],
  [70, 89, 7],
  [111, 102, 10],
  [151, 83, 7],
  [197, 110, 6],
  [223, 69, 6],
];

const edges: Array<[number, number]> = [
  [0, 1],
  [0, 5],
  [1, 2],
  [1, 6],
  [2, 3],
  [2, 6],
  [2, 7],
  [3, 4],
  [4, 7],
  [4, 9],
  [5, 6],
  [6, 7],
  [6, 8],
  [7, 8],
  [7, 9],
  [8, 9],
];

export function NewsVisual({ type }: { type: 'models' | 'sales' | 'visual' }) {
  return (
    <div className={styles.newsVisual} aria-hidden="true">
      <div className={styles.newsVisualGlow} />
      {type === 'models' ? (
        <svg viewBox="0 0 280 145" className={styles.newsSvg} focusable="false">
          <defs>
            <linearGradient id="news-line-orange" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ffc079" />
              <stop offset="1" stopColor="#e35111" />
            </linearGradient>
            <radialGradient id="news-core-glow">
              <stop stopColor="#ffe1ad" />
              <stop offset=".55" stopColor="#ff8a27" />
              <stop offset="1" stopColor="#fe521b" />
            </radialGradient>
          </defs>
          <ellipse cx="140" cy="73" rx="120" ry="56" fill="none" stroke="#ff9c4726" />
          <ellipse
            cx="140"
            cy="73"
            rx="94"
            ry="40"
            fill="none"
            stroke="#ffc07436"
            transform="rotate(-18 140 73)"
          />
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a][0]}
              y1={nodes[a][1]}
              x2={nodes[b][0]}
              y2={nodes[b][1]}
              stroke="url(#news-line-orange)"
              strokeOpacity=".56"
              strokeWidth="1.2"
            />
          ))}
          {nodes.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r + 3} fill="#f7781e" fillOpacity=".14" />
              <circle
                cx={x}
                cy={y}
                r={r}
                fill="url(#news-core-glow)"
                stroke="#ffca83"
                strokeWidth=".7"
              />
              <circle cx={x - 1.5} cy={y - 2} r="1.7" fill="white" fillOpacity=".7" />
            </g>
          ))}
          <path
            d="M32 118 73 112 96 125 170 119 245 102"
            stroke="#ffa34566"
            strokeDasharray="2 6"
            fill="none"
          />
        </svg>
      ) : type === 'sales' ? (
        <svg viewBox="0 0 280 145" className={styles.newsSvg} focusable="false">
          <defs>
            <linearGradient id="sales-gold" x1="0" y1="1" x2="1" y2="0">
              <stop stopColor="#b73e18" />
              <stop offset=".55" stopColor="#ff7b1d" />
              <stop offset="1" stopColor="#ffcc7f" />
            </linearGradient>
          </defs>
          <path d="M32 116 139 137 250 102 140 79Z" fill="#29222a" stroke="#ff8b4b48" />
          {[
            { x: 74, y: 75, h: 31 },
            { x: 116, y: 61, h: 45 },
            { x: 158, y: 43, h: 61 },
            { x: 202, y: 23, h: 81 },
          ].map((b, i) => (
            <g key={i}>
              <path d={`M${b.x} ${b.y} l14 5 v${b.h} l-14 -5Z`} fill="#b63b17" />
              <path d={`M${b.x - 19} ${b.y - 6} l19 6 v${b.h} l-19 -6Z`} fill="url(#sales-gold)" />
              <path d={`M${b.x - 19} ${b.y - 6} l12 -8 21 8 -14 6Z`} fill="#ffd39a" />
            </g>
          ))}
          <path
            d="M30 81 Q95 110 147 40 T242 30"
            fill="none"
            stroke="#fff0bc"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="m229 20 18 9 -20 9"
            stroke="#fff0bc"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 280 145" className={styles.newsSvg} focusable="false">
          <defs>
            <linearGradient id="visual-ring" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#ffbf6d" />
              <stop offset=".5" stopColor="#f77719" />
              <stop offset="1" stopColor="#7d2c19" />
            </linearGradient>
          </defs>
          <g transform="translate(131 74) rotate(-19)">
            <rect x="-103" y="-39" width="70" height="68" rx="8" fill="#30323c" stroke="#ff8b4a" />
            <path d="M-96 15-78 -9-62 5-48 -12-40 22Z" fill="#e37f3e" />
            <circle cx="-53" cy="-20" r="8" fill="#ffcb80" />
            <rect x="29" y="-56" width="78" height="65" rx="8" fill="#32303a" stroke="#ff8d50" />
            <path d="M37 -1 59 -30 72 -16 91 -35 101 1Z" fill="#bb6829" />
            <circle cx="85" cy="-39" r="7" fill="#ffcc82" />
          </g>
          <ellipse
            cx="138"
            cy="73"
            rx="112"
            ry="39"
            stroke="#ff813b64"
            strokeWidth="1.5"
            fill="none"
            transform="rotate(-26 138 73)"
          />
          <circle
            cx="138"
            cy="73"
            r="53"
            fill="#161920"
            stroke="url(#visual-ring)"
            strokeWidth="15"
          />
          <circle cx="138" cy="73" r="38" fill="#26303a" stroke="#ffb462" strokeWidth="5" />
          <circle cx="138" cy="73" r="29" fill="#1b1c2f" stroke="#ff732b" strokeWidth="2" />
          <circle cx="138" cy="73" r="16" fill="#764229" stroke="#ff9959" strokeWidth="4" />
          <circle cx="131" cy="65" r="6" fill="#ffc882" fillOpacity=".85" />
        </svg>
      )}
    </div>
  );
}
