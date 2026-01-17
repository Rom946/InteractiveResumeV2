/**
 * Roman Baron - Interactive Resume
 * Game Logic and Interactions
 */

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
maxXP: 2250,
soundEnabled: true,
keys: { left: false, right: false }
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

switch(type) {
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
{ name: "Introduction", subtitle: "Barcelona, Spain", width: 200, bgClass: "level-0" },
{ name: "Americold", subtitle: "Supply Chain Systems Specialist - Europe", width: 200, bgClass: "level-1" },
{ name: "ID Logistics", subtitle: "Engineering, Systems & Process Improvement Manager", width: 200, bgClass: "level-2" },
{ name: "Forvia (Faurecia)", subtitle: "Senior Supply Chain, Logistics & Systems Lead", width: 200, bgClass: "level-3" },
{ name: "Education", subtitle: "UTBM & IUT Nice", width: 200, bgClass: "level-4" },
{ name: "Life & Hobbies", subtitle: "Beyond Work", width: 200, bgClass: "level-2" },
{ name: "Contact & Finale", subtitle: "Let's Connect!", width: 200, bgClass: "level-5" }
];

// Badges - positioned at reachable heights
const badges = [
{ level: 0, x: 500, y: 140, icon: "📊", label: "Power BI" },
{ level: 0, x: 900, y: 140, icon: "🐍", label: "Python" },
{ level: 1, x: 400, y: 140, icon: "📦", label: "WMS" },
{ level: 1, x: 750, y: 140, icon: "🔗", label: "EDI" },
{ level: 1, x: 1100, y: 140, icon: "❄️", label: "Cold Chain" },
{ level: 2, x: 450, y: 140, icon: "📈", label: "Analytics" },
{ level: 2, x: 800, y: 140, icon: "⚙️", label: "Process Design" },
{ level: 2, x: 1150, y: 140, icon: "💰", label: "€3M Savings" },
{ level: 3, x: 400, y: 140, icon: "🏭", label: "29 Plants" },
{ level: 3, x: 750, y: 140, icon: "🔧", label: "SAP" },
{ level: 3, x: 1100, y: 140, icon: "🚗", label: "Automotive" },
{ level: 4, x: 500, y: 140, icon: "🎓", label: "M.Sc." },
{ level: 4, x: 900, y: 140, icon: "⚡", label: "B.Sc." },
{ level: 5, x: 500, y: 140, icon: "🌍", label: "€7M+ Impact" },
{ level: 5, x: 900, y: 140, icon: "🏆", label: "Leader" }
];

// Vehicle zones
const vehicleZones = [
{ level: 0, x: 1200, vehicle: 'forklift' },
{ level: 3, x: 1300, vehicle: 'car' }
];

