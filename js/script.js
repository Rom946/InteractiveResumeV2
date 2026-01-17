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
    { name: "Introduction", subtitle: "Welcome! Let's explore my journey →", width: 100, bgClass: "level-0" },
    { name: "Americold", subtitle: "Supply Chain Systems Specialist", width: 100, bgClass: "level-1" },
    { name: "ID Logistics", subtitle: "Engineering & Process Manager", width: 100, bgClass: "level-2" },
    { name: "Forvia (Faurecia)", subtitle: "Supply Chain & Systems Lead", width: 100, bgClass: "level-3" },
    { name: "GSDI", subtitle: "Branch Manager Assistant", width: 100, bgClass: "level-gsdi" },
    { name: "Wuhan University", subtitle: "Deep Dive on Logistics", width: 100, bgClass: "level-wuhan" },
    { name: "Orange", subtitle: "Telecommunications Technician", width: 100, bgClass: "level-orange" },
    { name: "Education", subtitle: "Academic Journey", width: 100, bgClass: "level-4" },
    { name: "Hobbies", subtitle: "Passions & Interests", width: 100, bgClass: "level-2" },
    { name: "Contact & Finale", subtitle: "Let's Connect!", width: 100, bgClass: "level-5" }
];

// Badges - positioned at reachable heights
const badges = [
    { level: 0, x: 250, y: 140, icon: "📊", label: "Power BI" },
    { level: 0, x: 450, y: 140, icon: "🐍", label: "Python" },
    { level: 1, x: 200, y: 140, icon: "📦", label: "WMS" },
    { level: 1, x: 400, y: 140, icon: "❄️", label: "Cold Chain" },
    { level: 2, x: 200, y: 140, icon: "📈", label: "Analytics" },
    { level: 2, x: 400, y: 140, icon: "💰", label: "Savings" },
    { level: 3, x: 200, y: 140, icon: "🏭", label: "29 Plants" },
    { level: 3, x: 400, y: 140, icon: "🔧", label: "SAP" },
    { level: 4, x: 200, y: 140, icon: "🇿🇦", label: "S. Africa" },
    { level: 4, x: 400, y: 140, icon: "🚂", label: "Railway" },
    { level: 5, x: 200, y: 140, icon: "🇨🇳", label: "China" },
    { level: 5, x: 400, y: 140, icon: "🚚", label: "Logistics" },
    { level: 6, x: 200, y: 140, icon: "🔌", label: "Telecom" },
    { level: 6, x: 400, y: 140, icon: "🛠️", label: "Tech" },
    { level: 7, x: 200, y: 140, icon: "🎓", label: "M.Sc." },
    { level: 7, x: 400, y: 140, icon: "⚡", label: "B.Sc." },
    { level: 8, x: 200, y: 140, icon: "🏃", label: "Sports" },
    { level: 8, x: 400, y: 140, icon: "✈️", label: "Travel" },
    { level: 9, x: 200, y: 140, icon: "🏆", label: "Leader" }
];

