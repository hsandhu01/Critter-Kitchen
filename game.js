/* =============================================================
   CRITTER KITCHEN — Game Engine
   ============================================================= */

// ---- INGREDIENTS DATA ----
const INGREDIENTS = [
    { id: 'fire',    name: 'Fire Crystals',   emoji: '🔴', color: '#ff4a4a', glow: 'rgba(255,74,74,0.5)',   syllables: ['Blaze','Pyr','Ign','Flam'] },
    { id: 'moon',    name: 'Moon Dust',       emoji: '🟣', color: '#c4b5fd', glow: 'rgba(196,181,253,0.5)', syllables: ['Luna','Nyx','Cres','Lum'] },
    { id: 'star',    name: 'Star Nectar',     emoji: '🟡', color: '#ffd700', glow: 'rgba(255,215,0,0.5)',   syllables: ['Stella','Nova','Ast','Sol'] },
    { id: 'ocean',   name: 'Ocean Tears',     emoji: '🔵', color: '#4ac3ff', glow: 'rgba(74,195,255,0.5)',  syllables: ['Aqua','Tidal','Mar','Rip'] },
    { id: 'forest',  name: 'Forest Moss',     emoji: '🟢', color: '#4aff91', glow: 'rgba(74,255,145,0.5)',  syllables: ['Fern','Moss','Leaf','Sylv'] },
    { id: 'thunder', name: 'Thunder Sparks',  emoji: '⚡', color: '#ffe44a', glow: 'rgba(255,228,74,0.5)',  syllables: ['Volt','Zap','Bolt','Storm'] }
];

// ---- CREATURE BODY PARTS ----
const BODY_SHAPES = ['blob','round','tall','spiky','winged','squid'];
const EYE_STYLES = ['big','cat','multi','cyclops','sparkly','sleepy'];
const APPENDAGES = ['arms','legs','wings','tail','antennae','tentacles'];
const ACCESSORIES = ['none','crown','bow','glasses','scarf','horns'];
const RARITIES = ['Common','Uncommon','Rare','Legendary'];
const RARITY_COLORS = ['#aaa','#4ac3ff','#b44aff','#ffd700'];

// Legendary combos (sorted ingredient id strings)
const LEGENDARY_COMBOS = ['fire,moon,thunder','forest,ocean,star','fire,forest,ocean','moon,star,thunder'];
const RARE_COMBOS = ['fire,fire,star','moon,moon,ocean','forest,forest,thunder','fire,ocean,star','moon,forest,thunder'];

// ---- CREATURE DESCRIPTIONS ----
const DESC_TEMPLATES = [
    "Loves to dance in the moonlight and eat sparkle berries.",
    "This shy creature hides behind clouds when startled.",
    "Known for its melodious humming at dawn.",
    "Leaves a trail of glitter wherever it bounces.",
    "Can change color depending on its mood!",
    "Enjoys splashing in puddles of liquid starlight.",
    "Has been spotted juggling small comets for fun.",
    "Sleeps curled up inside a rainbow cocoon.",
    "Its laughter sounds like tiny wind chimes.",
    "Collects shiny pebbles from enchanted rivers."
];

// ---- STATE ----
let state = {
    recipe: [null, null, null],
    recipeCount: 0,
    mixing: false,
    revealing: false,
    bestiary: JSON.parse(localStorage.getItem('critterKitchen_bestiary') || '[]'),
    bestiaryOpen: false,
    particles: [],
    bubbles: [],
    steamParts: [],
    cauldronColor: { r: 10, g: 100, b: 110 },
    targetColor: { r: 10, g: 100, b: 110 },
    mixProgress: 0,
    time: 0
};

// ---- CANVAS SETUP ----
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H, cauldronX, cauldronY, cauldronW, cauldronH;

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = rect.width * devicePixelRatio;
    H = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cauldronW = Math.min(340, rect.width * 0.45);
    cauldronH = cauldronW * 0.65;
    cauldronX = rect.width / 2;
    cauldronY = rect.height * 0.55;
}
window.addEventListener('resize', resize);

// ---- AUDIO ENGINE ----
let audioCtx;
function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, dur, type='sine', vol=0.12) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function playSplash() { playTone(200 + Math.random()*200, 0.3, 'sine', 0.08); playTone(600, 0.1, 'triangle', 0.05); }
function playMixSound() { for(let i=0;i<5;i++) setTimeout(()=>playTone(300+i*100,0.2,'sawtooth',0.04),i*150); }
function playReveal(rarity) {
    const base = [300,400,500,600][rarity];
    [0,1,2,3,4].forEach((i)=> setTimeout(()=>playTone(base+i*80, 0.3, 'sine', 0.08), i*100));
}
function playCollect() { playTone(800,0.15,'sine',0.1); setTimeout(()=>playTone(1000,0.2,'sine',0.1),100); }