function generateLevelHTML(levelIndex) {
const level = levels[levelIndex];
const levelOffset = levelIndex * 200;

let html = `<div class="level ${level.bgClass}" style="left: ${levelOffset}vw;">`;
html += `<div class="ground"></div>`;

// Road markings
for (let i = 0; i < 40; i++) {
    html += `<div class="road-marking" style="left: ${i * 100 + 30}px;"></div>`;
}

// Stars
if (levelIndex !== 6) {
    for (let i = 0; i < 40; i++) {
        html += `<div class="star" style="left: ${Math.random() * 190}vw; top: ${Math.random() * 30 + 5}%; animation-delay: ${Math.random() * 3}s;"></div>`;
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
            <div class="vehicle-zone" style="left: ${v.x}px;" data-vehicle="forklift">
                <div class="parked-forklift">
                    <div style="position:absolute;bottom:15px;left:20px;width:50px;height:35px;background:linear-gradient(180deg,#f4c430,#daa520);border:3px solid #b8860b;border-radius:3px;"></div>
                    <div style="position:absolute;bottom:35px;left:25px;width:40px;height:30px;background:linear-gradient(180deg,#f4c430,#daa520);border:3px solid #b8860b;border-radius:3px 10px 3px 3px;"></div>
                    <div style="position:absolute;bottom:18px;left:5px;width:6px;height:45px;background:#666;"></div>
                    <div style="position:absolute;bottom:3px;left:15px;width:18px;height:18px;background:#333;border-radius:50%;"></div>
                    <div style="position:absolute;bottom:3px;left:55px;width:18px;height:18px;background:#333;border-radius:50%;"></div>
                </div>
                <div class="zone-label">Enter Forklift →</div>
            </div>
        `;
    } else {
        html += `
            <div class="vehicle-zone" style="left: ${v.x}px;" data-vehicle="car">
                <div class="parked-car">
                    <div style="position:absolute;bottom:15px;left:10px;width:100px;height:25px;background:linear-gradient(180deg,#3E0097,#2a0066);border-radius:8px 15px 3px 3px;border:2px solid #1a0044;"></div>
                    <div style="position:absolute;bottom:38px;left:30px;width:55px;height:22px;background:linear-gradient(180deg,#3E0097,#2a0066);border-radius:12px 12px 0 0;border:2px solid #1a0044;"></div>
                    <div style="position:absolute;bottom:5px;left:18px;width:20px;height:20px;background:#333;border-radius:50%;"></div>
                    <div style="position:absolute;bottom:5px;left:80px;width:20px;height:20px;background:#333;border-radius:50%;"></div>
                </div>
                <div class="zone-label">Enter Car →</div>
            </div>
        `;
    }
});

html += `</div>`;
return html;
}

function generateLevelContent(levelIndex) {
let html = '';

switch(levelIndex) {
    case 0: // Intro - Barcelona
        // Main warehouse with modern design
        html += `
            <div class="warehouse" style="left: 150px;">
                <div class="warehouse-structure" style="width: 320px; height: 220px; background: linear-gradient(180deg, #6a7a8a 0%, #4a5a6a 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div class="warehouse-roof"></div>
                    <div class="warehouse-sign" style="font-size: 16px; padding: 10px 24px;">BARCELONA HQ</div>
                    <div class="loading-dock" style="left: 30px;">
                        <div class="dock-door open"></div>
                        <div class="dock-platform"></div>
                    </div>
                    <div class="loading-dock" style="left: 120px;">
                        <div class="dock-door"></div>
                        <div class="dock-platform"></div>
                    </div>
                    <div class="loading-dock" style="left: 220px;">
                        <div class="dock-door open"></div>
                        <div class="dock-platform"></div>
                    </div>
                </div>
            </div>
        `;
        // Pallet stacks on ground (adjusted positions)
        html += generatePalletStack(520, 3);
        html += generatePalletStack(620, 2);
        html += generatePalletStack(720, 4);
        // Animated workers
        html += generateAnimatedWorker(550, 0);
        html += generateAnimatedWorker(800, 2);
        // Working forklift
        html += generateWorkingForklift(920, 1);
        break;

    case 1: // Americold - Cold Storage
        // Cold storage building with improved design
        html += `
            <div class="cold-storage" style="left: 100px; width: 300px; height: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div class="frost-overlay"></div>
                <div class="cold-unit-label" style="font-size: 18px;">AMERICOLD</div>
                <div class="temp-display">-25°C</div>
                ${generateIcicles(13)}
                <div class="loading-dock" style="left: 40px; bottom: 0;">
                    <div class="dock-door open"></div>
                    <div class="dock-platform"></div>
                </div>
                <div class="loading-dock" style="left: 150px; bottom: 0;">
                    <div class="dock-door open"></div>
                    <div class="dock-platform"></div>
                </div>
            </div>
            <div class="cold-storage" style="left: 480px; width: 240px; height: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div class="frost-overlay"></div>
                <div class="temp-display">-18°C</div>
                ${generateIcicles(10)}
                <div class="loading-dock" style="left: 80px; bottom: 0;">
                    <div class="dock-door"></div>
                    <div class="dock-platform"></div>
                </div>
            </div>
            <div class="cold-storage" style="left: 800px; width: 260px; height: 190px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div class="frost-overlay"></div>
                <div class="cold-unit-label">EUROPE</div>
                <div class="temp-display">-22°C</div>
                ${generateIcicles(11)}
            </div>
        `;
        // Workers
        html += generateAnimatedWorker(420, 1);
        html += generateAnimatedWorker(750, 3);
        break;

    case 2: // ID Logistics
        // Main warehouse with improved design
        html += `
            <div class="warehouse" style="left: 120px;">
                <div class="warehouse-structure" style="width: 360px; height: 230px; background: linear-gradient(180deg, #6a7a8a 0%, #4a5a6a 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div class="warehouse-roof"></div>
                    <div class="warehouse-sign" style="font-size: 16px; padding: 10px 24px;">ID LOGISTICS</div>
                    <div class="loading-dock" style="left: 40px;">
                        <div class="dock-door open"></div>
                        <div class="dock-platform"></div>
                    </div>
                    <div class="loading-dock" style="left: 150px;">
                        <div class="dock-door open"></div>
                        <div class="dock-platform"></div>
                    </div>
                    <div class="loading-dock" style="left: 260px;">
                        <div class="dock-door"></div>
                        <div class="dock-platform"></div>
                    </div>
                </div>
            </div>
        `;
        // Factory section with modern design
        html += `
            <div class="factory" style="left: 560px;">
                <div class="factory-building" style="width: 220px; height: 200px; background: linear-gradient(180deg, #5a6a7a 0%, #3a4a5a 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div class="chimney" style="left: 45px; top: -50px; width: 32px; height: 50px;">
                        <div class="chimney-top"></div>
                        <div class="smoke" style="top: -20px; left: 5px;"></div>
                        <div class="smoke" style="top: -20px; left: 16px; animation-delay: 1.5s;"></div>
                    </div>
                    <div class="warehouse-sign" style="top: 30px; font-size: 14px;">TARRAGONA</div>
                    <div class="factory-door" style="left: 80px; width: 60px; height: 85px;"></div>
                    ${generateIndustrialWindows(4, 2, 20, 100)}
                </div>
            </div>
        `;
        // Pallet stacks
        html += generatePalletStack(840, 3);
        html += generatePalletStack(930, 2);
        // Workers
        html += generateAnimatedWorker(520, 0);
        html += generateAnimatedWorker(810, 2);
        break;

    case 3: // Forvia - Automotive
        // Large factory with modern design
        html += `
            <div class="factory" style="left: 100px;">
                <div class="factory-building" style="width: 340px; height: 250px; background: linear-gradient(180deg, #5a6a7a 0%, #3a4a5a 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div class="chimney" style="left: 55px; top: -60px; width: 36px; height: 60px;">
                        <div class="chimney-top"></div>
                        <div class="smoke" style="top: -25px; left: 5px;"></div>
                        <div class="smoke" style="top: -25px; left: 18px; animation-delay: 2s;"></div>
                    </div>
                    <div class="chimney" style="left: 230px; top: -60px; width: 36px; height: 60px;">
                        <div class="chimney-top"></div>
                        <div class="smoke" style="top: -25px; left: 8px; animation-delay: 1s;"></div>
                    </div>
                    <div class="warehouse-sign" style="top: 25px; font-size: 20px; padding: 10px 28px;">FORVIA</div>
                    <div style="position: absolute; top: 58px; left: 50%; transform: translateX(-50%); color: #ddd; font-size: 12px;">(FAURECIA)</div>
                    <div class="factory-door" style="left: 135px; width: 72px; height: 92px;"></div>
                    ${generateIndustrialWindows(5, 3, 25, 95)}
                </div>
            </div>
        `;
        // Second factory
        html += `
            <div class="factory" style="left: 520px;">
                <div class="factory-building" style="width: 240px; height: 200px; background: linear-gradient(180deg, #5a6a7a 0%, #3a4a5a 100%); box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div class="chimney" style="left: 100px; top: -50px; width: 32px; height: 50px;">
                        <div class="chimney-top"></div>
                        <div class="smoke" style="top: -20px; left: 5px;"></div>
                    </div>
                    <div class="warehouse-sign" style="top: 28px; font-size: 16px;">29 PLANTS</div>
                    ${generateIndustrialWindows(4, 2, 25, 85)}
                </div>
            </div>
        `;
        // Truck
        html += `
            <div class="parked-truck" style="left: 840px;">
                <div class="truck-trailer"></div>
                <div class="truck-cab">
                    <div class="truck-window"></div>
                </div>
                <div class="truck-wheel" style="left: 15px;"></div>
                <div class="truck-wheel" style="left: 80px;"></div>
                <div class="truck-wheel" style="left: 130px;"></div>
            </div>
        `;
        // Workers
        html += generateAnimatedWorker(470, 1);
        html += generateAnimatedWorker(800, 0);
        break;

    case 4: // Education
        // UTBM University
        html += `
            <div class="university" style="left: 200px;">
                <div class="university-building" style="width: 260px; height: 190px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div class="university-pediment"></div>
                    <div class="university-name" style="font-size: 20px;">UTBM</div>
                    <div class="university-date">2016 - 2020</div>
                    <div class="university-column" style="left: 32px; height: 105px; bottom: 0;"></div>
                    <div class="university-column" style="left: 75px; height: 105px; bottom: 0;"></div>
                    <div class="university-column" style="left: 165px; height: 105px; bottom: 0;"></div>
                    <div class="university-column" style="left: 208px; height: 105px; bottom: 0;"></div>
                    <div class="university-door"></div>
                </div>
            </div>
        `;
        // IUT Nice
        html += `
            <div class="university" style="left: 580px;">
                <div class="university-building" style="width: 210px; height: 160px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div class="university-pediment"></div>
                    <div class="university-name">IUT Nice</div>
                    <div class="university-date">2013 - 2015</div>
                    <div class="university-column" style="left: 27px; height: 85px; bottom: 0;"></div>
                    <div class="university-column" style="left: 68px; height: 85px; bottom: 0;"></div>
                    <div class="university-column" style="left: 122px; height: 85px; bottom: 0;"></div>
                    <div class="university-column" style="left: 163px; height: 85px; bottom: 0;"></div>
                    <div class="university-door"></div>
                </div>
            </div>
        `;
        break;

    case 5: // Hobbies
        // Running track
        html += `
            <div style="position: absolute; bottom: 100px; left: 150px; width: 180px; height: 12px; background: #c85a54; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        `;
        // Animated runner
        html += `
            <div style="position: absolute; bottom: 120px; left: 180px; animation: runAnimation 6s linear infinite;">
                <div style="position: absolute; width: 20px; height: 35px; background: #3E0097; border-radius: 5px;"></div>
                <div style="position: absolute; width: 14px; height: 14px; background: #ffd5b5; border-radius: 50%; left: 3px; top: -16px;"></div>
            </div>
        `;
        // Books stack
        html += `
            <div style="position: absolute; bottom: 100px; left: 400px;">
                <div style="width: 60px; height: 15px; background: linear-gradient(180deg, #8B4513 0%, #654321 100%); border: 2px solid #3E0097; margin-bottom: 5px;"></div>
                <div style="width: 55px; height: 15px; background: linear-gradient(180deg, #006400 0%, #004d00 100%); border: 2px solid #3E0097; margin-bottom: 5px;"></div>
                <div style="width: 58px; height: 15px; background: linear-gradient(180deg, #8B0000 0%, #660000 100%); border: 2px solid #3E0097;"></div>
            </div>
        `;
        // Computer/Coding setup
        html += `
            <div style="position: absolute; bottom: 100px; left: 550px;">
                <div style="width: 80px; height: 60px; background: linear-gradient(180deg, #1a1a2e 0%, #0a0a1e 100%); border: 3px solid #3E0097; border-radius: 5px;">
                    <div style="position: absolute; top: 8px; left: 8px; width: 60px; height: 40px; background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%); opacity: 0.8; font-family: monospace; font-size: 6px; padding: 2px; color: #000; overflow: hidden;">CODE<br/>BUILD<br/>DEPLOY</div>
                </div>
                <div style="width: 90px; height: 5px; background: #666; margin-top: 2px;"></div>
            </div>
        `;
        // Cooking pot
        html += `
            <div style="position: absolute; bottom: 105px; left: 720px;">
                <div style="width: 50px; height: 35px; background: linear-gradient(180deg, #888 0%, #666 100%); border-radius: 5px 5px 25px 25px; border: 3px solid #444; position: relative;">
                    <div style="position: absolute; top: -8px; left: -8px; width: 15px; height: 8px; background: #666; border-radius: 4px;"></div>
                    <div style="position: absolute; top: -8px; right: -8px; width: 15px; height: 8px; background: #666; border-radius: 4px;"></div>
                    <div style="position: absolute; top: -15px; left: 20%; width: 8px; height: 12px; background: rgba(255,255,255,0.6); border-radius: 50%; animation: steam 2s ease-in-out infinite;"></div>
                </div>
            </div>
        `;
        // Padel racket
        html += `
            <div style="position: absolute; bottom: 110px; left: 860px; transform: rotate(-30deg);">
                <div style="width: 45px; height: 60px; background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%); border-radius: 25px 25px 5px 5px; border: 3px solid #3E0097;"></div>
                <div style="width: 8px; height: 30px; background: linear-gradient(180deg, #8B4513 0%, #654321 100%); margin-left: 18px; border-radius: 4px;"></div>
            </div>
        `;
        break;

    case 6: // Finale
        // Celebration building - simplified without overlapping text
        html += `
            <div class="warehouse" style="left: 250px;">
                <div class="warehouse-structure" style="width: 400px; height: 240px; background: linear-gradient(180deg, #3E0097 0%, #2a0066 100%); border-color: #FFD700; box-shadow: 0 15px 40px rgba(255,215,0,0.4);">
                    <div style="position: absolute; top: 60px; left: 50%; transform: translateX(-50%); color: #FFD700; font-size: 42px; font-weight: bold; text-shadow: 0 0 20px rgba(255,215,0,0.6);">THANK YOU!</div>
                </div>
            </div>
        `;
        // Golden stars
        for (let i = 0; i < 40; i++) {
            html += `<div class="star" style="left: ${Math.random() * 180 + 10}vw; top: ${Math.random() * 50 + 10}%; width: 4px; height: 4px; background: #FFD700; animation-delay: ${Math.random() * 3}s;"></div>`;
        }
        break;
}

return html;
}

function generateInfoPanel(levelIndex) {
const panels = [
    `<div class="info-panel" style="left: 50px; bottom: 340px;">
        <h2>Roman Baron</h2>
        <p><span class="highlight">Global Supply Chain Transformation Leader</span></p>
        <p>📍 Barcelona, Spain</p>
        <p>📧 rbaronpro@gmail.com</p>
        <p>📱 +34 644 00 23 69</p>
        <h3>Navigate right to explore →</h3>
    </div>`,
    `<div class="info-panel" style="left: 50px; bottom: 320px;">
        <h2>Americold</h2>
        <p><span class="highlight">IT & Logistics Transformation Lead</span></p>
        <p>Apr 2025 - Present | Barcelona</p>
        <ul>
            <li>Multi-site transformations: <span class="highlight">27 European sites</span></li>
            <li>WMS solutions deployment</li>
            <li>End-to-end EDI flows</li>
            <li>Operational dashboards & KPIs</li>
        </ul>
    </div>`,
    `<div class="info-panel" style="left: 50px; bottom: 320px;">
        <h2>ID Logistics</h2>
        <p><span class="highlight">Engineering & Process Manager</span></p>
        <p>May 2023 - Apr 2025 | Tarragona</p>
        <ul>
            <li>Built multidisciplinary team</li>
            <li>Created planning department</li>
            <li>Bonded warehouse transition</li>
            <li><span class="highlight">€3M total savings</span></li>
        </ul>
    </div>`,
    `<div class="info-panel" style="left: 50px; bottom: 320px;">
        <h2>Forvia (Faurecia)</h2>
        <p><span class="highlight">Supply Chain & Systems Lead</span></p>
        <p>Jan 2021 - May 2023 | Prague/Valencia</p>
        <ul>
            <li><span class="highlight">29 European plants</span> transformed</li>
            <li><span class="highlight">€2M annual savings</span></li>
            <li>200+ EDI supplier integrations</li>
            <li>Industry 4.0 Champion</li>
        </ul>
    </div>`,
    `<div class="info-panel" style="left: 50px; bottom: 320px;">
        <h2>Education & Languages</h2>
        <h3>🎓 M.Sc. Industrial Systems</h3>
        <p>UTBM | 2016-2020</p>
        <h3>⚡ B.Sc. Electrical Engineering</h3>
        <p>IUT Nice | 2013-2015</p>
        <h3>🌍 Languages</h3>
        <p>French (Native) | English (C1) | Spanish (C1) | Mandarin (B1)</p>
    </div>`,
    `<div class="info-panel" style="left: 50px; bottom: 320px;">
        <h2>Life & Hobbies</h2>
        <h3>🏃 Sports & Fitness</h3>
        <p>Running, Hiking, Padel</p>
        <h3>📚 Reading & Learning</h3>
        <p>Continuous personal development</p>
        <h3>💻 Coding Projects</h3>
        <p>Building innovative solutions</p>
        <h3>👨‍🍳 Cooking</h3>
        <p>Exploring cuisines & recipes</p>
    </div>`,
    `<div class="info-panel" style="left: 700px; bottom: 320px;">
        <h2>Let's Connect!</h2>
        <p><span class="highlight">€7M+ Total Savings</span></p>
        <p><span class="highlight">60+ Sites Transformed</span></p>
        <p><span class="highlight">Railway, Automotive, Warehousing and Retail</span></p>
        <br>
        <p style="font-size: 16px;">📧 rbaronpro@gmail.com</p>
        <p style="font-size: 16px;">📱 +34 644 00 23 69</p>
        <p style="font-size: 16px;">💼 LinkedIn: roman-baron-7912b2a9</p>
        <p style="font-size: 16px;">💻 GitHub: Rom946</p>
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

function initGameWorld() {
const gameWorld = document.getElementById('gameWorld');
gameWorld.innerHTML = '';
gameWorld.style.width = (levels.length * 200) + 'vw';
levels.forEach((_, i) => gameWorld.innerHTML += generateLevelHTML(i));
updateCharacterDisplay();
}

function updateCharacterDisplay() {
const character = document.getElementById('character');
let html = '';

switch(gameState.vehicle) {
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
}

character.innerHTML = html;

const icons = { walk: '🚶', forklift: '🚜', car: '🚗' };
const names = { walk: 'On Foot', forklift: 'Forklift', car: 'Car' };
document.getElementById('vehicleIcon').textContent = icons[gameState.vehicle];
document.getElementById('vehicleName').textContent = names[gameState.vehicle];
}

// Physics
const GRAVITY = 0.6;
const JUMP_FORCE = 12;
const MOVE_SPEED = { walk: 5, forklift: 7, car: 10 };
const GROUND_Y = 100;

function getCharacterWidth() {
return { walk: 40, forklift: 100, car: 140 }[gameState.vehicle];
}

function getCharacterHeight() {
return { walk: 70, forklift: 80, car: 70 }[gameState.vehicle];
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

const maxX = (levels.length * 200 * window.innerWidth / 100) - window.innerWidth;
gameState.worldX = Math.max(0, Math.min(gameState.worldX, maxX));

// Gravity
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

    const levelOffset = badge.level * 200 * window.innerWidth / 100;
    const badgeX = levelOffset + badge.x;
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
    const levelOffset = zone.level * 200 * window.innerWidth / 100;
    const zoneX = levelOffset + zone.x;
    
    if (Math.abs(charX - zoneX) < 80 && gameState.vehicle !== zone.vehicle) {
        gameState.vehicle = zone.vehicle;
        updateCharacterDisplay();
        playSound('vehicle');
    }
});
}

function checkCurrentLevel() {
const levelWidth = 200 * window.innerWidth / 100;
const newLevel = Math.floor((gameState.worldX + window.innerWidth * 0.15) / levelWidth);

if (newLevel !== gameState.currentLevel && newLevel >= 0 && newLevel < levels.length) {
    gameState.currentLevel = newLevel;
    document.getElementById('levelName').textContent = levels[newLevel].name;
    document.getElementById('levelSubtitle').textContent = levels[newLevel].subtitle;
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
if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    jump();
}
});

document.addEventListener('keyup', (e) => {
if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = false;
if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = false;
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
// Game State
