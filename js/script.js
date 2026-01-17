// Game State
const gameState = {
    started: false,
    currentLevel: 0,
    worldX: 0,
    characterY: 100,
    velocityY: 0,
    isJumping: false,
    isGrounded: true,
    isMoving: false,
    direction: 1,
    vehicle: 'walk',
    collectedBadges: [],
    xp: 0,
    maxXP: 2850,
    soundEnabled: true,
    keys: { left: false, right: false, up: false, down: false }
};

// Audio
let audioCtx = null;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (!gameState.soundEnabled || !audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    switch (type) {
        case 'jump':
            oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
            break;
        case 'collect':
            oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.08);
            oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.16);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
        case 'vehicle':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
            break;
    }
}

// Level Data
const levels = [
    { name: "Introduction", subtitle: "Barcelona, Spain", width: 140, bgClass: "level-0" },
    { name: "Americold", subtitle: "Supply Chain Systems Specialist", width: 140, bgClass: "level-1" },
    { name: "ID Logistics", subtitle: "Engineering & Process Manager", width: 140, bgClass: "level-2" },
    { name: "Forvia (Faurecia)", subtitle: "Supply Chain & Systems Lead", width: 140, bgClass: "level-3" },
    { name: "Education", subtitle: "UTBM & IUT Nice", width: 140, bgClass: "level-4" },
    { name: "Hobbies", subtitle: "Personal Interests", width: 140, bgClass: "level-2" },
    { name: "Contact & Finale", subtitle: "Let's Connect!", width: 140, bgClass: "level-5" }
];

// Badges - positioned at reachable heights
const badges = [
    { level: 0, x: 250, y: 140, icon: "📊", label: "Power BI" },
    { level: 0, x: 450, y: 140, icon: "🐍", label: "Python" },
    { level: 1, x: 200, y: 140, icon: "📦", label: "WMS" },
    { level: 1, x: 350, y: 140, icon: "🔗", label: "EDI" },
    { level: 1, x: 500, y: 140, icon: "❄️", label: "Cold Chain" },
    { level: 2, x: 200, y: 140, icon: "📈", label: "Analytics" },
    { level: 2, x: 350, y: 140, icon: "⚙️", label: "Process" },
    { level: 2, x: 500, y: 140, icon: "💰", label: "Savings" },
    { level: 3, x: 200, y: 140, icon: "🏭", label: "29 Plants" },
    { level: 3, x: 350, y: 140, icon: "🔧", label: "SAP" },
    { level: 3, x: 500, y: 140, icon: "🚗", label: "Automotive" },
    { level: 4, x: 250, y: 140, icon: "🎓", label: "M.Sc." },
    { level: 4, x: 450, y: 140, icon: "⚡", label: "B.Sc." },
    { level: 5, x: 200, y: 140, icon: "🏃", label: "Sports" },
    { level: 5, x: 350, y: 140, icon: "📚", label: "Reading" },
    { level: 5, x: 500, y: 140, icon: "💻", label: "Coding" },
    { level: 5, x: 650, y: 140, icon: "�", label: "Cooking" },
    { level: 6, x: 250, y: 140, icon: "�🌍", label: "Impact" },
    { level: 6, x: 450, y: 140, icon: "🏆", label: "Leader" }
];

// Vehicle zones
const vehicleZones = [
    { level: 0, x: 600, vehicle: 'forklift' },
    { level: 3, x: 650, vehicle: 'car' },
    { level: 4, x: 1000, vehicle: 'plane' }
];