// ---- PARTICLE SYSTEM ----
function spawnBubble() {
    if (state.bubbles.length > 35) return;
    const spread = cauldronW * 0.35;
    state.bubbles.push({
        x: cauldronX + (Math.random()-0.5) * spread,
        y: cauldronY - cauldronH * 0.05,
        r: 2 + Math.random() * 6,
        vy: -0.3 - Math.random() * 0.8,
        vx: (Math.random()-0.5) * 0.3,
        life: 1,
        decay: 0.003 + Math.random() * 0.005,
        hue: Math.random() * 360
    });
}

function spawnSteam() {
    if (state.steamParts.length > 20) return;
    const spread = cauldronW * 0.3;
    state.steamParts.push({
        x: cauldronX + (Math.random()-0.5) * spread,
        y: cauldronY - cauldronH * 0.35,
        r: 8 + Math.random() * 15,
        vy: -0.5 - Math.random() * 0.5,
        vx: (Math.random()-0.5) * 0.4,
        life: 1,
        decay: 0.008 + Math.random() * 0.006
    });
}

function spawnSparkle(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            r: 1.5 + Math.random() * 3,
            life: 1,
            decay: 0.015 + Math.random() * 0.02,
            color: color || `hsl(${Math.random()*360},100%,70%)`
        });
    }
}

function updateParticles() {
    state.bubbles = state.bubbles.filter(b => {
        b.x += b.vx + Math.sin(state.time * 0.02 + b.x) * 0.15;
        b.y += b.vy;
        b.life -= b.decay;
        return b.life > 0;
    });
    state.steamParts = state.steamParts.filter(s => {
        s.x += s.vx; s.y += s.vy;
        s.r += 0.15; s.life -= s.decay;
        return s.life > 0;
    });
    state.particles = state.particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.04;
        p.life -= p.decay;
        return p.life > 0;
    });
}

// ---- DRAWING ----
function drawCauldron() {
    const rw = cauldronW / 2, rh = cauldronH / 2;
    const cx = cauldronX, cy = cauldronY;

    // Glow underneath
    const glowGrad = ctx.createRadialGradient(cx, cy + rh * 0.3, 0, cx, cy + rh * 0.3, rw * 1.5);
    const cc = state.cauldronColor;
    glowGrad.addColorStop(0, `rgba(${cc.r},${cc.g},${cc.b},0.25)`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(cx - rw * 2, cy - rh, rw * 4, rh * 3);

    // Cauldron body (dark pot shape)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + rh * 0.1, rw, rh, 0, 0, Math.PI);
    ctx.lineTo(cx - rw * 0.7, cy - rh * 0.6);
    ctx.quadraticCurveTo(cx - rw * 0.85, cy - rh * 0.8, cx - rw * 0.6, cy - rh * 0.85);
    ctx.lineTo(cx + rw * 0.6, cy - rh * 0.85);
    ctx.quadraticCurveTo(cx + rw * 0.85, cy - rh * 0.8, cx + rw * 0.7, cy - rh * 0.6);
    ctx.closePath();
    
    const bodyGrad = ctx.createLinearGradient(cx - rw, cy, cx + rw, cy);
    bodyGrad.addColorStop(0, '#0a1e25');
    bodyGrad.addColorStop(0.3, '#0f3040');
    bodyGrad.addColorStop(0.7, '#0f3040');
    bodyGrad.addColorStop(1, '#0a1e25');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0,229,204,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Rim
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - rh * 0.75, rw * 0.72, rh * 0.12, 0, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(cx - rw, cy - rh, cx + rw, cy - rh);
    rimGrad.addColorStop(0, '#0f2a35');
    rimGrad.addColorStop(0.5, '#1a4a5a');
    rimGrad.addColorStop(1, '#0f2a35');
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,204,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Liquid surface
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - rh * 0.65, rw * 0.62, rh * 0.09, 0, 0, Math.PI * 2);
    const liquidGrad = ctx.createRadialGradient(cx, cy - rh * 0.65, 0, cx, cy - rh * 0.65, rw * 0.6);
    liquidGrad.addColorStop(0, `rgba(${cc.r+40},${cc.g+40},${cc.b+40},0.9)`);
    liquidGrad.addColorStop(0.6, `rgba(${cc.r},${cc.g},${cc.b},0.7)`);
    liquidGrad.addColorStop(1, `rgba(${cc.r-20},${cc.g-20},${cc.b-20},0.5)`);
    ctx.fillStyle = liquidGrad;
    ctx.fill();

    // Liquid shimmer
    const shimX = cx + Math.sin(state.time * 0.03) * rw * 0.2;
    const shimGrad = ctx.createRadialGradient(shimX, cy - rh * 0.67, 0, shimX, cy - rh * 0.67, rw * 0.25);
    shimGrad.addColorStop(0, 'rgba(255,255,255,0.2)');
    shimGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shimGrad;
    ctx.fill();
    ctx.restore();

    // Legs
    for (let side of [-1, 0, 1]) {
        ctx.save();
        ctx.beginPath();
        const lx = cx + side * rw * 0.5;
        const ly = cy + rh * 0.08;
        ctx.moveTo(lx - 6, ly);
        ctx.lineTo(lx + side * 8 - 4, ly + rh * 0.4);
        ctx.lineTo(lx + side * 8 + 8, ly + rh * 0.4);
        ctx.lineTo(lx + 6, ly);
        ctx.fillStyle = '#0a1e25';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,229,204,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}

function drawBubbles() {
    state.bubbles.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.life * 0.6;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        const cc = state.cauldronColor;
        ctx.fillStyle = `rgba(255,255,255,${b.life * 0.3})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(200,255,250,${b.life * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Highlight
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.life * 0.5})`;
        ctx.fill();
        ctx.restore();
    });
}

