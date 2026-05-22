/* ==========================================================================
   HAND SVG ASSETS (Premium ultra-realistic 3D biological cyberpunk vectors)
   ========================================================================== */
export const HAND_SVGS = {
    sấp: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <!-- Realistic Skin Gradient -->
            <linearGradient id="skin-back" x1="30%" y1="90%" x2="70%" y2="10%">
                <stop offset="0%" stop-color="#ab6b4f" />
                <stop offset="30%" stop-color="#d68c6a" />
                <stop offset="70%" stop-color="#f5be9e" />
                <stop offset="100%" stop-color="#ffd5be" />
            </linearGradient>
            <!-- Pink/White Nail Gradient -->
            <linearGradient id="nail-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#e28b8b" />
                <stop offset="60%" stop-color="#fca5a5" />
                <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
            <filter id="glow-sap" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <!-- Background Neon Glow Path -->
        <path d="M40,95 C30,95 24,80 24,70 C16,62 14,52 23,47 C27,44 32,54 36,60 C36,45 35,22 39,18 C42.5,14.5 46.5,18 46.5,30 C46.5,20 48.5,14 52.5,14 C56.5,14 57.5,22 57.5,30 C57.5,22 59.5,15 63.5,15 C67.5,15 68.5,24 68.5,32 C68.5,24 71.5,20 74.5,20 C77.5,20 78.5,28 78.5,45 C78.5,60 74,80 60,85 L58,95 Z" fill="none" stroke="#ff3131" stroke-width="4.5" filter="url(#glow-sap)" stroke-linejoin="round" />
        
        <!-- Arm/Wrist Base -->
        <path d="M40,95 L60,95 C58,82 58,80 56,76 C54,72 46,72 44,76 C42,80 42,82 40,95 Z" fill="url(#skin-back)" />
        
        <!-- Hand Dorsum + Fingers Base -->
        <path d="M40,95 C30,95 24,80 24,70 C16,62 14,52 23,47 C27,44 32,54 36,60 C36,45 35,22 39,18 C42.5,14.5 46.5,18 46.5,30 C46.5,20 48.5,14 52.5,14 C56.5,14 57.5,22 57.5,30 C57.5,22 59.5,15 63.5,15 C67.5,15 68.5,24 68.5,32 C68.5,24 71.5,20 74.5,20 C77.5,20 78.5,28 78.5,45 C78.5,60 74,80 60,85 Z" fill="url(#skin-back)" stroke="#ff3131" stroke-width="1" />
        
        <!-- Tendons/Bones on Back of Hand -->
        <path d="M43,76 C43,65 42,50 42,35" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M50,76 C50,62 52,48 52,32" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M57,76 C57,62 60,50 60,35" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M64,76 C64,65 67,55 67,38" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        
        <!-- Knuckle Joint Creases -->
        <!-- Index -->
        <path d="M39.5,28 C38.5,28.5 38.5,29.5 39.5,30 M38.5,38 C37.5,38.5 37.5,39.5 38.5,40" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Middle -->
        <path d="M52.5,23 C51.5,23.5 51.5,24.5 52.5,25 M51.5,34 C50.5,34.5 50.5,35.5 51.5,36" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Ring -->
        <path d="M63.5,24 C62.5,24.5 62.5,25.5 63.5,26 M62.5,35 C61.5,35.5 61.5,36.5 62.5,37" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Pinky -->
        <path d="M74.5,29 C73.5,29.5 73.5,30.5 74.5,31 M73.5,39 C72.5,39.5 72.5,40.5 73.5,41" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Thumb -->
        <path d="M22,53 C21,54 22,56 23,57" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        
        <!-- Detailed Fingernails -->
        <!-- Index Nail -->
        <path d="M39.2,18.5 C39.2,21.5 42.8,21.5 42.8,18.5 C42.8,17.5 41,17.5 39.2,18.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Middle Nail -->
        <path d="M50.7,14.5 C50.7,17.5 54.3,17.5 54.3,14.5 C54.3,13.5 52.5,13.5 50.7,14.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Ring Nail -->
        <path d="M61.7,15.5 C61.7,18.5 65.3,18.5 65.3,15.5 C65.3,14.5 63.5,14.5 61.7,15.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Pinky Nail -->
        <path d="M72.7,20.5 C72.7,23.5 76.3,23.5 76.3,20.5 C76.3,19.5 74.5,19.5 72.7,20.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Thumb Nail -->
        <path d="M19.5,47.5 C17.5,49.5 19.5,52.5 21.5,50.5 C22.5,49.5 21.5,48.5 19.5,47.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
    </svg>`,

    ngửa: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <!-- Realistic Skin Gradient (Palm is lighter & pinker than back) -->
            <linearGradient id="skin-palm" x1="30%" y1="90%" x2="70%" y2="10%">
                <stop offset="0%" stop-color="#b87a61" />
                <stop offset="35%" stop-color="#e09e82" />
                <stop offset="75%" stop-color="#fcd3c1" />
                <stop offset="100%" stop-color="#ffe4d6" />
            </linearGradient>
            <filter id="glow-ngua" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <!-- Background Neon Glow Path -->
        <path d="M40,95 C30,95 24,80 24,70 C16,62 14,52 23,47 C27,44 32,54 36,60 C36,45 35,22 39,18 C42.5,14.5 46.5,18 46.5,30 C46.5,20 48.5,14 52.5,14 C56.5,14 57.5,22 57.5,30 C57.5,22 59.5,15 63.5,15 C67.5,15 68.5,24 68.5,32 C68.5,24 71.5,20 74.5,20 C77.5,20 78.5,28 78.5,45 C78.5,60 74,80 60,85 L58,95 Z" fill="none" stroke="#00f0ff" stroke-width="4.5" filter="url(#glow-ngua)" stroke-linejoin="round" />
        
        <!-- Arm/Wrist Base -->
        <path d="M40,95 L60,95 C58,82 58,80 56,76 C54,72 46,72 44,76 C42,80 42,82 40,95 Z" fill="url(#skin-palm)" />
        
        <!-- Hand Palm + Fingers Base -->
        <path d="M40,95 C30,95 24,80 24,70 C16,62 14,52 23,47 C27,44 32,54 36,60 C36,45 35,22 39,18 C42.5,14.5 46.5,18 46.5,30 C46.5,20 48.5,14 52.5,14 C56.5,14 57.5,22 57.5,30 C57.5,22 59.5,15 63.5,15 C67.5,15 68.5,24 68.5,32 C68.5,24 71.5,20 74.5,20 C77.5,20 78.5,28 78.5,45 C78.5,60 74,80 60,85 Z" fill="url(#skin-palm)" stroke="#00f0ff" stroke-width="1" />
        
        <!-- Thenar and Hypothenar Muscles Shadows (Palmar pads) -->
        <path d="M30,83 C27,72 32,64 39,63" fill="none" stroke="#a2573d" stroke-width="2.5" opacity="0.3" filter="blur(2px)" />
        <path d="M68,80 C74,74 72,64 65,58" fill="none" stroke="#a2573d" stroke-width="2.5" opacity="0.3" filter="blur(2px)" />
        
        <!-- Realistic Palm Lines (Chỉ Tay) -->
        <!-- Life Line (Đường Sinh Đạo) -->
        <path d="M35,60 C30,68 34,79 46,84" fill="none" stroke="#94432c" stroke-width="1.8" stroke-linecap="round" opacity="0.75" />
        <!-- Head Line (Đường Trí Đạo) -->
        <path d="M34,60 C42,62 55,65 68,60" fill="none" stroke="#94432c" stroke-width="1.8" stroke-linecap="round" opacity="0.7" />
        <!-- Heart Line (Đường Tâm Đạo) -->
        <path d="M70,54 C60,52 48,54 39,63" fill="none" stroke="#94432c" stroke-width="1.8" stroke-linecap="round" opacity="0.7" />
        
        <!-- Finger Pad Segment Creases (Nếp Gấp Đốt Ngón Tay) -->
        <!-- Index -->
        <path d="M38,33 C39,33.5 41,33.5 42,33 M37,42 C38,42.5 41,42.5 42,42" fill="none" stroke="#94432c" stroke-width="1" opacity="0.6" />
        <!-- Middle -->
        <path d="M50,28 C51,28.5 53,28.5 54,28 M50,38 C51,38.5 53,38.5 54,38" fill="none" stroke="#94432c" stroke-width="1" opacity="0.6" />
        <!-- Ring -->
        <path d="M61,29 C62,29.5 64,29.5 65,29 M61,39 C62,39.5 64,39.5 65,39" fill="none" stroke="#94432c" stroke-width="1" opacity="0.6" />
        <!-- Pinky -->
        <path d="M71,34 C72,34.5 74,34.5 75,34 M71,43 C72,43.5 74,43.5 75,43" fill="none" stroke="#94432c" stroke-width="1" opacity="0.6" />
        <!-- Thumb -->
        <path d="M23,54 C25,56 27,57 29,58" fill="none" stroke="#94432c" stroke-width="1.2" opacity="0.6" />
    </svg>`,

    búa: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="skin-fist" x1="30%" y1="90%" x2="70%" y2="10%">
                <stop offset="0%" stop-color="#ab6b4f" />
                <stop offset="30%" stop-color="#d68c6a" />
                <stop offset="70%" stop-color="#f5be9e" />
                <stop offset="100%" stop-color="#ffd5be" />
            </linearGradient>
            <filter id="glow-bua" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <!-- Background Neon Glow Path -->
        <path d="M40,95 C30,95 24,82 24,72 C24,52 30,44 38,44 C42,44 45,41 50,41 C54,41 57,43 62,43 C66,43 69,45 74,45 C78,45 81,50 81,60 C81,72 74,82 60,85 L58,95 Z" fill="none" stroke="#ff5e00" stroke-width="4.5" filter="url(#glow-bua)" stroke-linejoin="round" />
        
        <!-- Arm/Wrist -->
        <path d="M40,95 L60,95 C58,82 58,80 56,76 C54,72 46,72 44,76 C42,80 42,82 40,95 Z" fill="url(#skin-fist)" />
        
        <!-- Main Fist Dorsum -->
        <path d="M40,95 C30,95 24,82 24,72 C24,52 30,44 38,44 C42,44 45,41 50,41 C54,41 57,43 62,43 C66,43 69,45 74,45 C78,45 81,50 81,60 C81,72 74,82 60,85 Z" fill="url(#skin-fist)" stroke="#ff5e00" stroke-width="1" />
        
        <!-- Clenched Folded Fingers Shading (Tạo Khối Ngón Tay Co Vào) -->
        <!-- Index finger folded -->
        <path d="M38,44 C34,44 32,54 36,60 L46,60 C50,56 46,44 38,44 Z" fill="url(#skin-fist)" stroke="#8c472d" stroke-width="1" />
        <!-- Middle finger folded -->
        <path d="M47,42 C44,42 42,54 47,58 L57,58 C60,54 57,42 47,42 Z" fill="url(#skin-fist)" stroke="#8c472d" stroke-width="1" />
        <!-- Ring finger folded -->
        <path d="M58,43 C55,43 53,53 58,57 L67,57 C70,53 67,43 58,43 Z" fill="url(#skin-fist)" stroke="#8c472d" stroke-width="1" />
        <!-- Pinky finger folded -->
        <path d="M68,45 C65,45 64,52 68,56 L76,56 C79,52 76,45 68,45 Z" fill="url(#skin-fist)" stroke="#8c472d" stroke-width="1" />

        <!-- Knuckles Creases on Dorsum -->
        <path d="M37,44 C37,56 36,68 36,74" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M47,42 C47,56 48,68 48,74" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M58,43 C58,56 60,68 60,74" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M68,45 C68,56 70,68 70,74" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />

        <!-- Thumb Folded over Index & Middle (Ngón Cái Gập Ngang Qua) -->
        <path d="M24,70 C16,62 14,52 23,47 C28,45 32,54 36,60 C42,63 50,61 54,61 C58,61 60,67 52,69 C44,71 34,74 24,70 Z" fill="url(#skin-fist)" stroke="#8c472d" stroke-width="1.2" />
        <path d="M50,61 C52,61 53,62 53,64 C53,66 50,67 48,67 Z" fill="#ffd5be" opacity="0.5" />
    </svg>`,

    kéo: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="skin-scissors" x1="30%" y1="90%" x2="70%" y2="10%">
                <stop offset="0%" stop-color="#ab6b4f" />
                <stop offset="30%" stop-color="#d68c6a" />
                <stop offset="70%" stop-color="#f5be9e" />
                <stop offset="100%" stop-color="#ffd5be" />
            </linearGradient>
            <linearGradient id="nail-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#e28b8b" />
                <stop offset="60%" stop-color="#fca5a5" />
                <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
            <filter id="glow-keo" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <!-- Background Neon Glow Path -->
        <path d="M40,95 C30,95 24,82 24,72 C16,62 14,52 23,47 C27,44 32,54 36,60 C36,45 28,20 34,16 C39.5,12.5 43.5,18 43.5,38 C43.5,28 50,10 56,12 C62,14 60.5,22 57.5,42 C62,42 64,52 64,56 C68,52 75,52 75,60 C75,72 68,82 55,85 L53,95 Z" fill="none" stroke="#bd00ff" stroke-width="4.5" filter="url(#glow-keo)" stroke-linejoin="round" />
        
        <!-- Arm/Wrist -->
        <path d="M40,95 L60,95 C58,82 58,80 56,76 C54,72 46,72 44,76 C42,80 42,82 40,95 Z" fill="url(#skin-scissors)" />
        
        <!-- Main Hand Dorsum + Extended V Fingers -->
        <path d="M40,95 C30,95 24,82 24,72 C16,62 14,52 23,47 C27,44 32,54 36,60 C36,45 28,20 34,16 C39.5,12.5 43.5,18 43.5,38 C43.5,28 50,10 56,12 C62,14 60.5,22 57.5,42 C60,42 64,52 64,56 C68,52 75,52 75,60 C75,72 68,82 55,85 Z" fill="url(#skin-scissors)" stroke="#bd00ff" stroke-width="1" />
        
        <!-- Folded Fingers (Ring & Pinky) -->
        <!-- Ring finger folded -->
        <path d="M57,42 C62,42 64,52 57,56 Z" fill="url(#skin-scissors)" stroke="#8c472d" stroke-width="1" />
        <!-- Pinky finger folded -->
        <path d="M64,52 C68,52 75,52 68,58 Z" fill="url(#skin-scissors)" stroke="#8c472d" stroke-width="1" />

        <!-- Nails on extended Index and Middle fingers -->
        <!-- Index Nail -->
        <path d="M32.2,16.5 C32.2,19.5 35.8,19.5 35.8,16.5 C35.8,15.5 34,15.5 32.2,16.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Middle Nail -->
        <path d="M53.7,12.5 C53.7,15.5 57.3,15.5 57.3,12.5 C57.3,11.5 55.5,11.5 53.7,12.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Thumb Nail (Folded) -->
        <path d="M19.5,47.5 C17.5,49.5 19.5,52.5 21.5,50.5 C22.5,49.5 21.5,48.5 19.5,47.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />

        <!-- Finger Knuckle joint lines -->
        <path d="M33,26 C32,27 34,28 35,27 M31,34 C30,35 32,36 33,35" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <path d="M51,22 C50,23 52,24 53,23 M49,31 C48,32 50,33 51,32" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
    </svg>`,

    bao: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="skin-paper" x1="30%" y1="90%" x2="70%" y2="10%">
                <stop offset="0%" stop-color="#ab6b4f" />
                <stop offset="30%" stop-color="#d68c6a" />
                <stop offset="70%" stop-color="#f5be9e" />
                <stop offset="100%" stop-color="#ffd5be" />
            </linearGradient>
            <linearGradient id="nail-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#e28b8b" />
                <stop offset="60%" stop-color="#fca5a5" />
                <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
            <filter id="glow-bao" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <!-- Background Neon Glow Path -->
        <path d="M40,95 C30,95 24,80 24,70 C12,62 10,50 20,44 C25,41 31,52 34,58 C32,41 24,18 29,13 C34.5,8 39.5,14 41.5,28 C43.5,18 46.5,8 51.5,8 C56.5,8 57.5,18 56.5,28 C59.5,18 64.5,10 69.5,11 C74.5,12 73.5,22 70.5,31 C74.5,22 81.5,16 85.5,19 C89.5,22 86.5,32 82.5,45 C80.5,60 74,80 60,85 L58,95 Z" fill="none" stroke="#39ff14" stroke-width="4.5" filter="url(#glow-bao)" stroke-linejoin="round" />
        
        <!-- Arm/Wrist -->
        <path d="M40,95 L60,95 C58,82 58,80 56,76 C54,72 46,72 44,76 C42,80 42,82 40,95 Z" fill="url(#skin-paper)" />
        
        <!-- Main Hand Dorsum + Widely Spread Fingers -->
        <path d="M40,95 C30,95 24,80 24,70 C12,62 10,50 20,44 C25,41 31,52 34,58 C32,41 24,18 29,13 C34.5,8 39.5,14 41.5,28 C43.5,18 46.5,8 51.5,8 C56.5,8 57.5,18 56.5,28 C59.5,18 64.5,10 69.5,11 C74.5,12 73.5,22 70.5,31 C74.5,22 81.5,16 85.5,19 C89.5,22 86.5,32 82.5,45 C80.5,60 74,80 60,85 Z" fill="url(#skin-paper)" stroke="#39ff14" stroke-width="1" />
        
        <!-- Tendons/Bones on Back of Hand -->
        <path d="M41,76 C41,65 38,52 35,39" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M48,76 C48,62 50,50 50,32" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M56,76 C56,62 60,52 63,38" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        <path d="M63,76 C63,65 69,57 73,43" fill="none" stroke="#ab6b4f" stroke-width="1.5" opacity="0.4" />
        
        <!-- Joint Crease lines -->
        <!-- Thumb -->
        <path d="M19,50 C18,51 19,53 20,54" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Index -->
        <path d="M30.5,23 C29.5,23.5 29.5,24.5 30.5,25 M29.5,33 C28.5,33.5 28.5,34.5 29.5,35" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Middle -->
        <path d="M51.5,17 C50.5,17.5 50.5,18.5 51.5,19 M50.5,28 C49.5,28.5 49.5,29.5 50.5,30" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Ring -->
        <path d="M68.5,20 C67.5,20.5 67.5,21.5 68.5,22 M67.5,30 C66.5,30.5 66.5,31.5 67.5,32" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />
        <!-- Pinky -->
        <path d="M82.5,29 C81.5,29.5 81.5,30.5 82.5,31 M81.5,39 C80.5,39.5 80.5,40.5 81.5,41" fill="none" stroke="#68341f" stroke-width="1" opacity="0.7" />

        <!-- Nails -->
        <!-- Thumb Nail -->
        <path d="M17.5,43.5 C15.5,45.5 17.5,48.5 19.5,46.5 C20.5,45.5 19.5,44.5 17.5,43.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Index Nail -->
        <path d="M28.2,13.5 C28.2,16.5 31.8,16.5 31.8,13.5 C31.8,12.5 30,12.5 28.2,13.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Middle Nail -->
        <path d="M49.7,8.5 C49.7,11.5 53.3,11.5 53.3,8.5 C53.3,7.5 51.5,7.5 49.7,8.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Ring Nail -->
        <path d="M68.7,11.5 C68.7,14.5 72.3,14.5 72.3,11.5 C72.3,10.5 70.5,10.5 68.7,11.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
        <!-- Pinky Nail -->
        <path d="M82.7,19.5 C82.7,22.5 86.3,22.5 86.3,19.5 C86.3,18.5 84.5,18.5 82.7,19.5 Z" fill="url(#nail-grad)" stroke="#ab6b4f" stroke-width="0.5" />
    </svg>`,

    ẩn: `
    <svg viewBox="0 0 100 100" class="revealed-hand-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad-gold" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#7a5500" />
                <stop offset="40%" stop-color="#cca010" />
                <stop offset="80%" stop-color="#ffd700" />
                <stop offset="100%" stop-color="#fff8d0" />
            </linearGradient>
            <filter id="glow-an" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <!-- Background Neon Glow Path -->
        <path d="M40,95 C30,95 24,82 24,72 C24,52 30,44 38,44 C42,44 45,41 50,41 C54,41 57,43 62,43 C66,43 69,45 74,45 C78,45 81,50 81,60 C81,72 74,82 60,85 L58,95 Z" fill="none" stroke="#ffd700" stroke-width="4.5" filter="url(#glow-an)" stroke-linejoin="round" />
        
        <!-- Gold Metallic Arm/Wrist -->
        <path d="M40,95 L60,95 C58,82 58,80 56,76 C54,72 46,72 44,76 C42,80 42,82 40,95 Z" fill="url(#grad-gold)" />
        
        <!-- Main Fist Dorsum in shimmering Gold -->
        <path d="M40,95 C30,95 24,82 24,72 C24,52 30,44 38,44 C42,44 45,41 50,41 C54,41 57,43 62,43 C66,43 69,45 74,45 C78,45 81,50 81,60 C81,72 74,82 60,85 Z" fill="url(#grad-gold)" stroke="#ffd700" stroke-width="1.5" />
        
        <!-- Shimmering overlay details for mystery question mark (?) -->
        <text x="50" y="65" font-family="'Inter', sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" filter="url(#glow-an)" opacity="0.95">?</text>
        
        <!-- High-tech grid patterns to look mystical and holographic -->
        <path d="M30,55 L74,55 M34,65 L70,65 M42,45 C47,50 56,50 62,45" fill="none" stroke="#ffffff" stroke-width="0.75" stroke-dasharray="2,2" opacity="0.6" />
    </svg>`
};