// Vehicle zones
const vehicleZones = [
    { level: 1, x: 150, vehicle: 'snowmobile' }, // Americold (L1)
    { level: 2, x: 150, vehicle: 'forklift' },   // ID Logistics (L2)
    { level: 3, x: 150, vehicle: 'car' },        // Forvia (L3)
    { level: 4, x: 150, vehicle: 'train' },      // GSDI (L4)
    { level: 5, x: 150, vehicle: 'tuktuk' },     // Wuhan (L5)
    { level: 6, x: 150, vehicle: 'service' },    // Orange (L6)
    { level: 7, x: 200, vehicle: 'plane' }       // Education (L7 onwards)
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
        } else if (v.vehicle === 'snowmobile') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="snowmobile">
                            <div class="parked-snowmobile" style="position: relative; width: 100%; height: 100%;">
                                <!-- Body -->
                                <div style="position:absolute;bottom:20px;left:10px;width:100px;height:35px;background:linear-gradient(180deg,#FFD700,#FFA500);border-radius:8px 25px 5px 5px;border:2px solid #CC8800;"></div>
                                <!-- Windshield -->
                                <div style="position:absolute;bottom:48px;left:25px;width:50px;height:25px;background:linear-gradient(180deg,rgba(135,206,250,0.4),rgba(100,150,200,0.3));border-radius:10px 10px 0 0;border:2px solid #CC8800;"></div>
                                <!-- Seat -->
                                <div style="position:absolute;bottom:42px;left:55px;width:30px;height:15px;background:#333;border-radius:5px;"></div>
                                <!-- Front ski -->
                                <div style="position:absolute;bottom:5px;left:5px;width:45px;height:8px;background:#222;border-radius:50% 20% 0 0;transform:skewX(-10deg);"></div>
                                <!-- Rear track -->
                                <div style="position:absolute;bottom:5px;left:65px;width:45px;height:18px;background:#111;border-radius:3px;"></div>
                                <div style="position:absolute;bottom:8px;left:68px;width:39px;height:12px;background:repeating-linear-gradient(90deg,#333 0px,#333 3px,#111 3px,#111 6px);"></div>
                            </div>
                        </div>
                    `;
        } else if (v.vehicle === 'train') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="train">
                            <div class="parked-train" style="position: relative; width: 100%; height: 100%;">
                                <div style="position:absolute;bottom:25px;left:10px;width:120px;height:40px;background:linear-gradient(180deg,#8B4513,#654321);border-radius:5px;border:2px solid #3E2723;"></div>
                                <div style="position:absolute;bottom:55px;left:20px;width:30px;height:30px;background:#654321;border-radius:3px;"></div>
                                <div style="position:absolute;bottom:5px;left:20px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                                <div style="position:absolute;bottom:5px;left:50px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                                <div style="position:absolute;bottom:5px;left:80px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                                <div style="position:absolute;bottom:5px;left:110px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                            </div>
                        </div>
                    `;
        } else if (v.vehicle === 'tuktuk') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="tuktuk">
                            <div class="parked-tuktuk" style="position: relative; width: 100%; height: 100%;">
                                <!-- Front motorcycle section -->
                                <div style="position:absolute;bottom:15px;left:10px;width:35px;height:30px;background:linear-gradient(180deg,#FFD700,#FFA500);border-radius:5px;border:2px solid #CC8800;"></div>
                                <!-- Handlebars -->
                                <div style="position:absolute;bottom:40px;left:15px;width:25px;height:8px;background:#333;border-radius:2px;"></div>
                                <!-- Front wheel -->
                                <div style="position:absolute;bottom:5px;left:18px;width:18px;height:18px;background:#333;border-radius:50%;"></div>
                                <!-- Driver on front -->
                                <div style="position:absolute;bottom:38px;left:22px;width:12px;height:12px;background:#ffccaa;border-radius:50%;"></div>
                                <div style="position:absolute;bottom:25px;left:20px;width:16px;height:15px;background:#3E0097;border-radius:2px;"></div>
                                <!-- Passenger cabin (back) -->
                                <div style="position:absolute;bottom:15px;left:50px;width:50px;height:35px;background:linear-gradient(180deg,#FFD700,#FFA500);border-radius:5px 5px 3px 3px;border:2px solid #CC8800;"></div>
                                <div style="position:absolute;bottom:45px;left:55px;width:40px;height:25px;background:#FFD700;border-radius:15px 15px 0 0;border:2px solid #CC8800;"></div>
                                <!-- Rear wheels -->
                                <div style="position:absolute;bottom:5px;left:58px;width:16px;height:16px;background:#333;border-radius:50%;"></div>
                                <div style="position:absolute;bottom:5px;left:82px;width:16px;height:16px;background:#333;border-radius:50%;"></div>
                            </div>
                        </div>
                    `;
        } else if (v.vehicle === 'service') {
            html += `
                        <div class="vehicle-zone" id="zone-${levelIndex}-${v.x}" style="left: ${v.x}px;" data-vehicle="service">
                            <div class="parked-service" style="position: relative; width: 100%; height: 100%;">
                                <div style="position:absolute;bottom:15px;left:10px;width:100px;height:40px;background:linear-gradient(180deg,#FF6600,#E05500);border-radius:5px 5px 3px 3px;border:2px solid #CC4400;"></div>
                                <div style="position:absolute;bottom:50px;left:20px;width:70px;height:25px;background:#FF6600;border-radius:5px 5px 0 0;border:2px solid #CC4400;"></div>
                                <div style="position:absolute;bottom:70px;left:50px;width:12px;height:12px;background:#FF0000;border-radius:50%;animation:blink 1s infinite;"></div>
                                <div style="position:absolute;bottom:5px;left:18px;width:22px;height:22px;background:#333;border-radius:50%;"></div>
                                <div style="position:absolute;bottom:5px;left:80px;width:22px;height:22px;background:#333;border-radius:50%;"></div>
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
        case 0: // Introduction - Welcome warehouse
            html += `
                        <div class="warehouse" style="left: 120px;">
                            <div class="warehouse-structure" style="width: 240px; height: 210px; background: linear-gradient(180deg, #6a7a8a 0%, #4a5a6a 100%); box-shadow: 0 12px 35px rgba(0,0,0,0.4); border: 4px solid #3a4a5a;">
                                <div class="warehouse-roof"></div>
                                <div class="warehouse-sign" style="font-size: 16px; padding: 10px 24px; background: linear-gradient(180deg, #3E0097 0%, #2a0066 100%); border: 3px solid #FFD700; box-shadow: 0 4px 12px rgba(255,215,0,0.3);">SUPPLY CHAIN HQ</div>
                                <!-- Window grid with modern lighting -->
                                <div style="position: absolute; top: 70px; left: 20px; display: grid; grid-template-columns: repeat(3, 55px); grid-gap: 15px;">
                                    <div style="width: 55px; height: 45px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 55px; height: 45px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 55px; height: 45px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #3a4a5a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 55px; height: 45px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 55px; height: 45px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #3a4a5a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 55px; height: 45px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
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
                        <div class="cold-storage" style="left: 80px; width: 250px; height: 200px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 4px solid #88a8c8;">
                            <div class="frost-overlay"></div>
                            <div class="cold-unit-label" style="font-size: 18px; color: #1a4a6a; font-weight: bold;">AMERICOLD</div>
                            <div class="temp-display" style="font-size: 16px;">-25°C</div>
                            ${generateIcicles(10)}
                            <div class="loading-dock" style="left: 35px; bottom: 0;">
                                <div class="dock-door open"></div>
                                <div class="dock-platform"></div>
                            </div>
                            <div class="loading-dock" style="left: 130px; bottom: 0;">
                                <div class="dock-door open"></div>
                                <div class="dock-platform"></div>
                            </div>
                        </div>
                        <div class="cold-storage" style="left: 370px; width: 200px; height: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); border: 4px solid #88a8c8;">
                            <div class="frost-overlay"></div>
                            <div class="cold-unit-label" style="font-size: 16px; color: #1a4a6a; font-weight: bold;">EUROPE</div>
                            <div class="temp-display" style="font-size: 14px;">-18°C</div>
                            ${generateIcicles(8)}
                            <div class="loading-dock" style="left: 65px; bottom: 0;">
                                <div class="dock-door open"></div>
                                <div class="dock-platform"></div>
                            </div>
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
                        <div class="warehouse" style="left: 80px;">
                            <div class="warehouse-structure" style="width: 230px; height: 220px; background: linear-gradient(180deg, #6a7a8a 0%, #4a5a6a 100%); box-shadow: 0 12px 35px rgba(0,0,0,0.4); border: 4px solid #3a4a5a;">
                                <div class="warehouse-roof"></div>
                                <div class="warehouse-sign" style="font-size: 16px; padding: 10px 22px;">ID LOGISTICS</div>
                                <!-- Window grid with improved lighting -->
                                <div style="position: absolute; top: 70px; left: 15px; display: grid; grid-template-columns: repeat(4, 45px); grid-gap: 12px;">
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #3a4a5a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #3a4a5a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #3a4a5a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 45px; height: 40px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #3a4a5a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                </div>
                            </div>
                        </div>
                        <div class="factory" style="left: 350px;">
                            <div class="factory-building" style="width: 170px; height: 180px; background: linear-gradient(180deg, #5a6a7a 0%, #3a4a5a 100%); box-shadow: 0 12px 35px rgba(0,0,0,0.4); border: 4px solid #2a3a4a;">
                                <div class="chimney" style="left: 30px; top: -55px; width: 35px; height: 55px;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -22px; left: 6px;"></div>
                                    <div class="smoke" style="top: -22px; left: 18px; animation-delay: 1.5s;"></div>
                                </div>
                                <div class="warehouse-sign" style="top: 25px; font-size: 14px; padding: 8px 18px;">TARRAGONA</div>
                                <!-- Modern industrial windows -->
                                <div style="position: absolute; top: 80px; left: 18px; display: grid; grid-template-columns: repeat(3, 42px); grid-gap: 10px;">
                                    <div style="width: 42px; height: 35px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 42px; height: 35px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #2a3a4a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 42px; height: 35px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 42px; height: 35px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 42px; height: 35px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 12px rgba(255,215,0,0.4), inset 0 0 8px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 42px; height: 35px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #2a3a4a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                </div>
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
            // Factory 1 - Large main factory
            html += `
                        <div class="factory" style="left: 80px;">
                            <div class="factory-building" style="width: 240px; height: 210px; background: linear-gradient(180deg, #5a6a7a 0%, #3a4a5a 100%); box-shadow: 0 15px 40px rgba(0,0,0,0.5); border: 4px solid #2a3a4a;">
                                <div class="chimney" style="left: 45px; top: -60px; width: 38px; height: 60px; background: linear-gradient(90deg, #666 0%, #888 30%, #777 70%, #666 100%); border: 3px solid #444;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -25px; left: 7px;"></div>
                                    <div class="smoke" style="top: -25px; left: 20px; animation-delay: 2s;"></div>
                                </div>
                                <div class="chimney" style="left: 165px; top: -60px; width: 38px; height: 60px; background: linear-gradient(90deg, #666 0%, #888 30%, #777 70%, #666 100%); border: 3px solid #444;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -25px; left: 10px; animation-delay: 1s;"></div>
                                </div>
                                <div class="warehouse-sign" style="top: 25px; font-size: 18px; padding: 10px 26px; background: linear-gradient(180deg, #3E0097 0%, #2a0066 100%); border: 3px solid #FFD700; box-shadow: 0 4px 12px rgba(255,215,0,0.3);">FORVIA</div>
                                <div style="position: absolute; top: 55px; left: 50%; transform: translateX(-50%); color: #ddd; font-size: 11px; background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 3px;">(FAURECIA)</div>
                                <!-- Improved industrial windows -->
                                <div style="position: absolute; top: 95px; left: 15px; display: grid; grid-template-columns: repeat(3, 65px); grid-gap: 12px;">
                                    <div style="width: 65px; height: 42px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 65px; height: 42px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 65px; height: 42px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #2a3a4a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 65px; height: 42px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 65px; height: 42px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #2a3a4a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 65px; height: 42px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                </div>
                            </div>
                        </div>
                    `;
            // Factory 2 - Secondary plant
            html += `
                        <div class="factory" style="left: 370px;">
                            <div class="factory-building" style="width: 180px; height: 170px; background: linear-gradient(180deg, #5a6a7a 0%, #3a4a5a 100%); box-shadow: 0 12px 35px rgba(0,0,0,0.4); border: 4px solid #2a3a4a;">
                                <div class="chimney" style="left: 75px; top: -48px; width: 32px; height: 48px; background: linear-gradient(90deg, #666 0%, #888 30%, #777 70%, #666 100%); border: 3px solid #444;">
                                    <div class="chimney-top"></div>
                                    <div class="smoke" style="top: -18px; left: 6px;"></div>
                                </div>
                                <div class="warehouse-sign" style="top: 25px; font-size: 14px; padding: 8px 20px;">29 PLANTS</div>
                                <!-- Modern factory windows -->
                                <div style="position: absolute; top: 75px; left: 15px; display: grid; grid-template-columns: repeat(2, 70px); grid-gap: 12px;">
                                    <div style="width: 70px; height: 38px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 70px; height: 38px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                    <div style="width: 70px; height: 38px; background: linear-gradient(180deg, #4a90c2 30%, #3a7ab2 100%); border: 3px solid #2a3a4a; box-shadow: inset 0 0 8px rgba(255,255,255,0.2);"></div>
                                    <div style="width: 70px; height: 38px; background: linear-gradient(180deg, #ffdd88 0%, #ffcc44 100%); border: 3px solid #2a3a4a; box-shadow: 0 0 15px rgba(255,215,0,0.4), inset 0 0 10px rgba(255,255,255,0.3);"></div>
                                </div>
                            </div>
                        </div>
                    `;
            // Truck
            html += `
                        <div class="parked-truck" id="forvia-truck" style="left: 450px;">
                            <div class="truck-trailer"></div>
                            <div class="truck-cab">
                                <div class="truck-window"></div>
                            </div>
                            <div class="truck-wheel" style="left: 10px;"></div>
                            <div class="truck-wheel" style="left: 40px;"></div>
                            <div class="truck-wheel" style="left: 100px;"></div>
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

        case 4: // GSDI - Railway (South Africa)
            // Train station (GSDI)
            html += `
                        <div style="position: absolute; left: 50px; bottom: 0;">
                            <div style="position: relative; width: 250px; height: 180px; background: linear-gradient(180deg, #8B4513 0%, #654321 100%); border-radius: 5px;">
                                <!-- Station roof -->
                                <div style="position: absolute; top: -20px; left: -10px; width: 270px; height: 25px; background: linear-gradient(180deg, #A0522D 0%, #8B4513 100%); clip-path: polygon(10% 100%, 0% 0%, 100% 0%, 90% 100%);"></div>
                                <div class="warehouse-sign" style="color: #FFD700;">GSDI STATION</div>
                                <!-- Platform canopy -->
                                <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40px; background: rgba(139,69,19,0.6); border-top: 3px solid #FFD700;"></div>
                                <!-- Windows -->
                                <div style="position: absolute; top: 50px; left: 15px; display: grid; grid-template-columns: repeat(3, 65px); grid-gap: 12px;">
                                    <div style="width: 65px; height: 45px; background: rgba(255,215,0,0.1); border: 2px solid #FFD700; box-shadow: inset 0 0 10px rgba(255,215,0,0.2);"></div>
                                    <div style="width: 65px; height: 45px; background: rgba(255,215,0,0.1); border: 2px solid #FFD700; box-shadow: inset 0 0 10px rgba(255,215,0,0.2);"></div>
                                    <div style="width: 65px; height: 45px; background: rgba(255,215,0,0.1); border: 2px solid #FFD700; box-shadow: inset 0 0 10px rgba(255,215,0,0.2);"></div>
                                </div>
                            </div>
                        </div>
                    `;
            // Railway tracks
            html += `
                        <div style="position: absolute; left: 350px; bottom: 20px; width: 400px; height: 8px;">
                            <div style="position: absolute; bottom: 0; width: 100%; height: 3px; background: #666;"></div>
                            <div style="position: absolute; bottom: 5px; width: 100%; height: 3px; background: #666;"></div>
                            ${Array.from({ length: 20 }, (_, i) => `<div style="position: absolute; left: ${i * 20}px; bottom: -2px; width: 12px; height: 12px; background: #444;"></div>`).join('')}
                        </div>
                    `;
            // South African flag
            html += `
                        <div class="flag-display" style="left: 600px;">
                            <div class="flag-pole"></div>
                            <div style="position: absolute; top: 5px; left: 2px; width: 50px; height: 30px; background: linear-gradient(to bottom, #E03C31 0%, #E03C31 16.67%, #FFFFFF 16.67%, #FFFFFF 33.33%, #007749 33.33%, #007749 50%, #FFB612 50%, #FFB612 66.67%, #FFFFFF 66.67%, #FFFFFF 83.33%, #001489 83.33%, #001489 100%);"></div>
                        </div>
                    `;
            break;

        case 5: // Wuhan - University/City
            // Research lab (Wuhan)
            html += `
                        <div style="position: absolute; left: 50px; bottom: 0;">
                            <div style="position: relative; width: 220px; height: 170px; background: linear-gradient(180deg, #f0f0f0 0%, #d0d0d0 100%); border-radius: 3px;">
                                <div class="university-pediment"></div>
                                <div class="university-name" style="font-size: 10px; color: #3E0097;">WUHAN UNIV. TECH.</div>
                                <div style="position: absolute; top: 35px; left: 50%; transform: translateX(-50%); color: #3E0097; font-size: 9px;">Research Lab</div>
                                <!-- Lab equipment silhouettes -->
                                <div style="position: absolute; bottom: 20px; left: 20px; width: 30px; height: 60px; background: rgba(62,0,151,0.2); border: 2px solid #3E0097; border-radius: 3px;"></div>
                                <div style="position: absolute; bottom: 20px; left: 60px; width: 25px; height: 50px; background: rgba(62,0,151,0.2); border: 2px solid #3E0097; border-radius: 3px;"></div>
                                <div style="position: absolute; bottom: 20px; left: 95px; width: 35px; height: 70px; background: rgba(62,0,151,0.2); border: 2px solid #3E0097; border-radius: 3px;"></div>
                                <!-- Windows -->
                                <div style="position: absolute; top: 60px; left: 140px; display: grid; grid-template-rows: repeat(2, 35px); grid-gap: 8px;">
                                    <div style="width: 60px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 60px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                </div>
                            </div>
                        </div>
                    `;
            // Chinese flag removed
            html += ``;
            // City buildings
            html += `
                        <div class="factory" style="left: 400px;">
                            <div class="factory-building" style="width: 120px; height: 140px; background: #555;">
                                ${generateIndustrialWindows(3, 3, 10, 50)}
                            </div>
                        </div>
                        <div class="factory" style="left: 550px;">
                            <div class="factory-building" style="width: 100px; height: 160px; background: #666;">
                                ${generateIndustrialWindows(2, 3, 10, 60)}
                            </div>
                        </div>
                    `;
            break;

        case 6: // Orange - Telecommunications
            // Telecom tower with worker
            html += `
                        <div style="position: absolute; left: 100px; bottom: 0;">
                            <div style="position: absolute; bottom: 0; left: 45px; width: 10px; height: 250px; background: linear-gradient(to top, #999 0%, #ccc 100%);"></div>
                            <div style="position: absolute; bottom: 200px; left: 35px; width: 30px; height: 3px; background: #666;"></div>
                            <div style="position: absolute; bottom: 170px; left: 30px; width: 40px; height: 3px; background: #666;"></div>
                            <div style="position: absolute; bottom: 140px; left: 25px; width: 50px; height: 3px; background: #666;"></div>
                            <div style="position: absolute; bottom: 250px; left: 42px; width: 16px; height: 20px; background: #E03C31; border-radius: 2px;"></div>
                            <!-- Worker on pole -->
                            <div style="position: absolute; bottom: 180px; left: 60px; width: 12px; height: 12px; background: #ffccaa; border-radius: 50%;"></div>
                            <div style="position: absolute; bottom: 165px; left: 58px; width: 16px; height: 20px; background: #FF6600; border-radius: 2px;"></div>
                        </div>
                    `;
            // Phone pole with worker
            html += `
                        <div style="position: absolute; left: 550px; bottom: 0;">
                            <div style="position: absolute; bottom: 0; left: 15px; width: 8px; height: 180px; background: #8B4513;"></div>
                            <div style="position: absolute; bottom: 150px; left: 5px; width: 28px; height: 4px; background: #666;"></div>
                            <!-- Landline phone -->
                            <div style="position: absolute; bottom: 145px; left: 0; width: 12px; height: 15px; background: #333; border-radius: 2px;"></div>
                            <!-- Worker on pole -->
                            <div style="position: absolute; bottom: 160px; left: 30px; width: 12px; height: 12px; background: #ffccaa; border-radius: 50%;"></div>
                            <div style="position: absolute; bottom: 145px; left: 28px; width: 16px; height: 20px; background: #FF6600; border-radius: 2px;"></div>
                        </div>
                    `;
            // Data center (Orange)
            html += `
                        <div style="position: absolute; left: 300px; bottom: 0;">
                            <div style="position: relative; width: 180px; height: 150px; background: linear-gradient(180deg, #FF6600 0%, #E05500 100%); border-radius: 3px;">
                                <div class="warehouse-sign" style="color: white; top: 15px;">ORANGE</div>
                                <div style="position: absolute; top: 40px; left: 50%; transform: translateX(-50%); color: white; font-size: 9px;">Data Center</div>
                                <!-- Server rack indicators -->
                                <div style="position: absolute; top: 60px; left: 10px; display: grid; grid-template-columns: repeat(3, 50px); grid-gap: 5px;">
                                    <div style="width: 50px; height: 70px; background: rgba(0,0,0,0.3); border: 2px solid white; display: flex; flex-direction: column; gap: 3px; padding: 3px;">
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                    </div>
                                    <div style="width: 50px; height: 70px; background: rgba(0,0,0,0.3); border: 2px solid white; display: flex; flex-direction: column; gap: 3px; padding: 3px;">
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                    </div>
                                    <div style="width: 50px; height: 70px; background: rgba(0,0,0,0.3); border: 2px solid white; display: flex; flex-direction: column; gap: 3px; padding: 3px;">
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                        <div style="width: 100%; height: 8px; background: rgba(0,255,0,0.3); border: 1px solid #0F0;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
            break;

        case 7: // Education
            // UTBM
            html += `
                        <div class="university" style="left: 50px;">
                            <div class="university-building" style="width: 200px; height: 160px;">
                                <div class="university-pediment"></div>
                                <div class="university-name">UTBM</div>
                                <div class="university-date">2016 - 2020</div>
                                <!-- Window grid -->
                                <div style="position: absolute; top: 60px; left: 15px; display: grid; grid-template-columns: repeat(3, 50px); grid-gap: 10px;">
                                    <div style="width: 50px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 50px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 50px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 50px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 50px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 50px; height: 35px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                </div>
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
                                <!-- Window grid -->
                                <div style="position: absolute; top: 55px; left: 10px; display: grid; grid-template-columns: repeat(2, 60px); grid-gap: 10px;">
                                    <div style="width: 60px; height: 30px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 60px; height: 30px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 60px; height: 30px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                    <div style="width: 60px; height: 30px; background: rgba(62,0,151,0.1); border: 2px solid #3E0097; box-shadow: inset 0 0 8px rgba(62,0,151,0.2);"></div>
                                </div>
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
                    `;
            break;

        case 8: // Hobbies
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

            // Travel animation - Rotating globe with orbiting plane
            html += `
                        <div style="position: absolute; left: 900px; bottom: 100px;">
                            <!-- Globe -->
                            <div style="position: relative; width: 60px; height: 60px;">
                                <div style="position: absolute; width: 60px; height: 60px; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 50%, #2E5C8A 100%); border-radius: 50%; box-shadow: inset -5px -5px 10px rgba(0,0,0,0.3), 0 0 15px rgba(74,144,226,0.4); animation: rotateGlobe 8s linear infinite;">
                                    <!-- Continents (simplified) -->
                                    <div style="position: absolute; top: 15px; left: 10px; width: 15px; height: 12px; background: #2ECC71; border-radius: 50% 30% 40% 20%; opacity: 0.8;"></div>
                                    <div style="position: absolute; top: 30px; left: 25px; width: 20px; height: 15px; background: #27AE60; border-radius: 40% 50% 30% 60%; opacity: 0.8;"></div>
                                    <div style="position: absolute; top: 10px; right: 8px; width: 12px; height: 10px; background: #229954; border-radius: 60% 40% 50% 30%; opacity: 0.8;"></div>
                                </div>
                                <!-- Orbiting plane -->
                                <div style="position: absolute; width: 100%; height: 100%; animation: orbitPlane 4s linear infinite;">
                                    <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); font-size: 16px;">✈️</div>
                                </div>
                            </div>
                        </div>
                        <div style="position: absolute; left: 880px; bottom: 200px; color: #3E0097; font-size: 14px; font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px; border: 2px solid #3E0097;">Travelling</div>
                    `;

            break;

        case 9: // Finale
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
                    <h2>Welcome! 👋</h2>
                    <p><span class="highlight">I'm Roman Baron</span></p>
                    <p>Global Supply Chain Transformation Leader</p>
                    <p>📧 rbaronpro@gmail.com | 📱 +34 644 00 23 69</p>
                    <br>
                    <h3>🎮 Use arrow keys to explore my journey →</h3>
                    <p>Collect badges and discover my career path!</p>
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
        `<div class="info-panel" style="left: 600px; bottom: 350px;">
                    <h2>GSDI</h2>
                    <p><span class="highlight">Branch Manager Assistant</span></p>
                    <p>Mar 2020 - Dec 2020 | Johannesburg, S. Africa</p>
                    <ul>
                        <li>Led digital transformation of SA branch (ERP).</li>
                        <li>Supported supply chain systems (Railway Industry).</li>
                        <li>Stack: React, Python, Django, AWS.</li>
                    </ul>
                </div>`,
        `<div class="info-panel" style="left: 300px; bottom: 350px;">
                    <h2>Wuhan University</h2>
                    <p><span class="highlight">Engineer Intern</span></p>
                    <p>Sep 2017 - Feb 2018 | Wuhan, China</p>
                    <ul>
                        <li>Deep dive on City Logistics & Freight Carriage.</li>
                        <li>CO2 emission improvement concept definition.</li>
                    </ul>
                </div>`,
        `<div class="info-panel" style="left: 600px; bottom: 350px;">
                    <h2>Orange</h2>
                    <p><span class="highlight">Telecommunications Technician</span></p>
                    <p>Aug 2013 - Aug 2015 | Saint Tropez, France</p>
                    <ul>
                        <li>Technical maintenance on ADSL/VDSL/Fiber.</li>
                        <li>Customer support for private & business clients.</li>
                    </ul>
                </div>`,
        `<div class="info-panel" style="left: 600px; bottom: 380px; width: 450px;">
                    <h2>Education</h2>
                    <p><strong>M.Sc. Ind. Systems</strong> | UTBM | 2016-2020</p>
                    <p><strong>M.Sc. Management</strong> | MATE (Hungary) | 2019-20</p>
                    <p><strong>Chinese Lang.</strong> | CCNU (China) | 2018-19</p>
                    <p><strong>Adv. High School</strong> | Lycée Jean Moulin | 2015-16</p>
                    <p><strong>B.Sc. Elec. Eng.</strong> | IUT Nice | 2013-15</p>
                    <p style="margin-top: 10px;"><strong>Languages:</strong> English, French, Spanish (Native), Chinese (Limited)</p>
                </div>`,
        `<div class="info-panel" style="left: 720px; bottom: 330px;">
                    <h2>Hobbies & Interests</h2>
                    <p>🏃 <strong>Sports:</strong> Running, Hiking, Padel</p>
                    <p>✈️ <strong>Travel:</strong> Exploring Cultures</p>
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
        case 'snowmobile':
            html = `
                        <div class="character-snowmobile ${gameState.isMoving ? 'driving' : ''}">
                            <!-- Body -->
                            <div style="position:absolute;bottom:20px;left:0;width:100px;height:35px;background:linear-gradient(180deg,#FFD700,#FFA500);border-radius:8px 25px 5px 5px;border:2px solid #CC8800;"></div>
                            <!-- Windshield -->
                            <div style="position:absolute;bottom:48px;left:15px;width:50px;height:25px;background:linear-gradient(180deg,rgba(135,206,250,0.4),rgba(100,150,200,0.3));border-radius:10px 10px 0 0;border:2px solid #CC8800;"></div>
                            <!-- Driver -->
                            <div style="position:absolute;bottom:35px;left:35px;width:15px;height:15px;background:#ffccaa;border-radius:50%;"></div>
                            <div style="position:absolute;bottom:22px;left:33px;width:18px;height:15px;background:#3E0097;border-radius:2px;"></div>
                            <!-- Front ski -->
                            <div style="position:absolute;bottom:5px;left:0;width:45px;height:8px;background:#222;border-radius:50% 20% 0 0;transform:skewX(-10deg);"></div>
                            <!-- Rear track -->
                            <div style="position:absolute;bottom:5px;left:60px;width:45px;height:18px;background:#111;border-radius:3px;"></div>
                            <div style="position:absolute;bottom:8px;left:63px;width:39px;height:12px;background:repeating-linear-gradient(90deg,#333 0px,#333 3px,#111 3px,#111 6px);"></div>
                        </div>
                    `;
            break;
        case 'train':
            html = `
                        <div class="character-train ${gameState.isMoving ? 'driving' : ''}">
                            <div style="position:absolute;bottom:25px;left:0;width:120px;height:40px;background:linear-gradient(180deg,#8B4513,#654321);border-radius:5px;border:2px solid #3E2723;"></div>
                            <div style="position:absolute;bottom:55px;left:10px;width:30px;height:30px;background:#654321;border-radius:3px;"></div>
                            <div style="position:absolute;bottom:40px;left:50px;width:15px;height:15px;background:#ffccaa;border-radius:50%;"></div>
                            <div style="position:absolute;bottom:5px;left:10px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                            <div style="position:absolute;bottom:5px;left:40px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                            <div style="position:absolute;bottom:5px;left:70px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                            <div style="position:absolute;bottom:5px;left:100px;width:20px;height:20px;background:#333;border-radius:50%;border:3px solid #666;"></div>
                        </div>
                    `;
            break;
        case 'tuktuk':
            html = `
                        <div class="character-tuktuk ${gameState.isMoving ? 'driving' : ''}">
                            <!-- Front motorcycle section -->
                            <div style="position:absolute;bottom:15px;left:0;width:35px;height:30px;background:linear-gradient(180deg,#FFD700,#FFA500);border-radius:5px;border:2px solid #CC8800;"></div>
                            <!-- Handlebars -->
                            <div style="position:absolute;bottom:40px;left:5px;width:25px;height:8px;background:#333;border-radius:2px;"></div>
                            <!-- Front wheel -->
                            <div style="position:absolute;bottom:5px;left:8px;width:18px;height:18px;background:#333;border-radius:50%;"></div>
                            <!-- Driver on front -->
                            <div style="position:absolute;bottom:38px;left:12px;width:12px;height:12px;background:#ffccaa;border-radius:50%;"></div>
                            <div style="position:absolute;bottom:25px;left:10px;width:16px;height:15px;background:#3E0097;border-radius:2px;"></div>
                            <!-- Passenger cabin (back) -->
                            <div style="position:absolute;bottom:15px;left:40px;width:50px;height:35px;background:linear-gradient(180deg,#FFD700,#FFA500);border-radius:5px 5px 3px 3px;border:2px solid #CC8800;"></div>
                            <div style="position:absolute;bottom:45px;left:45px;width:40px;height:25px;background:#FFD700;border-radius:15px 15px 0 0;border:2px solid #CC8800;"></div>
                            <!-- Rear wheels -->
                            <div style="position:absolute;bottom:5px;left:48px;width:16px;height:16px;background:#333;border-radius:50%;"></div>
                            <div style="position:absolute;bottom:5px;left:72px;width:16px;height:16px;background:#333;border-radius:50%;"></div>
                        </div>
                    `;
            break;
        case 'service':
            html = `
                        <div class="character-service ${gameState.isMoving ? 'driving' : ''}">
                            <div style="position:absolute;bottom:15px;left:0;width:100px;height:40px;background:linear-gradient(180deg,#FF6600,#E05500);border-radius:5px 5px 3px 3px;border:2px solid #CC4400;"></div>
                            <div style="position:absolute;bottom:50px;left:10px;width:70px;height:25px;background:#FF6600;border-radius:5px 5px 0 0;border:2px solid #CC4400;"></div>
                            <div style="position:absolute;bottom:70px;left:40px;width:12px;height:12px;background:#FF0000;border-radius:50%;animation:blink 1s infinite;"></div>
                            <div style="position:absolute;bottom:40px;left:30px;width:15px;height:15px;background:#ffccaa;border-radius:50%;"></div>
                            <div style="position:absolute;bottom:5px;left:8px;width:22px;height:22px;background:#333;border-radius:50%;"></div>
                            <div style="position:absolute;bottom:5px;left:70px;width:22px;height:22px;background:#333;border-radius:50%;"></div>
                        </div>
                    `;
            break;
        case 'plane':
            html = `
                        <div class="character-plane" style="width: 120px; height: 60px;">
                            <div class="plane-body" style="position:absolute; bottom:0; width:100px; height:30px; background:#ccc; border-top-right-radius: 10px; border-bottom-right-radius: 5px;"></div>
                            <div class="plane-wing" style="position:absolute; bottom:15px; left:40px; width:40px; height:10px; background:#999; transform:skewX(-20deg);"></div>
                            <div class="plane-tail" style="position:absolute; bottom:20px; left:5px; width:20px; height:25px; background:#ccc; border-radius:5px 0 0 0;"></div>
                            
                            <div class="plane-pilot" style="position:absolute; bottom:15px; right:30px; width:15px; height:15px; background:#ffccaa; border-radius:50%;"></div>
                        </div>
                    `;
            break;
    }

    character.innerHTML = html;

    const icons = { walk: '🚶', snowmobile: '🛷', forklift: '🚜', car: '🚗', train: '🚂', tuktuk: '🛺', service: '🚚', plane: '✈️' };
    const names = { walk: 'On Foot', snowmobile: 'Snowmobile', forklift: 'Forklift', car: 'Car', train: 'Train', tuktuk: 'Tuktuk', service: 'Service Van', plane: 'Plane' };
    document.getElementById('vehicleIcon').textContent = icons[gameState.vehicle];
    document.getElementById('vehicleName').textContent = names[gameState.vehicle];
}