function drawSteam() {
    state.steamParts.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.life * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = '#a0f0e8';
        ctx.fill();
        ctx.restore();
    });
}

function drawSparkles() {
    state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        // Star shape
        const spikes = 4;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? p.r : p.r * 0.4;
            const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = p.x + Math.cos(a) * r;
            const py = p.y + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    });
}

// ---- LERP CAULDRON COLOR ----
function lerpColor() {
    const s = state.cauldronColor, t = state.targetColor;
    s.r += (t.r - s.r) * 0.03;
    s.g += (t.g - s.g) * 0.03;
    s.b += (t.b - s.b) * 0.03;
}

// ---- MAIN RENDER LOOP ----
function render() {
    state.time++;
    const rw = W / devicePixelRatio, rh = H / devicePixelRatio;
    ctx.clearRect(0, 0, rw, rh);

    lerpColor();
    if (Math.random() < 0.3) spawnBubble();
    if (Math.random() < 0.08) spawnSteam();

    if (state.mixing) {
        state.mixProgress++;
        if (Math.random() < 0.5) spawnSparkle(
            cauldronX + (Math.random()-0.5) * cauldronW * 0.5,
            cauldronY - cauldronH * 0.4,
            1,
            `hsl(${state.mixProgress * 3},100%,70%)`
        );
    }

    updateParticles();
    drawSteam();
    drawCauldron();
    drawBubbles();
    drawSparkles();

    requestAnimationFrame(render);
}

