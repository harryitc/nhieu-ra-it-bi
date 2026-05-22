export const HAND_SVGS = {
  'sấp': `<svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-sap" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3a3d52" />
        <stop offset="100%" stop-color="#1b1c25" />
      </linearGradient>
      <filter id="glow-sap" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-sap)" stroke="#ff3131" stroke-width="1.5" />
    <path d="M28,80 C28,58 32,50 36,46 C36,46 35,24 38,20 C40.5,17.5 43,20 43,30 L43,44 C43,44 45.5,18 48,15 C50.5,13.5 53,16 53,28 L53,42 C53,42 55.5,15 58,12 C60.5,10.5 63,13 63,28 L63,44 C63,44 65.5,20 68,18 C70.5,16.5 73,20 73,36 L73,55 C73,66 69,80 50,80 Z" fill="url(#grad-sap)" stroke="#ff3131" stroke-width="2" filter="url(#glow-sap)" />
    <path d="M28,68 C20,62 13,54 18,48 C22.5,43 27.5,54 29.5,59 Z" fill="url(#grad-sap)" stroke="#ff3131" stroke-width="2" />
    <circle cx="39.5" cy="46" r="2.5" fill="#ff3131" opacity="0.6" />
    <circle cx="48" cy="42" r="2.5" fill="#ff3131" opacity="0.6" />
    <circle cx="58" cy="42" r="2.5" fill="#ff3131" opacity="0.6" />
    <circle cx="68" cy="44" r="2.5" fill="#ff3131" opacity="0.6" />
  </svg>`,

  'ngửa': `<svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-ngua" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e0f2fe" />
      </linearGradient>
      <filter id="glow-ngua" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-ngua)" stroke="#00f0ff" stroke-width="1.5" />
    <path d="M28,80 C28,58 32,52 36,48 C36,48 35,26 38,22 C40.5,19 43,22 43,33 L43,46 C43,46 45.5,22 48,18 C50.5,15.5 53,18 53,30 L53,44 C53,44 55.5,20 58,16 C60.5,14 63,16 63,30 L63,46 C63,46 65.5,24 68,20 C70.5,18 73,22 73,38 L73,57 C73,67 69,80 50,80 Z" fill="url(#grad-ngua)" stroke="#00f0ff" stroke-width="2" filter="url(#glow-ngua)" />
    <path d="M28,68 C17,62 10,57 14,49 C18,41 24.5,52 28.5,60 Z" fill="url(#grad-ngua)" stroke="#00f0ff" stroke-width="2" />
    <path d="M36,60 C42,64 54,64 62,54" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
    <path d="M40,53 C47,50 56,56 66,56" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
    <path d="M32,71 C44,73 57,71 65,62" fill="none" stroke="#ff007f" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
  </svg>`,

  'ẩn': `<svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-an" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffe600" />
        <stop offset="100%" stop-color="#ff8c00" />
      </linearGradient>
      <filter id="glow-an" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M40,95 L60,95 L57,80 L43,80 Z" fill="url(#grad-an)" stroke="#ffe600" stroke-width="1.5" />
    <path d="M30,80 C24,80 20,74 20,62 C20,50 26,45 35,45 L65,45 C74,45 80,50 80,62 C80,74 76,80 70,80 Z" fill="url(#grad-an)" stroke="#ffffff" stroke-width="2" filter="url(#glow-an)" />
    <path d="M30,45 C30,35 38,35 38,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
    <path d="M42,45 C42,35 50,35 50,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
    <path d="M54,45 C54,35 62,35 62,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
    <path d="M66,45 C66,35 74,35 74,45" fill="none" stroke="#000" stroke-width="2" opacity="0.2" />
    <path d="M26,62 C20,58 23,50 32,53 Z" fill="url(#grad-an)" stroke="#ffffff" stroke-width="1.5" />
  </svg>`,

  'búa': `<svg viewBox="0 0 100 130" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-bua-skin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0c27f"/>
        <stop offset="100%" stop-color="#d4955a"/>
      </linearGradient>
      <linearGradient id="grad-bua-palm" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e8b57a"/>
        <stop offset="100%" stop-color="#c07840"/>
      </linearGradient>
      <filter id="shadow-bua">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>
      </filter>
    </defs>
    <!-- Wrist -->
    <rect x="33" y="105" width="34" height="22" rx="8" fill="url(#grad-bua-palm)" filter="url(#shadow-bua)"/>
    <!-- Palm (fist body) -->
    <rect x="24" y="62" width="52" height="48" rx="14" fill="url(#grad-bua-skin)" filter="url(#shadow-bua)"/>
    <!-- Knuckle row bumps -->
    <ellipse cx="36" cy="63" rx="7" ry="5" fill="#e5aa6e"/>
    <ellipse cx="48" cy="61" rx="7.5" ry="5.5" fill="#e8b57a"/>
    <ellipse cx="60" cy="62" rx="7" ry="5" fill="#e5aa6e"/>
    <ellipse cx="70" cy="65" rx="5.5" ry="4" fill="#d4955a"/>
    <!-- Finger lines (curled) -->
    <path d="M26 74 Q50 68 74 74" stroke="#c07840" stroke-width="1.2" fill="none" opacity="0.5"/>
    <path d="M26 82 Q50 76 74 82" stroke="#c07840" stroke-width="1" fill="none" opacity="0.4"/>
    <!-- Thumb -->
    <path d="M24 80 C14 76 10 65 16 60 C20 56 26 60 26 67" fill="url(#grad-bua-skin)" stroke="#c07840" stroke-width="1"/>
    <path d="M16 60 C15 56 18 53 22 55" fill="url(#grad-bua-skin)" stroke="#c07840" stroke-width="1"/>
    <!-- Highlight -->
    <ellipse cx="50" cy="67" rx="18" ry="5" fill="rgba(255,255,255,0.12)"/>
    <!-- Knuckle dots -->
    <circle cx="36" cy="63" r="2" fill="rgba(0,0,0,0.1)"/>
    <circle cx="48" cy="61" r="2" fill="rgba(0,0,0,0.1)"/>
    <circle cx="60" cy="62" r="2" fill="rgba(0,0,0,0.1)"/>
  </svg>`,

  'kéo': `<svg viewBox="0 0 100 130" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-keo-skin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0c27f"/>
        <stop offset="100%" stop-color="#d4955a"/>
      </linearGradient>
      <linearGradient id="grad-keo-palm" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e8b57a"/>
        <stop offset="100%" stop-color="#c07840"/>
      </linearGradient>
      <filter id="shadow-keo">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>
      </filter>
    </defs>
    <!-- Wrist -->
    <rect x="33" y="105" width="34" height="22" rx="8" fill="url(#grad-keo-palm)" filter="url(#shadow-keo)"/>
    <!-- Palm -->
    <path d="M28 105 C24 98 22 88 22 78 C22 70 26 64 34 62 L66 62 C74 64 78 70 78 78 C78 88 76 98 72 105 Z" fill="url(#grad-keo-skin)" filter="url(#shadow-keo)"/>
    <!-- Ring finger (curled) -->
    <path d="M58 62 C58 56 60 50 62 46 C63 44 63 56 62 62 Z" fill="url(#grad-keo-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Pinky (curled) -->
    <path d="M67 64 C68 58 70 52 71 49 C72 47 72 58 70 65 Z" fill="url(#grad-keo-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Index finger (extended) -->
    <path d="M34 62 L32 42 C31.5 36 33 30 36.5 28 C40 26 42 30 42 36 L42 62 Z" fill="url(#grad-keo-skin)" stroke="#c07840" stroke-width="1"/>
    <path d="M36 42 C36 38 37 34 38 32" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" fill="none"/>
    <!-- Middle finger (extended) -->
    <path d="M44 62 L43 40 C42.5 34 44 27 47.5 25 C51 23 53 27 53 33 L53 62 Z" fill="url(#grad-keo-skin)" stroke="#c07840" stroke-width="1"/>
    <path d="M47 42 C47 37 48 33 49 31" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" fill="none"/>
    <!-- Thumb (tucked side) -->
    <path d="M28 80 C18 78 15 70 19 64 C22 60 28 63 28 70" fill="url(#grad-keo-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Palm crease lines -->
    <path d="M28 84 Q50 80 72 84" stroke="#c07840" stroke-width="0.8" fill="none" opacity="0.4"/>
    <path d="M30 92 Q50 88 70 92" stroke="#c07840" stroke-width="0.8" fill="none" opacity="0.35"/>
    <!-- Finger highlights -->
    <ellipse cx="37" cy="44" rx="3" ry="8" fill="rgba(255,255,255,0.15)" transform="rotate(-3 37 44)"/>
    <ellipse cx="48" cy="42" rx="3" ry="9" fill="rgba(255,255,255,0.15)" transform="rotate(1 48 42)"/>
    <!-- Knuckles -->
    <circle cx="37" cy="62" r="2.5" fill="#e2a96a"/>
    <circle cx="48" cy="62" r="2.5" fill="#e2a96a"/>
    <circle cx="59" cy="62" r="2" fill="#e2a96a"/>
    <circle cx="68" cy="64" r="1.8" fill="#e2a96a"/>
  </svg>`,

  'bao': `<svg viewBox="0 0 100 130" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-bao-skin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0c27f"/>
        <stop offset="100%" stop-color="#d4955a"/>
      </linearGradient>
      <linearGradient id="grad-bao-palm" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e8b57a"/>
        <stop offset="100%" stop-color="#c07840"/>
      </linearGradient>
      <filter id="shadow-bao">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.4)"/>
      </filter>
    </defs>
    <!-- Wrist -->
    <rect x="33" y="105" width="34" height="22" rx="8" fill="url(#grad-bao-palm)" filter="url(#shadow-bao)"/>
    <!-- Palm flat -->
    <path d="M26 105 C22 96 20 86 20 76 C20 68 24 62 32 60 L68 60 C76 62 80 68 80 76 C80 86 78 96 74 105 Z" fill="url(#grad-bao-skin)" filter="url(#shadow-bao)"/>
    <!-- Pinky finger -->
    <path d="M68 60 L69 44 C69.5 38 71 33 73 31 C75.5 29 77 32 77 38 L76 60 Z" fill="url(#grad-bao-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Ring finger -->
    <path d="M57 60 L57 41 C57 35 58.5 29 61 27 C63.5 25 65 28 65 34 L65 60 Z" fill="url(#grad-bao-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Middle finger -->
    <path d="M45 60 L45 38 C45 32 46.5 25 49.5 23 C52.5 21 54 25 54 31 L54 60 Z" fill="url(#grad-bao-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Index finger -->
    <path d="M34 60 L33 40 C32.5 34 34 27 37 25 C40 23 41.5 27 41.5 33 L42 60 Z" fill="url(#grad-bao-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Thumb (extended diagonally) -->
    <path d="M26 78 C18 74 12 66 15 57 C17.5 51 24 52 26 58 L26 72" fill="url(#grad-bao-skin)" stroke="#c07840" stroke-width="0.8"/>
    <path d="M15 57 C14 52 16 47 20 46 C23 45 26 48 26 53" fill="url(#grad-bao-skin)" stroke="#c07840" stroke-width="0.8"/>
    <!-- Palm crease lines -->
    <path d="M26 82 Q50 78 74 82" stroke="#c07840" stroke-width="1" fill="none" opacity="0.35"/>
    <path d="M28 92 Q50 88 72 92" stroke="#c07840" stroke-width="0.9" fill="none" opacity="0.3"/>
    <path d="M36 70 Q50 66 64 68" stroke="#c07840" stroke-width="0.8" fill="none" opacity="0.3"/>
    <!-- Finger joint lines -->
    <path d="M34 49 Q37 48 41 49" stroke="#c07840" stroke-width="0.7" fill="none" opacity="0.4"/>
    <path d="M45 47 Q49 46 53 47" stroke="#c07840" stroke-width="0.7" fill="none" opacity="0.4"/>
    <path d="M57 49 Q61 48 65 49" stroke="#c07840" stroke-width="0.7" fill="none" opacity="0.4"/>
    <!-- Highlights on fingers -->
    <ellipse cx="37" cy="42" rx="3" ry="9" fill="rgba(255,255,255,0.15)" transform="rotate(-2 37 42)"/>
    <ellipse cx="49" cy="40" rx="3" ry="10" fill="rgba(255,255,255,0.13)"/>
    <ellipse cx="61" cy="42" rx="3" ry="9" fill="rgba(255,255,255,0.12)" transform="rotate(2 61 42)"/>
    <ellipse cx="72" cy="44" rx="2.5" ry="8" fill="rgba(255,255,255,0.11)" transform="rotate(4 72 44)"/>
    <!-- Knuckle bumps at base of fingers -->
    <ellipse cx="37" cy="60" rx="4" ry="2.5" fill="#e2a96a"/>
    <ellipse cx="49" cy="60" rx="4" ry="2.5" fill="#e2a96a"/>
    <ellipse cx="61" cy="60" rx="4" ry="2.5" fill="#e2a96a"/>
    <ellipse cx="72" cy="60" rx="3.5" ry="2" fill="#e2a96a"/>
  </svg>`
}