// Physics
const GRAVITY = 0.6;
const JUMP_FORCE = 12;
const MOVE_SPEED = { walk: 5, snowmobile: 8, forklift: 7, car: 10, train: 9, tuktuk: 8, service: 9, plane: 15 };
const GROUND_Y = 100;

function getCharacterWidth() {
    return { walk: 40, snowmobile: 100, forklift: 100, car: 140, train: 130, tuktuk: 110, service: 110, plane: 120 }[gameState.vehicle];
}

function getCharacterHeight() {
    return { walk: 70, snowmobile: 60, forklift: 80, car: 70, train: 90, tuktuk: 75, service: 80, plane: 80 }[gameState.vehicle];
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
    const maxX = (totalWidth * window.innerWidth / 100) - window.innerWidth / 2; // Allow scrolling past end
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

        // Trigger Forvia truck departure when entering level 3
        if (newLevel === 3) {
            const truck = document.getElementById('forvia-truck');
            if (truck && !truck.classList.contains('truck-departing')) {
                truck.classList.add('truck-departing');
            }
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

// Mouse & Touch Controls
// Wheel to move
window.addEventListener('wheel', (e) => {
    if (!gameState.started) return;
    if (e.deltaY > 0) {
        gameState.keys.right = true;
        gameState.keys.left = false;
    } else {
        gameState.keys.left = true;
        gameState.keys.right = false;
    }
    // Stop after a short delay to simulate "step"
    setTimeout(() => {
        gameState.keys.left = false;
        gameState.keys.right = false;
    }, 100);
});

// Click/Tap to move
const handleInputStart = (x) => {
    if (!gameState.started) return;
    const halfWidth = window.innerWidth / 2;
    if (x < halfWidth) {
        gameState.keys.left = true;
        gameState.keys.right = false;
    } else {
        gameState.keys.right = true;
        gameState.keys.left = false;
    }
};

const handleInputEnd = () => {
    gameState.keys.left = false;
    gameState.keys.right = false;
};

document.addEventListener('mousedown', (e) => handleInputStart(e.clientX));
document.addEventListener('mouseup', handleInputEnd);
document.addEventListener('touchstart', (e) => handleInputStart(e.touches[0].clientX));
document.addEventListener('touchend', handleInputEnd);

// Mobile Buttons (Keep existing but ensure they work)
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys.left = true; });
    btnLeft.addEventListener('touchend', () => gameState.keys.left = false);
}
if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.keys.right = true; });
    btnRight.addEventListener('touchend', () => gameState.keys.right = false);
}
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