// ---- CREATURE GENERATION ----
function hashIngredients(ids) {
    const sorted = [...ids].sort();
    let hash = 0;
    const str = sorted.join(',');
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function seededRandom(seed) {
    let s = seed;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function getRarity(ids) {
    const key = [...ids].sort().join(',');
    if (LEGENDARY_COMBOS.includes(key)) return 3;
    if (RARE_COMBOS.includes(key)) return 2;
    const hash = hashIngredients(ids);
    if (hash % 5 === 0) return 1;
    return 0;
}

function generateCreatureName(ids) {
    const hash = hashIngredients(ids);
    const rng = seededRandom(hash);
    const parts = ids.map(id => {
        const ing = INGREDIENTS.find(i => i.id === id);
        return ing.syllables[Math.floor(rng() * ing.syllables.length)];
    });
    // Take first syllable from first ingredient, second from second, sometimes third
    let name = parts[0] + parts[1].toLowerCase();
    if (rng() > 0.5 && parts[2]) name += parts[2].toLowerCase().slice(0, 2);
    return name;
}

function generateCreature(ids) {
    const hash = hashIngredients(ids);
    const rng = seededRandom(hash);
    const rarity = getRarity(ids);
    
    // Blend ingredient colors
    const colors = ids.map(id => INGREDIENTS.find(i => i.id === id).color);
    
    return {
        ids: [...ids],
        name: generateCreatureName(ids),
        rarity,
        bodyShape: BODY_SHAPES[Math.floor(rng() * BODY_SHAPES.length)],
        eyeStyle: EYE_STYLES[Math.floor(rng() * EYE_STYLES.length)],
        appendage: APPENDAGES[Math.floor(rng() * APPENDAGES.length)],
        accessory: rarity >= 2 ? ACCESSORIES[1 + Math.floor(rng() * (ACCESSORIES.length - 1))] : ACCESSORIES[Math.floor(rng() * ACCESSORIES.length)],
        primaryColor: colors[0],
        secondaryColor: colors[1],
        accentColor: colors[2] || colors[0],
        hash,
        desc: DESC_TEMPLATES[hash % DESC_TEMPLATES.length]
    };
}

// ---- CREATURE DRAWING ----
function drawCreature(targetCanvas, creature, size) {
    const c = targetCanvas.getContext('2d');
    const w = targetCanvas.width, h = targetCanvas.height;
    c.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const s = size || Math.min(w, h) * 0.35;
    const rng = seededRandom(creature.hash + 999);

    // Body glow
    c.save();
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, s * 1.5);
    glow.addColorStop(0, creature.primaryColor + '30');
    glow.addColorStop(1, 'transparent');
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
    c.restore();

    // Body
    c.save();
    c.fillStyle = creature.primaryColor;
    c.strokeStyle = creature.secondaryColor;
    c.lineWidth = 2;

    switch (creature.bodyShape) {
        case 'blob':
            c.beginPath();
            for (let i = 0; i <= 20; i++) {
                const a = (i / 20) * Math.PI * 2;
                const wobble = 1 + Math.sin(a * 3 + creature.hash) * 0.12;
                const rx = s * wobble, ry = s * 0.9 * wobble;
                const px = cx + Math.cos(a) * rx;
                const py = cy + Math.sin(a) * ry;
                i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
            }
            c.closePath(); c.fill(); c.stroke(); break;
        case 'round':
            c.beginPath();
            c.arc(cx, cy, s, 0, Math.PI * 2);
            c.fill(); c.stroke(); break;
        case 'tall':
            c.beginPath();
            c.ellipse(cx, cy, s * 0.65, s * 1.15, 0, 0, Math.PI * 2);
            c.fill(); c.stroke(); break;
        case 'spiky':
            c.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const r1 = s, r2 = s * 1.35;
                const r = i % 2 === 0 ? r2 : r1;
                const px = cx + Math.cos(a) * r;
                const py = cy + Math.sin(a) * r;
                i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
            }
            c.closePath(); c.fill(); c.stroke(); break;
        case 'winged':
            c.beginPath();
            c.ellipse(cx, cy, s * 0.75, s * 0.85, 0, 0, Math.PI * 2);
            c.fill(); c.stroke();
            // Wings
            c.fillStyle = creature.accentColor + '80';
            c.beginPath();
            c.ellipse(cx - s * 1.1, cy - s * 0.2, s * 0.55, s * 0.3, -0.4, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.ellipse(cx + s * 1.1, cy - s * 0.2, s * 0.55, s * 0.3, 0.4, 0, Math.PI * 2);
            c.fill(); break;
        case 'squid':
            c.beginPath();
            c.ellipse(cx, cy - s * 0.2, s * 0.7, s * 0.85, 0, 0, Math.PI * 2);
            c.fill(); c.stroke();
            // Tentacles
            c.strokeStyle = creature.primaryColor;
            c.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                c.beginPath();
                const tx = cx + (i - 1.5) * s * 0.3;
                c.moveTo(tx, cy + s * 0.5);
                c.quadraticCurveTo(tx + Math.sin(i) * 10, cy + s * 1.1, tx + (i - 1.5) * 8, cy + s * 1.3);
                c.stroke();
            } break;
    }
    c.restore();

    // Body pattern/shine
    c.save();
    const shine = c.createRadialGradient(cx - s * 0.25, cy - s * 0.25, 0, cx, cy, s);
    shine.addColorStop(0, 'rgba(255,255,255,0.2)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    shine.addColorStop(1, 'transparent');
    c.fillStyle = shine;
    c.beginPath();
    c.arc(cx, cy, s, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Spots/patterns
    c.save();
    c.globalAlpha = 0.25;
    c.fillStyle = creature.secondaryColor;
    const spotCount = 2 + Math.floor(rng() * 4);
    for (let i = 0; i < spotCount; i++) {
        const a = rng() * Math.PI * 2;
        const d = rng() * s * 0.5;
        c.beginPath();
        c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s * 0.08 + rng() * s * 0.1, 0, Math.PI * 2);
        c.fill();
    }
    c.restore();

    // Eyes
    drawEyes(c, cx, cy, s, creature);

    // Mouth
    c.save();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    const mouthW = s * 0.25;
    c.arc(cx, cy + s * 0.25, mouthW, 0.1, Math.PI - 0.1);
    c.stroke();
    c.restore();

    // Cheeks (blush)
    c.save();
    c.globalAlpha = 0.3;
    c.fillStyle = '#ff8888';
    c.beginPath(); c.ellipse(cx - s * 0.4, cy + s * 0.15, s * 0.12, s * 0.08, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(cx + s * 0.4, cy + s * 0.15, s * 0.12, s * 0.08, 0, 0, Math.PI * 2); c.fill();
    c.restore();

    // Appendages
    drawAppendage(c, cx, cy, s, creature);

    // Accessory
    drawAccessory(c, cx, cy, s, creature);
}

function drawEyes(c, cx, cy, s, creature) {
    c.save();
    const eyeY = cy - s * 0.12;
    switch (creature.eyeStyle) {
        case 'big':
            for (let side of [-1, 1]) {
                const ex = cx + side * s * 0.22;
                c.fillStyle = '#fff';
                c.beginPath(); c.ellipse(ex, eyeY, s * 0.16, s * 0.18, 0, 0, Math.PI * 2); c.fill();
                c.fillStyle = creature.accentColor === '#ffd700' ? '#333' : creature.accentColor;
                c.beginPath(); c.arc(ex + side * 2, eyeY + 2, s * 0.09, 0, Math.PI * 2); c.fill();
                c.fillStyle = '#fff';
                c.beginPath(); c.arc(ex + side * 4, eyeY - 3, s * 0.04, 0, Math.PI * 2); c.fill();
            } break;
        case 'cat':
            for (let side of [-1, 1]) {
                const ex = cx + side * s * 0.2;
                c.fillStyle = '#ffe44a';
                c.beginPath(); c.ellipse(ex, eyeY, s * 0.12, s * 0.14, 0, 0, Math.PI * 2); c.fill();
                c.fillStyle = '#111';
                c.beginPath(); c.ellipse(ex, eyeY, s * 0.04, s * 0.12, 0, 0, Math.PI * 2); c.fill();
            } break;
        case 'multi':
            const positions = [[-0.25, -0.1], [0.25, -0.1], [0, -0.25], [-0.15, 0.05], [0.15, 0.05]];
            positions.forEach(([px, py]) => {
                c.fillStyle = '#fff';
                c.beginPath(); c.arc(cx + px * s, cy + py * s, s * 0.08, 0, Math.PI * 2); c.fill();
                c.fillStyle = '#333';
                c.beginPath(); c.arc(cx + px * s, cy + py * s + 1, s * 0.04, 0, Math.PI * 2); c.fill();
            }); break;
        case 'cyclops':
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(cx, eyeY, s * 0.22, 0, Math.PI * 2); c.fill();
            c.fillStyle = creature.accentColor;
            c.beginPath(); c.arc(cx, eyeY + 2, s * 0.12, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#111';
            c.beginPath(); c.arc(cx, eyeY + 2, s * 0.06, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(cx + 4, eyeY - 4, s * 0.05, 0, Math.PI * 2); c.fill();
            break;
        case 'sparkly':
            for (let side of [-1, 1]) {
                const ex = cx + side * s * 0.2;
                c.fillStyle = '#fff';
                c.beginPath(); c.arc(ex, eyeY, s * 0.15, 0, Math.PI * 2); c.fill();
                c.fillStyle = creature.accentColor;
                c.beginPath(); c.arc(ex, eyeY + 1, s * 0.09, 0, Math.PI * 2); c.fill();
                // Sparkle highlights
                c.fillStyle = '#fff';
                c.beginPath(); c.arc(ex - 2, eyeY - 4, s * 0.04, 0, Math.PI * 2); c.fill();
                c.beginPath(); c.arc(ex + 3, eyeY - 1, s * 0.025, 0, Math.PI * 2); c.fill();
            } break;
        case 'sleepy':
            for (let side of [-1, 1]) {
                const ex = cx + side * s * 0.2;
                c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.lineCap = 'round';
                c.beginPath();
                c.arc(ex, eyeY, s * 0.1, 0.3, Math.PI - 0.3);
                c.stroke();
            } break;
    }
    c.restore();
}

function drawAppendage(c, cx, cy, s, creature) {
    c.save();
    c.fillStyle = creature.secondaryColor;
    c.strokeStyle = creature.secondaryColor;
    c.lineWidth = 3;
    c.lineCap = 'round';
    
    switch (creature.appendage) {
        case 'arms':
            for (let side of [-1, 1]) {
                c.beginPath();
                c.moveTo(cx + side * s * 0.8, cy);
                c.quadraticCurveTo(cx + side * s * 1.2, cy - s * 0.3, cx + side * s * 1.1, cy - s * 0.6);
                c.stroke();
                c.beginPath(); c.arc(cx + side * s * 1.1, cy - s * 0.6, 4, 0, Math.PI * 2); c.fill();
            } break;
        case 'legs':
            for (let side of [-1, 1]) {
                c.fillStyle = creature.secondaryColor;
                c.beginPath();
                c.ellipse(cx + side * s * 0.3, cy + s * 0.85, s * 0.15, s * 0.22, side * 0.2, 0, Math.PI * 2);
                c.fill();
            } break;
        case 'wings':
            c.fillStyle = creature.accentColor + '60';
            for (let side of [-1, 1]) {
                c.beginPath();
                c.moveTo(cx + side * s * 0.6, cy - s * 0.1);
                c.quadraticCurveTo(cx + side * s * 1.5, cy - s * 0.9, cx + side * s * 0.8, cy - s * 0.3);
                c.fill();
            } break;
        case 'tail':
            c.beginPath();
            c.moveTo(cx + s * 0.7, cy + s * 0.2);
            c.bezierCurveTo(cx + s * 1.3, cy + s * 0.1, cx + s * 1.5, cy - s * 0.4, cx + s * 1.2, cy - s * 0.6);
            c.stroke();
            c.beginPath(); c.arc(cx + s * 1.2, cy - s * 0.6, 5, 0, Math.PI * 2); c.fill();
            break;
        case 'antennae':
            for (let side of [-1, 1]) {
                c.beginPath();
                c.moveTo(cx + side * s * 0.15, cy - s * 0.8);
                c.quadraticCurveTo(cx + side * s * 0.4, cy - s * 1.5, cx + side * s * 0.3, cy - s * 1.3);
                c.stroke();
                c.beginPath();
                c.arc(cx + side * s * 0.3, cy - s * 1.3, 5, 0, Math.PI * 2);
                c.fillStyle = creature.accentColor;
                c.fill();
            } break;
        case 'tentacles':
            for (let i = 0; i < 3; i++) {
                c.beginPath();
                const tx = cx + (i - 1) * s * 0.3;
                c.moveTo(tx, cy + s * 0.75);
                c.bezierCurveTo(tx - 10, cy + s * 1.2, tx + 15, cy + s * 1.4, tx + 5, cy + s * 1.5);
                c.stroke();
            } break;
    }
    c.restore();
}

function drawAccessory(c, cx, cy, s, creature) {
    c.save();
    switch (creature.accessory) {
        case 'crown':
            c.fillStyle = '#ffd700';
            c.beginPath();
            c.moveTo(cx - s * 0.3, cy - s * 0.8);
            c.lineTo(cx - s * 0.22, cy - s * 1.1);
            c.lineTo(cx - s * 0.1, cy - s * 0.9);
            c.lineTo(cx, cy - s * 1.15);
            c.lineTo(cx + s * 0.1, cy - s * 0.9);
            c.lineTo(cx + s * 0.22, cy - s * 1.1);
            c.lineTo(cx + s * 0.3, cy - s * 0.8);
            c.closePath(); c.fill();
            c.strokeStyle = '#ffaa00'; c.lineWidth = 1; c.stroke();
            break;
        case 'bow':
            c.fillStyle = '#ff4adc';
            c.beginPath();
            c.ellipse(cx - s * 0.45, cy - s * 0.7, s * 0.18, s * 0.12, -0.3, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.ellipse(cx - s * 0.25, cy - s * 0.65, s * 0.18, s * 0.12, 0.5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#ff2ac0';
            c.beginPath(); c.arc(cx - s * 0.35, cy - s * 0.7, 4, 0, Math.PI * 2); c.fill();
            break;
        case 'glasses':
            c.strokeStyle = '#fff';
            c.lineWidth = 2;
            c.beginPath(); c.arc(cx - s * 0.2, cy - s * 0.12, s * 0.13, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.arc(cx + s * 0.2, cy - s * 0.12, s * 0.13, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.moveTo(cx - s * 0.07, cy - s * 0.12); c.lineTo(cx + s * 0.07, cy - s * 0.12); c.stroke();
            break;
        case 'scarf':
            c.fillStyle = creature.accentColor;
            c.beginPath();
            c.ellipse(cx, cy + s * 0.45, s * 0.55, s * 0.12, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = creature.accentColor + 'cc';
            c.beginPath();
            c.moveTo(cx + s * 0.15, cy + s * 0.5);
            c.lineTo(cx + s * 0.25, cy + s * 0.9);
            c.lineTo(cx + s * 0.05, cy + s * 0.85);
            c.closePath(); c.fill();
            break;
        case 'horns':
            c.fillStyle = creature.secondaryColor;
            for (let side of [-1, 1]) {
                c.beginPath();
                c.moveTo(cx + side * s * 0.25, cy - s * 0.75);
                c.lineTo(cx + side * s * 0.45, cy - s * 1.2);
                c.lineTo(cx + side * s * 0.15, cy - s * 0.8);
                c.closePath(); c.fill();
            } break;
    }
    c.restore();
}

// ---- INGREDIENT UI ----
function buildIngredientShelf() {
    const list = document.getElementById('ingredient-list');
    list.innerHTML = '';
    INGREDIENTS.forEach(ing => {
        const card = document.createElement('div');
        card.className = 'ingredient-card';
        card.dataset.id = ing.id;
        card.style.setProperty('--ingredient-color', ing.color);
        card.style.setProperty('--ingredient-glow', ing.glow);
        card.innerHTML = `
            <span class="ingredient-emoji">${ing.emoji}</span>
            <span class="ingredient-name">${ing.name}</span>
        `;
        card.setAttribute('draggable', 'false');
        setupDrag(card, ing);
        list.appendChild(card);
    });
}

// ---- DRAG & DROP ----
let dragData = null;
let dragGhost = null;

function setupDrag(card, ing) {
    const startDrag = (clientX, clientY) => {
        if (state.mixing || state.revealing) return;
        ensureAudio();
        dragData = ing;
        card.classList.add('dragging');
        dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = ing.emoji;
        dragGhost.style.setProperty('--ingredient-glow', ing.glow);
        document.body.appendChild(dragGhost);
        moveDrag(clientX, clientY);
    };

    const moveDrag = (clientX, clientY) => {
        if (!dragGhost) return;
        dragGhost.style.left = clientX + 'px';
        dragGhost.style.top = clientY + 'px';
        // Check if over cauldron
        const cauldronArea = document.querySelector('.cauldron-area');
        const rect = cauldronArea.getBoundingClientRect();
        const overCauldron = clientX > rect.left && clientX < rect.right && clientY > rect.top && clientY < rect.bottom;
        cauldronArea.classList.toggle('drop-hover', overCauldron);
    };

    const endDrag = (clientX, clientY) => {
        if (!dragData) return;
        card.classList.remove('dragging');
        const cauldronArea = document.querySelector('.cauldron-area');
        cauldronArea.classList.remove('drop-hover');
        if (dragGhost) { dragGhost.remove(); dragGhost = null; }

        const rect = cauldronArea.getBoundingClientRect();
        if (clientX > rect.left && clientX < rect.right && clientY > rect.top && clientY < rect.bottom) {
            addIngredient(dragData);
        }
        dragData = null;
    };

    // Mouse events
    card.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
    
    // Touch events
    card.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.touches[0];
        startDrag(t.clientX, t.clientY);
    }, { passive: false });

    document.addEventListener('mousemove', e => { if (dragData) moveDrag(e.clientX, e.clientY); });
    document.addEventListener('touchmove', e => { if (dragData) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('mouseup', e => { if (dragData) endDrag(e.clientX, e.clientY); });
    document.addEventListener('touchend', e => { if (dragData) { const t = e.changedTouches[0]; endDrag(t.clientX, t.clientY); } });
}

function addIngredient(ing) {
    if (state.recipeCount >= 3) return;
    const slotIndex = state.recipe.indexOf(null);
    if (slotIndex === -1) return;

    state.recipe[slotIndex] = ing.id;
    state.recipeCount++;

    // Update slot UI
    const slot = document.querySelector(`.recipe-slot[data-slot="${slotIndex}"]`);
    slot.innerHTML = `<span style="font-size:1.4rem">${ing.emoji}</span>`;
    slot.classList.add('filled');

    // Play splash
    playSplash();
    spawnSparkle(cauldronX, cauldronY - cauldronH * 0.4, 15, ing.color);

    // Update cauldron color
    const hex = ing.color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    state.targetColor = {
        r: Math.round((state.targetColor.r + r) / 2),
        g: Math.round((state.targetColor.g + g) / 2),
        b: Math.round((state.targetColor.b + b) / 2)
    };

    // Show mix button when 3 ingredients added
    if (state.recipeCount === 3) {
        document.getElementById('mix-btn').classList.remove('hidden');
    }
}

// ---- MIXING ----
function startMixing() {
    if (state.mixing || state.recipeCount < 3) return;
    state.mixing = true;
    state.mixProgress = 0;
    document.getElementById('mix-btn').classList.add('hidden');
    playMixSound();

    // Intense mixing animation
    const mixInterval = setInterval(() => {
        for (let i = 0; i < 5; i++) {
            spawnSparkle(
                cauldronX + (Math.random() - 0.5) * cauldronW * 0.6,
                cauldronY - cauldronH * 0.3 - Math.random() * cauldronH * 0.3,
                1,
                `hsl(${Math.random() * 360},100%,70%)`
            );
        }
    }, 50);

    setTimeout(() => {
        clearInterval(mixInterval);
        state.mixing = false;
        revealCreature();
    }, 2000);
}

function revealCreature() {
    const ids = state.recipe.filter(Boolean);
    const creature = generateCreature(ids);
    state.revealing = true;

    // Draw creature on reveal canvas
    const revealCanvas = document.getElementById('creature-canvas');
    drawCreature(revealCanvas, creature);

    // Populate reveal info
    document.getElementById('creature-name').textContent = creature.name;
    const rarityEl = document.getElementById('creature-rarity');
    rarityEl.textContent = RARITIES[creature.rarity];
    rarityEl.className = 'creature-rarity ' + RARITIES[creature.rarity].toLowerCase();
    document.getElementById('creature-desc').textContent = creature.desc;

    // Show reveal panel
    document.getElementById('creature-reveal').classList.remove('hidden');
    playReveal(creature.rarity);

    // Big sparkle burst
    for (let i = 0; i < 40; i++) {
        spawnSparkle(cauldronX, cauldronY - cauldronH * 0.5, 1, creature.primaryColor);
    }

    // Collect button handler
    const collectBtn = document.getElementById('collect-btn');
    const newHandler = () => {
        collectCreature(creature);
        collectBtn.removeEventListener('click', newHandler);
    };
    collectBtn.addEventListener('click', newHandler);
}

function collectCreature(creature) {
    // Check if already collected
    const existing = state.bestiary.find(c => c.hash === creature.hash);
    if (!existing) {
        state.bestiary.push(creature);
        localStorage.setItem('critterKitchen_bestiary', JSON.stringify(state.bestiary));
    }

    playCollect();

    // Hide reveal, reset recipe
    document.getElementById('creature-reveal').classList.add('hidden');
    state.revealing = false;
    resetRecipe();
    updateBestiaryCount();
}

function resetRecipe() {
    state.recipe = [null, null, null];
    state.recipeCount = 0;
    state.targetColor = { r: 10, g: 100, b: 110 };
    
    document.querySelectorAll('.recipe-slot').forEach(slot => {
        slot.innerHTML = '<span class="slot-placeholder">?</span>';
        slot.classList.remove('filled');
    });
    document.getElementById('mix-btn').classList.add('hidden');
}

// ---- BESTIARY ----
function updateBestiaryCount() {
    const total = 20;
    const discovered = state.bestiary.length;
    document.getElementById('bestiary-count').textContent = `${discovered}/${total}`;
    document.getElementById('bestiary-discovered').textContent = discovered;
    document.getElementById('bestiary-total').textContent = total;
    document.getElementById('bestiary-progress').style.width = `${(discovered / total) * 100}%`;
}

function openBestiary() {
    state.bestiaryOpen = true;
    document.getElementById('bestiary-panel').classList.add('open');
    document.getElementById('bestiary-overlay').classList.remove('hidden');
    renderBestiaryGrid();
}

function closeBestiary() {
    state.bestiaryOpen = false;
    document.getElementById('bestiary-panel').classList.remove('open');
    document.getElementById('bestiary-overlay').classList.add('hidden');
}

function renderBestiaryGrid() {
    const grid = document.getElementById('bestiary-grid');
    grid.innerHTML = '';
    const total = 20;
    
    // Show discovered creatures
    state.bestiary.forEach(creature => {
        const card = document.createElement('div');
        card.className = 'bestiary-card';
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 120;
        miniCanvas.height = 120;
        drawCreature(miniCanvas, creature, 35);
        card.appendChild(miniCanvas);
        const name = document.createElement('div');
        name.className = 'bestiary-card-name';
        name.textContent = creature.name;
        card.appendChild(name);
        card.addEventListener('click', () => showCreatureModal(creature));
        grid.appendChild(card);
    });

    // Fill undiscovered slots
    for (let i = state.bestiary.length; i < total; i++) {
        const card = document.createElement('div');
        card.className = 'bestiary-card undiscovered';
        card.innerHTML = '<div class="bestiary-card-silhouette">❓</div><div class="bestiary-card-name">???</div>';
        grid.appendChild(card);
    }
}

function showCreatureModal(creature) {
    const modal = document.getElementById('creature-modal');
    modal.classList.remove('hidden');
    
    const modalCanvas = document.getElementById('modal-creature-canvas');
    drawCreature(modalCanvas, creature, 60);
    
    document.getElementById('modal-creature-name').textContent = creature.name;
    const rarityEl = document.getElementById('modal-creature-rarity');
    rarityEl.textContent = RARITIES[creature.rarity];
    rarityEl.className = 'modal-creature-rarity creature-rarity ' + RARITIES[creature.rarity].toLowerCase();
    
    const ingredientsEl = document.getElementById('modal-ingredients');
    ingredientsEl.innerHTML = creature.ids.map(id => {
        const ing = INGREDIENTS.find(i => i.id === id);
        return `<div class="modal-ingredient-icon" title="${ing.name}">${ing.emoji}</div>`;
    }).join('');
    
    document.getElementById('modal-creature-desc').textContent = creature.desc;
}

// ---- EVENT LISTENERS ----
document.getElementById('mix-btn').addEventListener('click', startMixing);
document.getElementById('bestiary-btn').addEventListener('click', openBestiary);
document.getElementById('bestiary-close').addEventListener('click', closeBestiary);
document.getElementById('bestiary-overlay').addEventListener('click', closeBestiary);
document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('creature-modal').classList.add('hidden');
});
document.getElementById('creature-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('creature-modal').classList.add('hidden');
});

// ---- INIT ----
function init() {
    resize();
    buildIngredientShelf();
    updateBestiaryCount();
    render();
}

init();