function generateLevelHTML(levelIndex) {
    const level = levels[levelIndex];
    // Calculate offset based on previous levels
    let levelOffset = 0;
    for (let i = 0; i < levelIndex; i++) levelOffset += levels[i].width;

    let html = `<div class="level ${level.bgClass}" style="left: ${levelOffset}vw; width: ${level.width}vw;">`;
    html += `<div class="ground"></div>`;

    // Road markings
    const markCount = Math.floor(level.width * window.innerWidth / 100 / 100) + 5;
    for (let i = 0; i < 30; i++) {
        html += `<div class="road-marking" style="left: ${i * 100 + 30}px;"></div>`;
    }

    // Stars
    if (levelIndex !== 6) { // Final level index is now 6
        for (let i = 0; i < 60; i++) {
            const size = Math.random() * 2 + 1;
            const opacity = Math.random() * 0.5 + 0.5;
            html += `<div class="star" style="left: ${Math.random() * (level.width - 10)}vw; top: ${Math.random() * 50}%; width: ${size}px; height: ${size}px; opacity: ${opacity}; animation-delay: ${Math.random() * 3}s;"></div>`;
        }
    }

    // Level content
    html += generateLevelContent(levelIndex);

    // Info panel
    html += generateInfoPanel(levelIndex);

    // Badges
    badges.filter(b => b.level === levelIndex).forEach(b => {
        const globalIndex = badges.indexOf(b);
        html += `
                    <div class="badge" id="badge-${globalIndex}" style="left: ${b.x}px; bottom: ${b.y}px;" data-index="${globalIndex}">
                        <div class="badge-icon">${b.icon}</div>
                        <div class="badge-label">${b.label}</div>
                    </div>
                `;
    });

    // Vehicle zones
    vehicleZones.filter(v => v.level === levelIndex).forEach(v => {
        if (v.vehicle === 'forklift') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="forklift">
                            <div class="parked-forklift">
                                <div style="position:absolute;bottom:15px;left:20px;width:50px;height:35px;background:linear-gradient(180deg,#f4c430,#daa520);border:3px solid #b8860b;border-radius:3px;"></div>
                                <div style="position:absolute;bottom:35px;left:25px;width:40px;height:30px;background:linear-gradient(180deg,#f4c430,#daa520);border:3px solid #b8860b;border-radius:3px 10px 3px 3px;"></div>
                                <div style="position:absolute;bottom:18px;left:5px;width:6px;height:45px;background:#666;"></div>
                                <div style="position:absolute;bottom:3px;left:15px;width:18px;height:18px;background:#333;border-radius:50%;"></div>
                                <div style="position:absolute;bottom:3px;left:55px;width:18px;height:18px;background:#333;border-radius:50%;"></div>
                            </div>
                        </div>
                    `;
        } else if (v.vehicle === 'car') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="car">
                            <div class="parked-car">
                                <div style="position:absolute;bottom:15px;left:10px;width:100px;height:25px;background:linear-gradient(180deg,#3E0097,#2a0066);border-radius:8px 15px 3px 3px;border:2px solid #1a0044;"></div>
                                <div style="position:absolute;bottom:38px;left:30px;width:55px;height:22px;background:linear-gradient(180deg,#3E0097,#2a0066);border-radius:12px 12px 0 0;border:2px solid #1a0044;"></div>
                                <div style="position:absolute;bottom:5px;left:18px;width:20px;height:20px;background:#333;border-radius:50%;"></div>
                                <div style="position:absolute;bottom:5px;left:80px;width:20px;height:20px;background:#333;border-radius:50%;"></div>
                            </div>
                        </div>
                    `;
        } else if (v.vehicle === 'plane') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="plane">
                            <div class="parked-plane" style="position: relative; width: 100%; height: 100%;">
                                <div style="position:absolute;bottom:15px;left:10px;width:80px;height:25px;background:#ddd;border-radius:50% 10px 10px 50%;border:2px solid #999;"></div>
                                <div style="position:absolute;bottom:35px;left:40px;width:10px;height:30px;background:#ccc;transform:skewX(-20deg);"></div>
                                <div style="position:absolute;bottom:8px;left:20px;width:15px;height:15px;background:#333;border-radius:50%;"></div>
                                <div style="position:absolute;bottom:5px;right:0px;width:40px;height:4px;background:#999;"></div>
                            </div>
                        </div>
                    `;
        }
    });

    html += `</div>`;
    return html;
}

function generateLevelContent(levelIndex) {
    let html = '';

    switch (levelIndex) {
        case 0: // Intro - Barcelona
            // Main warehouse
            html += `
                        <div class="warehouse" style="left: 50px;">
                            <div class="warehouse-structure" style="width: 200px; height: 180px;">
                                <div class="warehouse-roof"></div>
                                <div class="warehouse-sign">BARCELONA HQ</div>
                                <div class="loading-dock" style="left: 20px;">
                                    <div class="dock-door open"></div>
                                    <div class="dock-platform"></div>
                                </div>
                                <div class="loading-dock" style="left: 110px;">
                                    <div class="dock-door open"></div>
                                    <div class="dock-platform"></div>
                                </div>
                            </div>
                        </div>
                    `;
            // Pallet stacks
            html += generatePalletStack(280, 3);
            html += generatePalletStack(360, 2);
            // Animated workers
            html += generateAnimatedWorker(300, 0);
            html += generateAnimatedWorker(400, 2);
            // Working forklift
            html += generateWorkingForklift(500, 1);
            // Conveyor
            html += `
                        <div class="conveyor-system" style="left: 550px;">
                            <div class="conveyor-frame" style="width: 150px;">
                                <div class="conveyor-belt"></div>
                                <div class="conveyor-box" style="animation-delay: 0s;"></div>
                            </div>
                            <div class="conveyor-leg" style="left: 20px;"></div>
                            <div class="conveyor-leg" style="left: 120px;"></div>
                        </div>
                    `;
            break;

        case 1: // Americold
            html += `
                        <div class="cold-storage" style="left: 50px; width: 220px; height: 180px;">
                            <div class="frost-overlay"></div>
                            <div class="cold-unit-label">AMERICOLD</div>
                            <div class="temp-display">-25°C</div>
                            ${generateIcicles(8)}
                            <div class="loading-dock" style="left: 30px; bottom: 0;">
                                <div class="dock-door open"></div>
                                <div class="dock-platform"></div>
                            </div>
                            <div class="loading-dock" style="left: 110px; bottom: 0;">
                                <div class="dock-door open"></div>
                                <div class="dock-platform"></div>
                            </div>
                        </div>
                        <div class="cold-storage" style="left: 300px; width: 180px; height: 160px;">
                            <div class="frost-overlay"></div>
                            <div class="cold-unit-label">27 SITES</div>
                            <div class="temp-display">-18°C</div>
                            ${generateIcicles(6)}
                        </div>
                    `;
            // Ground pallets
            html += generatePalletStack(500, 2);
            // Workers
            html += generateAnimatedWorker(280, 1);
            html += generateAnimatedWorker(450, 3);
            // Working forklift
            html += generateWorkingForklift(600, 2);
            break;

        case 2: // ID Logistics
            html += `
                        <div class="warehouse" style="left: 50px;">
                            <div class="warehouse-structure" style="width: 200px; height: 200px;">
                                <div class="warehouse-roof"></div>
                                <div class="warehouse-sign">ID LOGISTICS</div>
                                <div class="loading-dock" style="left: 30px;">
                                    <div class="dock-door open"></div>
                                    <div class="dock-platform"></div>
                                </div>
                                <div class="loading-dock" style="left: 110px;">
                                    <div class="dock-door open"></div>
                                    <div class="dock-platform"></div>
                                </div>
                            </div>
                        </div>
                        <div class="factory" style="left: 300px;">
                            <div class="factory-building" style="width: 150px; height: 160px;">
                                <div class="chimney" style="left: 20px; top: -50px; width: 30px; height: 50px;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -20px; left: 5px;"></div>
                                </div>
                                <div class="warehouse-sign" style="top: 20px; font-size: 12px;">TARRAGONA</div>
                                <div class="factory-door" style="left: 45px; width: 60px; height: 80px;"></div>
                                ${generateIndustrialWindows(3, 2, 10, 80)}
                            </div>
                        </div>
                    `;
            // Pallet stacks
            html += generatePalletStack(500, 3);
            // Workers
            html += generateAnimatedWorker(260, 0);
            html += generateAnimatedWorker(470, 2);
            // Forklift
            html += generateWorkingForklift(550, 0);
            break;

        case 3: // Forvia - Automotive
            // Factory 1
            html += `
                        <div class="factory" style="left: 50px;">
                            <div class="factory-building" style="width: 200px; height: 180px;">
                                <div class="chimney" style="left: 30px; top: -50px; width: 30px; height: 50px;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -20px; left: 5px;"></div>
                                </div>
                                <div class="warehouse-sign" style="top: 20px; font-size: 14px;">FORVIA</div>
                                <div style="position: absolute; top: 45px; left: 50%; transform: translateX(-50%); color: #ccc; font-size: 10px;">(FAURECIA)</div>
                                <div class="factory-door" style="left: 70px; width: 60px; height: 80px;"></div>
                                ${generateIndustrialWindows(3, 2, 10, 80)}
                            </div>
                        </div>
                    `;
            // Factory 2
            html += `
                        <div class="factory" style="left: 280px;">
                            <div class="factory-building" style="width: 150px; height: 150px;">
                                <div class="chimney" style="left: 60px; top: -40px; width: 25px; height: 40px;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -15px; left: 5px;"></div>
                                </div>
                                <div class="warehouse-sign" style="top: 20px; font-size: 10px;">29 PLANTS</div>
                                ${generateIndustrialWindows(2, 2, 10, 60)}
                            </div>
                        </div>
                    `;
            // Truck
            html += `
                        <div class="parked-truck" style="left: 450px;">
                            <div class="truck-trailer"></div>
                            <div class="truck-cab">
                                <div class="truck-window"></div>
                            </div>
                            <div class="truck-wheel" style="left: 15px;"></div>
                            <div class="truck-wheel" style="left: 80px;"></div>
                            <div class="truck-wheel" style="left: 130px;"></div>
                        </div>
                    `;
            // Pallets
            html += generatePalletStack(600, 2);
            // Workers
            html += generateAnimatedWorker(260, 1);
            html += generateAnimatedWorker(400, 0);
            // Forklift
            html += generateWorkingForklift(700, 2);
            break;

        case 4: // Education
            // UTBM
            html += `
                        <div class="university" style="left: 50px;">
                            <div class="university-building" style="width: 200px; height: 160px;">
                                <div class="university-pediment"></div>
                                <div class="university-name">UTBM</div>
                                <div class="university-date">2016 - 2020</div>
                                <div class="university-column" style="left: 20px; height: 80px; bottom: 0;"></div>
                                <div class="university-column" style="left: 50px; height: 80px; bottom: 0;"></div>
                                <div class="university-column" style="left: 130px; height: 80px; bottom: 0;"></div>
                                <div class="university-column" style="left: 160px; height: 80px; bottom: 0;"></div>
                                <div class="university-door"></div>
                            </div>
                        </div>
                    `;
            // IUT Nice
            html += `
                        <div class="university" style="left: 300px;">
                            <div class="university-building" style="width: 150px; height: 140px;">
                                <div class="university-pediment"></div>
                                <div class="university-name">IUT Nice</div>
                                <div class="university-date">2013 - 2015</div>
                                <div class="university-column" style="left: 15px; height: 70px; bottom: 0;"></div>
                                <div class="university-column" style="left: 115px; height: 70px; bottom: 0;"></div>
                                <div class="university-door" style="width: 40px;"></div>
                            </div>
                        </div>
                    `;
            // Flags - Positioned correctly on poles
            html += `
                        <div class="flag-display" style="left: 500px;">
                            <div class="flag-pole"></div>
                            <div class="flag-cloth flag-fr" style="top:5px; left:2px;"></div>
                        </div>
                        <div class="flag-display" style="left: 560px;">
                            <div class="flag-pole"></div>
                            <div class="flag-cloth flag-uk" style="top:5px; left:2px;"></div>
                        </div>
                        <div class="flag-display" style="left: 620px;">
                            <div class="flag-pole"></div>
                            <div class="flag-cloth flag-es" style="top:5px; left:2px;"></div>
                        </div>
                        <div class="flag-display" style="left: 680px;">
                            <div class="flag-pole"></div>
                            <div class="flag-cloth flag-cn" style="top:5px; left:2px;"></div>
                        </div>
                    `;
            break;

        case 5: // Hobbies
            // Running NPC (Orange body for contrast)
            html += `
                        <div class="animated-worker" style="left: 100px; animation: runBackForth 4s linear infinite;">
                           <div class="worker-figure">
                                <div class="worker-head" style="background:#ffccaa;"></div>
                                <div class="worker-body" style="background:#ff6600;"></div>
                                <div class="walk-leg left"></div>
                                <div class="walk-leg right"></div>
                            </div> 
                        </div>
                        <div style="position: absolute; left: 80px; bottom: 200px; color: #3E0097; font-size: 14px; font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px; border: 2px solid #3E0097;">Running & Hiking</div>
                    `;

            // Reading NPC (Orange body)
            html += `
                        <div class="animated-worker" style="left: 300px; bottom: 100px;">
                            <div class="worker-figure">
                                <div class="worker-head"></div>
                                <div class="worker-body" style="background:#ff6600;"></div>
                                <div style="position:absolute; width: 14px; height: 18px; background: #fff; border: 1px solid #333; left: 20px; top: 15px; transform: rotate(-10deg);"></div>
                            </div>
                        </div>
                        <div style="position: absolute; left: 280px; bottom: 200px; color: #3E0097; font-size: 14px; font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px; border: 2px solid #3E0097;">Reading</div>
                    `;

            // Coding NPC
            html += `
                        <div style="position: absolute; left: 500px; bottom: 100px;">
                            <!-- Desk -->
                            <div style="position: absolute; bottom: 0; width: 60px; height: 35px; background: #666; border-top: 5px solid #444;"></div>
                            <!-- Laptop -->
                            <div style="position: absolute; bottom: 35px; left: 15px; width: 25px; height: 2px; background: #333;"></div>
                            <div style="position: absolute; bottom: 37px; left: 15px; width: 25px; height: 18px; background: #111; border: 1px solid #555;"></div>
                            
                            <div class="code-float" style="left: 10px; top: -50px;">While(True) { Code; }</div>
                        </div>
                        <div style="position: absolute; left: 480px; bottom: 200px; color: #3E0097; font-size: 14px; font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px; border: 2px solid #3E0097;">Coding</div>
                    `;

            // Cooking NPC
            html += `
                        <div style="position: absolute; left: 700px; bottom: 100px;">
                            <!-- Stove -->
                            <div style="position: absolute; bottom: 0; width: 50px; height: 40px; background: #ccc; border: 1px solid #999;"></div>
                            <!-- Pot -->
                            <div style="position: absolute; bottom: 40px; left: 10px; width: 30px; height: 15px; background: #555; border-radius: 0 0 5px 5px;"></div>
                            <div style="position: absolute; bottom: 55px; left: 15px; width: 20px; height: 10px; background: rgba(255,255,255,0.5); border-radius: 50% 50% 0 0; animation: steam 2s infinite;"></div>
                        </div>
                         <div style="position: absolute; left: 680px; bottom: 200px; color: #3E0097; font-size: 14px; font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px; border: 2px solid #3E0097;">Cooking</div>
                    `;

            html += generatePalletStack(850, 2);
            break;

        case 6: // Finale
            // Celebration building
            html += `
                        <div class="warehouse" style="left: 100px;">
                            <div class="warehouse-structure" style="width: 300px; height: 200px; background: linear-gradient(180deg, #3E0097 0%, #2a0066 100%); border-color: #FFD700;">
                                <div style="position: absolute; top: 60px; left: 50%; transform: translateX(-50%); color: #FFD700; font-size: 32px; font-weight: bold;">THANK YOU!</div>
                            </div>
                        </div>
                    `;
            // Golden stars
            for (let i = 0; i < 30; i++) {
                html += `<div class="star" style="left: ${Math.random() * 130 + 10}vw; top: ${Math.random() * 50 + 10}%; width: 4px; height: 4px; background: #FFD700; animation-delay: ${Math.random() * 3}s;"></div>`;
            }
            // Pallet stacks
            html += generatePalletStack(450, 2);
            html += generatePalletStack(530, 3);
            break;
    }

    return html;
}

function generateInfoPanel(levelIndex) {
    // Panels are now raised (bottom ~350px) to simulate billboards with legs
    // And pushed slightly right to avoid overlapping buildings
    const panels = [
        `<div class="info-panel" style="left: 260px; bottom: 350px;">
                    <h2>Roman Baron</h2>
                    <p><span class="highlight">Global Supply Chain Transformation Leader</span></p>
                    <p>📍 Barcelona, Spain</p>
                    <p>📧 rbaronpro@gmail.com</p>
                    <p>📱 +34 644 00 23 69</p>
                    <h3>Navigate right to explore →</h3>
                </div>`,
        `<div class="info-panel" style="left: 320px; bottom: 350px;">
                    <h2>Americold</h2>
                    <p><span class="highlight">IT & Logistics Transformation Lead - Europe</span></p>
                    <p>Apr 2025 - Present | Barcelona, ES</p>
                    <ul>
                        <li>Lead multi-site supply chain system transformations across 27 European sites.</li>
                        <li>Deploy WMS solutions for new site launches, customer onboarding, and warehouse conversions.</li>
                        <li>Implement end to end EDI flows for major customers.</li>
                        <li>Align IT, operations, customers, and vendors to ensure smooth system delivery.</li>
                        <li>Build operational dashboards and KPIs to enhance leadership visibility.</li>
                    </ul>
                </div>`,
        `<div class="info-panel" style="left: 580px; bottom: 360px;">
                    <h2>ID Logistics</h2>
                    <p><span class="highlight">Engineering, Systems & Process Improvement Manager</span></p>
                    <p>May 2023 - Apr 2025 | Tarragona, ES</p>
                    <ul>
                        <li>Built and led a multidisciplinary team supporting engineering, analytics and operational excellence.</li>
                        <li>Created planning department and redesigned planning and execution processes.</li>
                        <li>Led transition to bonded warehouse, standardizing workflows to optimize export costs.</li>
                        <li>Delivered <span class="highlight">€3M total savings</span> via process redesign, automation, and capacity optimization.</li>
                    </ul>
                </div>`,
        `<div class="info-panel" style="left: 480px; bottom: 350px;">
                    <h2>Forvia (Faurecia)</h2>
                    <p><span class="highlight">Supply Chain & Systems Improvement Lead – Europe</span></p>
                    <p>Jan 2021 - May 2023 | Prague, CZ / Valencia, ES</p>
                    <ul>
                        <li>Spearheaded logistics transformation across 29 European plants; <span class="highlight">€2M annual savings</span></li>
                        <li>Standardized processes, optimized planning and delivery frequency, implemented consignment programs.</li>
                        <li>Executed global SAP enhancements, supervised bonded warehouses and EDI onboarding.</li>
                        <li>Industry 4.0 Champion trained by Porsche Consulting.</li>
                    </ul>
                </div>`,
        `<div class="info-panel" style="left: 770px; bottom: 380px;">
                    <h2>Education & Certifications</h2>
                    <h3>🎓 M.Sc. Industrial Systems</h3>
                    <p>UTBM | 2016-2020</p>
                    <h3>⚡ B.Sc. Electrical Engineering & IT</h3>
                    <p>IUT Nice | 2013-2015</p>
                    <br>
                    <p><strong>Awards:</strong> Innovation Crunch Time UTBM 2017</p>
                    <p><strong>Languages:</strong> English, French, Spanish (Native/Bilingual), Chinese (Limited)</p>
                </div>`,
        `<div class="info-panel" style="left: 720px; bottom: 330px;">
                    <h2>Hobbies & Interests</h2>
                    <p>🏃 <strong>Sports:</strong> Running, Hiking, Padel</p>
                    <p>📚 <strong>Reading:</strong> Continuous learning</p>
                    <p>💻 <strong>Coding:</strong> Python, Web Dev</p>
                    <p>🍳 <strong>Cooking:</strong> Culinary arts</p>
                </div>`,
        `<div class="info-panel contact-billboard" style="left: 50%; transform: translateX(-50%); bottom: 380px; width: 350px;">
                    <h2 style="font-size: 28px; margin-bottom: 20px;">Let's Connect!</h2>
                    <p style="font-size: 18px; margin-bottom: 5px;"><span class="highlight">€7M+ Total Savings</span></p>
                    <p style="font-size: 18px; margin-bottom: 5px;"><span class="highlight">60+ Sites Transformed</span></p>
                    <p style="font-size: 14px; color: #666;">Railway, Automotive, Warehousing and Retail</p>
                    <br>
                    <p style="font-size: 16px;">📧 <a href="mailto:rbaronpro@gmail.com" style="color:#3E0097">rbaronpro@gmail.com</a></p>
                    <p style="font-size: 16px;">📱 +34 644 00 23 69</p>
                    <p style="font-size: 16px;">💼 <a href="https://www.linkedin.com/in/roman-baron-7912b2a9" target="_blank" style="color:#3E0097">LinkedIn</a></p>
                    <p style="font-size: 16px;">💻 <a href="https://github.com/Rom946" target="_blank" style="color:#3E0097">GitHub: Rom946</a></p>
                </div>`
    ];
    return panels[levelIndex] || '';
}

function generatePalletStack(x, layers) {
    let html = `<div class="pallet-stack" style="left: ${x}px; width: 80px;">`;
    html += `<div class="pallet-base"></div>`;
    for (let i = 0; i < layers; i++) {
        const w = 70 - i * 5;
        const l = (80 - w) / 2;
        html += `<div class="stacked-box" style="bottom: ${12 + i * 28}px; left: ${l}px; width: ${w}px; height: 26px;"></div>`;
    }
    html += `</div>`;
    return html;
}

function generateAnimatedWorker(x, delay) {
    return `
                <div class="animated-worker ${delay % 2 === 1 ? 'reverse' : ''}" style="left: ${x}px; animation-delay: ${delay}s;">
                    <div class="worker-figure">
                        <div class="worker-helmet"></div>
                        <div class="worker-head"></div>
                        <div class="worker-vest"></div>
                        <div class="worker-pants"></div>
                        <div class="worker-box"></div>
                    </div>
                </div>
            `;
}

function generateWorkingForklift(x, delay) {
    return `
                <div class="working-forklift" style="left: ${x}px; animation-delay: ${delay}s;">
                    <div class="working-forklift-mast"></div>
                    <div class="working-forklift-forks"></div>
                    <div class="working-forklift-load"></div>
                    <div class="working-forklift-body"></div>
                    <div class="working-forklift-wheel front"></div>
                    <div class="working-forklift-wheel back"></div>
                </div>
            `;
}

function generateIcicles(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        const h = Math.random() * 12 + 8;
        html += `<div class="icicle" style="left: ${8 + i * 22}px; height: ${h}px;"></div>`;
    }
    return html;
}

function generateIndustrialWindows(cols, rows, startX, startY) {
    let html = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const lit = Math.random() > 0.6 ? 'lit' : '';
            html += `<div class="industrial-window ${lit}" style="left: ${startX + c * 45}px; top: ${startY + r * 40}px; width: 35px; height: 30px;"></div>`;
        }
    }
    return html;
}

function getLevelStartX(levelIndex) {
    let offset = 0;
    for (let i = 0; i < levelIndex; i++) {
        offset += levels[i].width;
    }
    return offset * window.innerWidth / 100;
}

function initGameWorld() {
    const gameWorld = document.getElementById('gameWorld');
    gameWorld.innerHTML = '';

    let totalWidth = 0;
    levels.forEach(l => totalWidth += l.width);

    gameWorld.style.width = totalWidth + 'vw';
    levels.forEach((_, i) => gameWorld.innerHTML += generateLevelHTML(i));
    updateCharacterDisplay();
}

function updateCharacterDisplay() {
    const character = document.getElementById('character');
    let html = '';

    switch (gameState.vehicle) {
        case 'walk':
            html = `
                        <div class="character-walk ${gameState.isMoving ? 'walking' : ''}">
                            <div class="walk-helmet"></div>
                            <div class="walk-head"></div>
                            <div class="walk-body"></div>
                            <div class="walk-arm left"></div>
                            <div class="walk-arm right"></div>
                            <div class="walk-leg left"></div>
                            <div class="walk-leg right"></div>
                        </div>
                    `;
            break;
        case 'forklift':
            html = `
                        <div class="character-forklift ${gameState.isMoving ? 'driving' : ''}">
                            <div class="forklift-mast"></div>
                            <div class="forklift-forks"></div>
                            <div class="forklift-cabin"><div class="forklift-window"></div></div>
                            <div class="forklift-operator"><div class="operator-head"></div><div class="operator-body"></div></div>
                            <div class="forklift-body"></div>
                            <div class="forklift-wheel front"></div>
                            <div class="forklift-wheel back"></div>
                        </div>
                    `;
            break;
        case 'car':
            html = `
                        <div class="character-car ${gameState.isMoving ? 'driving' : ''}">
                            <div class="car-body"></div>
                            <div class="car-top"></div>
                            <div class="car-window front"></div>
                            <div class="car-window back"></div>
                            <div class="car-driver"><div class="driver-head"></div><div class="driver-body"></div></div>
                            <div class="car-headlight"></div>
                            <div class="car-taillight"></div>
                            <div class="car-wheel front"></div>
                            <div class="car-wheel back"></div>
                        </div>
                    `;
            break;
        case 'plane':
            html = `
                        <div class="character-plane" style="width: 120px; height: 60px;">
                            <div class="plane-body" style="position:absolute; bottom:0; width:100px; height:30px; background:#ccc; border-top-right-radius: 10px; border-bottom-right-radius: 5px;"></div>
                            <div class="plane-wing" style="position:absolute; bottom:15px; left:40px; width:40px; height:10px; background:#999; transform:skewX(-20deg);"></div>
                            <div class="plane-tail" style="position:absolute; bottom:20px; left:5px; width:20px; height:25px; background:#ccc; border-radius:5px 0 0 0;"></div>
                            <div class="plane-prop" style="position:absolute; bottom:5px; right:-5px; width:5px; height:40px; background:#333; animation: spin 0.1s infinite;"></div>
                            <div class="plane-pilot" style="position:absolute; bottom:15px; right:30px; width:15px; height:15px; background:#ffccaa; border-radius:50%;"></div>
                        </div>
                    `;
            break;
    }

    character.innerHTML = html;

    const icons = { walk: '🚶', forklift: '🚜', car: '🚗', plane: '✈️' };
    const names = { walk: 'On Foot', forklift: 'Forklift', car: 'Car', plane: 'Plane' };
    document.getElementById('vehicleIcon').textContent = icons[gameState.vehicle];
    document.getElementById('vehicleName').textContent = names[gameState.vehicle];
}

// Physics
const GRAVITY = 0.6;
const JUMP_FORCE = 12;
const MOVE_SPEED = { walk: 5, forklift: 7, car: 10, plane: 15 };
const GROUND_Y = 100;

function getCharacterWidth() {
    return { walk: 40, forklift: 100, car: 140, plane: 120 }[gameState.vehicle];
}

function getCharacterHeight() {
    return { walk: 70, forklift: 80, car: 70, plane: 80 }[gameState.vehicle];
}

function update() {
    if (!gameState.started) return;

    const speed = MOVE_SPEED[gameState.vehicle];
    let moved = false;

    if (gameState.keys.left) {
        gameState.worldX -= speed;
        gameState.direction = -1;
        moved = true;
    }
    if (gameState.keys.right) {
        gameState.worldX += speed;
        gameState.direction = 1;
        moved = true;
    }

    let totalWidth = 0;
    levels.forEach(l => totalWidth += l.width);
    const maxX = (totalWidth * window.innerWidth / 100) - window.innerWidth;
    gameState.worldX = Math.max(0, Math.min(gameState.worldX, maxX));

    // Gravity (only if not plane)
    if (gameState.vehicle === 'plane') {
        gameState.isGrounded = false;
        // Plane flight controls
        if (gameState.keys.up) gameState.characterY += 5;
        if (gameState.keys.down) gameState.characterY -= 5;

        // Cap height
        gameState.characterY = Math.max(GROUND_Y + 50, Math.min(gameState.characterY, window.innerHeight - 100));
    } else {
        if (!gameState.isGrounded) {
            gameState.velocityY -= GRAVITY;
            gameState.characterY += gameState.velocityY;
        }

        // Ground
        if (gameState.characterY <= GROUND_Y) {
            gameState.characterY = GROUND_Y;
            gameState.velocityY = 0;
            gameState.isGrounded = true;
            gameState.isJumping = false;
        }
    }

    if (moved !== gameState.isMoving) {
        gameState.isMoving = moved;
        updateCharacterDisplay();
    }

    document.getElementById('gameWorld').style.transform = `translateX(${-gameState.worldX}px)`;
    const character = document.getElementById('character');
    character.style.bottom = gameState.characterY + 'px';
    character.style.transform = `scaleX(${gameState.direction})`;

    checkCurrentLevel();
    checkBadgeCollisions();
    checkVehicleZones();

    requestAnimationFrame(update);
}

function checkBadgeCollisions() {
    const charX = window.innerWidth * 0.15 + gameState.worldX;
    const charW = getCharacterWidth();
    const charY = gameState.characterY;
    const charH = getCharacterHeight();

    badges.forEach((badge, index) => {
        if (badge.collected) return;

        const badgeX = getLevelStartX(badge.level) + badge.x;
        const badgeY = badge.y;

        if (charX + charW > badgeX && charX < badgeX + 45 &&
            charY + charH > badgeY && charY < badgeY + 45) {
            collectBadge(index);
        }
    });
}

function collectBadge(index) {
    const badge = badges[index];
    if (badge.collected) return;

    badge.collected = true;
    gameState.collectedBadges.push(index);
    gameState.xp += 150;

    const badgeEl = document.getElementById(`badge-${index}`);
    if (badgeEl) {
        createParticles(badgeEl);
        badgeEl.classList.add('collected');
    }

    document.getElementById('badgeNum').textContent = gameState.collectedBadges.length;
    document.getElementById('xpFill').style.width = (gameState.xp / gameState.maxXP * 100) + '%';
    document.getElementById('xpText').textContent = `${gameState.xp} / ${gameState.maxXP} XP`;

    playSound('collect');
}

function createParticles(el) {
    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'collect-particle';
        p.style.left = rect.left + rect.width / 2 + 'px';
        p.style.top = rect.top + rect.height / 2 + 'px';
        p.style.setProperty('--tx', (Math.random() - 0.5) * 80 + 'px');
        p.style.setProperty('--ty', (Math.random() - 0.5) * 80 + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 500);
    }
}

function checkVehicleZones() {
    const charX = window.innerWidth * 0.15 + gameState.worldX;

    vehicleZones.forEach(zone => {
        const zoneX = getLevelStartX(zone.level) + zone.x;

        if (Math.abs(charX - zoneX) < 80 && gameState.vehicle !== zone.vehicle) {
            gameState.vehicle = zone.vehicle;

            // Mark zone as taken to hide vehicle
            const zoneEl = document.getElementById(`zone-${zone.level}-${zone.x}`);
            if (zoneEl) zoneEl.classList.add('taken');

            updateCharacterDisplay();
            playSound('vehicle');

            // If plane, lift off a bit
            if (gameState.vehicle === 'plane') gameState.characterY += 50;
        }
    });
}

function checkCurrentLevel() {
    const charX = gameState.worldX + window.innerWidth * 0.15;
    let currentX = 0;
    let newLevel = 0;

    for (let i = 0; i < levels.length; i++) {
        const levelPixelWidth = levels[i].width * window.innerWidth / 100;
        if (charX >= currentX && charX < currentX + levelPixelWidth) {
            newLevel = i;
            break;
        }
        currentX += levelPixelWidth;
    }

    if (newLevel !== gameState.currentLevel) {
        gameState.currentLevel = newLevel;
        document.getElementById('levelName').textContent = levels[newLevel].name;
        document.getElementById('levelSubtitle').textContent = levels[newLevel].subtitle;

        // Trigger Truck Animation
        if (newLevel === 3) { // Forvia level
            const truck = document.querySelector('.parked-truck');
            if (truck) truck.classList.add('truck-depart');
        }
    }
}

function jump() {
    if (gameState.isGrounded && !gameState.isJumping) {
        gameState.velocityY = JUMP_FORCE;
        gameState.isGrounded = false;
        gameState.isJumping = true;
        playSound('jump');
    }
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameState.started) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        gameState.keys.up = true;
        if (gameState.vehicle !== 'plane') {
            // Jump logic if not plane (or use Space)
            // Keeping original jump mapping for Up arrow in non-plane mode
            e.preventDefault();
            jump();
        }
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') gameState.keys.down = true;
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') gameState.keys.up = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') gameState.keys.down = false;
});

// Mobile
document.getElementById('btnLeft').addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys.left = true; });
document.getElementById('btnLeft').addEventListener('touchend', () => gameState.keys.left = false);
document.getElementById('btnRight').addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys.right = true; });
document.getElementById('btnRight').addEventListener('touchend', () => gameState.keys.right = false);
document.getElementById('btnJump').addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });

// Sound toggle
document.getElementById('soundToggle').addEventListener('click', () => {
    gameState.soundEnabled = !gameState.soundEnabled;
    document.getElementById('soundToggle').textContent = gameState.soundEnabled ? '🔊' : '🔇';
});

// Start
document.getElementById('startButton').addEventListener('click', () => {
    initAudio();
    document.getElementById('startScreen').style.display = 'none';
    gameState.started = true;
    initGameWorld();
    update();
});

// Ambient Animations
function startAmbientAnimations() {
    // Traffic
    setInterval(() => {
        if (!gameState.started) return;
        if (Math.random() > 0.4) spawnTraffic();
    }, 2000);

    // Planes
    setInterval(() => {
        if (!gameState.started) return;
        spawnPlane();
    }, 15000 + Math.random() * 10000);
}

document.getElementById('startButton').addEventListener('click', startAmbientAnimations);

function spawnTraffic() {
    const gameWorld = document.getElementById('gameWorld');
    const direction = Math.random() > 0.5 ? 1 : -1; // 1 = Left to Right, -1 = Right to Left
    const vehicleType = Math.random() > 0.7 ? 'traffic-truck' : 'traffic-car';

    const el = document.createElement('div');
    el.className = 'traffic-vehicle ' + vehicleType;

    const viewWidth = window.innerWidth;
    // Spawn outside view
    const offset = 200;

    const randomY = Math.random() > 0.5 ? 15 : 45; // Fixed lanes: 15px (L->R) or 45px (R->L)

    // Override direction based on Y position (lanes)
    // Bottom lane (15px): Left to Right
    // Top lane (45px): Right to Left
    const laneDirection = randomY === 15 ? 1 : -1;
    // Recalculate based on fixed lanes
    const startX = laneDirection === 1 ? gameState.worldX - offset : gameState.worldX + viewWidth + offset;
    const endX = laneDirection === 1 ? gameState.worldX + viewWidth + offset : gameState.worldX - offset;

    el.style.left = startX + 'px';
    el.style.bottom = randomY + 'px';
    if (laneDirection === -1) el.style.transform = 'scaleX(-1)';

    gameWorld.appendChild(el);

    // Force reflow
    el.offsetHeight;

    // Animate
    const distance = Math.abs(endX - startX);
    const speed = 150 + Math.random() * 150; // px/sec
    const duration = distance / speed;

    el.style.transition = 'left ' + duration + 's linear';
    el.style.left = endX + 'px';

    // Cleanup
    setTimeout(() => {
        el.remove();
    }, duration * 1000);
}

function spawnPlane() {
    const gameWorld = document.getElementById('gameWorld');
    const el = document.createElement('div');
    el.className = 'plane';

    const randomY = 10 + Math.random() * 15; // 10-25% from top
    el.style.top = randomY + '%';

    const viewWidth = window.innerWidth;
    const offset = 200;
    const startX = gameState.worldX - offset;
    const endX = gameState.worldX + viewWidth + offset;

    el.style.left = startX + 'px';

    gameWorld.appendChild(el);

    el.offsetHeight;

    const duration = 20 + Math.random() * 5; // Slow flyover

    el.style.transition = 'left ' + duration + 's linear';
    el.style.left = endX + 'px';

    setTimeout(() => el.remove(), duration * 1000);
}
