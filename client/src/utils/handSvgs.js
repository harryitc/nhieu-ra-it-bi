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

  'búa': `<svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-bua" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff9f43" />
        <stop offset="100%" stop-color="#ff5e00" />
      </linearGradient>
      <filter id="glow-bua" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-bua)" stroke="#ff5e00" stroke-width="1.5" />
    <path d="M32,80 C32,58 35,50 38,46 C38,46 36,36 40,36 C44,36 44,46 44,46 C44,46 44,34 48,34 C52,34 52,46 52,46 C52,46 52,32 56,32 C60,32 60,46 60,46 C60,46 60,34 64,34 C68,34 68,48 68,55 C68,66 64,80 50,80 Z" fill="url(#grad-bua)" stroke="#ff5e00" stroke-width="2" filter="url(#glow-bua)" />
    <path d="M32,68 C24,62 17,54 22,48 C26.5,43 31.5,54 33.5,59 Z" fill="url(#grad-bua)" stroke="#ff5e00" stroke-width="2" />
    <circle cx="41.5" cy="46" r="2.5" fill="#ff5e00" opacity="0.6" />
    <circle cx="49" cy="42" r="2.5" fill="#ff5e00" opacity="0.6" />
    <circle cx="57" cy="42" r="2.5" fill="#ff5e00" opacity="0.6" />
  </svg>`,

  'kéo': `<svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-keo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f368e0" />
        <stop offset="100%" stop-color="#bd00ff" />
      </linearGradient>
      <filter id="glow-keo" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-keo)" stroke="#bd00ff" stroke-width="1.5" />
    <path d="M30,80 C30,62 33,52 38,48 C38,48 35,16 40,16 C45,16 46,30 46,42 L47,42 C47,30 48,12 53,12 C58,12 59,28 59,42 C59,42 61,42 63,44 C65,28 66,28 70,36 C70,44 68,54 68,57 C68,67 64,80 50,80 Z" fill="url(#grad-keo)" stroke="#bd00ff" stroke-width="2" filter="url(#glow-keo)" />
    <path d="M30,68 C20,62 13,54 18,48 C22.5,43 27.5,54 29.5,59 Z" fill="url(#grad-keo)" stroke="#bd00ff" stroke-width="2" />
  </svg>`,

  'bao': `<svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad-bao" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a4b0be" />
        <stop offset="100%" stop-color="#39ff14" />
      </linearGradient>
      <filter id="glow-bao" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M40,95 L60,95 L58,80 L42,80 Z" fill="url(#grad-bao)" stroke="#39ff14" stroke-width="1.5" />
    <path d="M28,80 C28,58 32,52 36,48 C36,48 32,15 37,12 C42,9 43,20 43,33 L43,46 C43,46 42,10 47,8 C52,6 53,16 53,30 L53,44 C53,44 54,8 59,7 C64,6 65,16 65,30 L65,46 C65,46 66,12 71,11 C76,10 77,20 77,38 L75,57 C75,67 69,80 50,80 Z" fill="url(#grad-bao)" stroke="#39ff14" stroke-width="2" filter="url(#glow-bao)" />
    <path d="M28,68 C17,62 10,57 14,49 C18,41 24.5,52 28.5,60 Z" fill="url(#grad-bao)" stroke="#39ff14" stroke-width="2" />
  </svg>`
}
