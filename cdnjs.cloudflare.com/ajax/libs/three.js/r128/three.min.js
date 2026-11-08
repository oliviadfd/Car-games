(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    alert('three.min.js load hoy nai. Internet check korun ba three.min.js file HTML-er pashe rakhun.');
    return;
  }

  // --- 1. WEB AUDIO SYNTHESIZER ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.engineOsc = null;
      this.engineGain = null;
      this.engineFilter = null;
      this.bgmPlaying = false;
      this.bgmTimer = null;
      this.lastNitroSound = 0;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      this.masterComp = this.ctx.createDynamicsCompressor();
      this.masterComp.connect(this.ctx.destination);

      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 160;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0.0001;

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterComp);

      try { this.engineOsc.start(); } catch (e) {}
    }

    updateEngineSound(speedRatio, active) {
      if (!this.ctx || !this.engineGain) return;
      if (!this.enabled || !active) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
        return;
      }
      const t = this.ctx.currentTime;
      const targetFreq = 48 + (speedRatio * 165);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.05);
      this.engineFilter.frequency.setTargetAtTime(130 + (speedRatio * 500), t, 0.05);
      this.engineGain.gain.setTargetAtTime(0.11, t, 0.08);
    }

    playCoin() {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t);
      osc.frequency.setValueAtTime(880.00, t + 0.07);
      osc.frequency.setValueAtTime(1174.66, t + 0.14);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(g);
      g.connect(this.masterComp);
      osc.start(t);
      osc.stop(t + 0.32);
    }

    playNitro() {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * 0.3);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(700, t);
      f.frequency.exponentialRampToValueAtTime(2800, t + 0.28);
      f.Q.value = 3;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      src.connect(f);
      f.connect(g);
      g.connect(this.masterComp);
      src.start(t);
    }

    // Nitro dhore rakhle prottek frame-e sound baje na, tai throttle kora
    playNitroThrottled() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      if (t - this.lastNitroSound > 0.35) {
        this.lastNitroSound = t;
        this.playNitro();
      }
    }

    playHit() {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g);
      g.connect(this.masterComp);
      osc.start(t);
      osc.stop(t + 0.28);
    }

    playLevelUp() {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        g.gain.setValueAtTime(0.2, t + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
        osc.connect(g);
        g.connect(this.masterComp);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.25);
      });
    }

    playCrash() {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * 0.7);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(380, t);
      f.frequency.exponentialRampToValueAtTime(45, t + 0.6);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      src.connect(f);
      f.connect(g);
      g.connect(this.masterComp);
      src.start(t);
    }

    startBGM() {
      if (!this.ctx || !this.enabled || this.bgmPlaying) return;
      this.bgmPlaying = true;
      let step = 0;
      const bassSeq = [55, 55, 65.4, 65.4, 73.4, 73.4, 82.4, 73.4];
      const leadSeq = [220, 261.6, 329.6, 392, 440, 523.2, 440, 329.6];

      const loop = () => {
        if (!this.bgmPlaying || !this.enabled) return;
        const t = this.ctx.currentTime;

        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.value = bassSeq[step % bassSeq.length];
        bGain.gain.setValueAtTime(0.065, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        const bFilt = this.ctx.createBiquadFilter();
        bFilt.type = 'lowpass';
        bFilt.frequency.setValueAtTime(340, t);
        bFilt.frequency.exponentialRampToValueAtTime(100, t + 0.16);

        bOsc.connect(bFilt);
        bFilt.connect(bGain);
        bGain.connect(this.masterComp);
        bOsc.start(t);
        bOsc.stop(t + 0.18);

        if (step % 2 === 0) {
          const lOsc = this.ctx.createOscillator();
          const lGain = this.ctx.createGain();
          lOsc.type = 'sine';
          lOsc.frequency.value = leadSeq[(step / 2) % leadSeq.length];
          lGain.gain.setValueAtTime(0.03, t);
          lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          lOsc.connect(lGain);
          lGain.connect(this.masterComp);
          lOsc.start(t);
          lOsc.stop(t + 0.22);
        }

        step++;
        this.bgmTimer = setTimeout(loop, 240);
      };
      loop();
    }

    stopBGM() {
      this.bgmPlaying = false;
      if (this.bgmTimer) clearTimeout(this.bgmTimer);
    }

    toggle() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stopBGM();
        if (this.engineGain) this.engineGain.gain.value = 0;
      } else {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        if (isPlaying) this.startBGM();
      }
      return this.enabled;
    }
  }

  // --- 2. GAME STATE & PROGRESSION ---
  const sound = new SoundEngine();
  const LANES = [-6, -2, 2, 6];
  const ROAD_WIDTH = 18;
  const ROAD_LENGTH = 320;

  let scene, camera, renderer;
  let playerCar, playerChassisMat, playerUnderglow;
  let roadMesh, roadLines = [], roadLamps = [];
  let trafficCars = [];
  let collectables = [];
  let speedParticles = null;

  let isPlaying = false;
  let isGameOver = false;
  let score = 0;
  let highscore = 0;
  try {
    highscore = parseInt(localStorage.getItem('cyber_horizon_highscore') || '0', 10) || 0;
  } catch (e) { highscore = 0; }
  let selectedColor = '#ff0044';

  let lives = 3;
  let currentLevel = 1;
  let invincibleTimer = 0;

  let currentSpeed = 0;
  let baseCruisingSpeed = 75;
  let maxNitroSpeed = 145;
  let minBrakeSpeed = 45;
  let targetSpeed = baseCruisingSpeed;

  let playerX = 0;
  let targetPlayerX = 0;
  let carTilt = 0;

  let nitroAmount = 100;
  const MAX_NITRO = 100;
  let isNitroActive = false;
  let shieldTimer = 0;

  const keys = { left: false, right: false, nitro: false, brake: false };

  // DOM Elements
  const root = document.getElementById('cyber-game-root');
  const scoreDisplay = document.getElementById('cg-score-display');
  const speedDisplay = document.getElementById('cg-speed-display');
  const highDisplay = document.getElementById('cg-high-display');
  const livesBox = document.getElementById('cg-lives-box');
  const levelBadge = document.getElementById('cg-level-badge');
  const nitroBarInner = document.getElementById('cg-nitro-bar-inner');
  const popupEl = document.getElementById('cg-popup');
  const shieldPill = document.getElementById('cg-shield-indicator');
  const vignetteEl = document.getElementById('cg-vignette');
  const startOverlay = document.getElementById('cg-start-overlay');
  const gameoverOverlay = document.getElementById('cg-gameover-overlay');
  const finalScoreDisplay = document.getElementById('cg-final-score');
  const btnStart = document.getElementById('cg-btn-start');
  const btnRestart = document.getElementById('cg-btn-restart');
  const btnMute = document.getElementById('cg-btn-mute');
  const muteIcon = document.getElementById('cg-mute-icon');
  const btnFs = document.getElementById('cg-btn-fs');
  const mobileControls = document.getElementById('cg-mobile-controls');

  highDisplay.textContent = highscore;

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    mobileControls.style.display = 'flex';
  }

  // --- 3. 3D ASSETS ---
  function buildCarMesh(colorHex, isPlayer) {
    const car = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(2.1, 0.52, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.88,
      roughness: 0.22
    });
    if (isPlayer) playerChassisMat = bodyMat;

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.52;
    body.castShadow = true;
    body.receiveShadow = true;
    car.add(body);

    const hoodGeo = new THREE.BoxGeometry(1.9, 0.35, 1.3);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.44, -1.6);
    car.add(hood);

    const glassGeo = new THREE.BoxGeometry(1.6, 0.5, 2.2);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x080c14,
      metalness: 0.95,
      roughness: 0.08,
      transparent: true,
      opacity: 0.88
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0.95, -0.2);
    car.add(glass);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.5), bodyMat);
    roof.position.set(0, 1.22, -0.2);
    car.add(roof);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.45), bodyMat);
    spoiler.position.set(0, 1.15, 1.95);
    const pMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
    const pil1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), pMat);
    pil1.position.set(-0.7, 0.9, 1.95);
    const pil2 = pil1.clone();
    pil2.position.set(0.7, 0.9, 1.95);
    car.add(spoiler, pil1, pil2);

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff });
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.1), hlMat);
    hl1.position.set(-0.75, 0.52, -2.21);
    const hl2 = hl1.clone();
    hl2.position.set(0.75, 0.52, -2.21);
    car.add(hl1, hl2);

    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.1), tlMat);
    tl1.position.set(-0.75, 0.55, 2.21);
    const tl2 = tl1.clone();
    tl2.position.set(0.75, 0.55, 2.21);
    car.add(tl1, tl2);

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.33, 8);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.15 });

    const wheels = [];
    [[-1.05, 0.38, -1.3], [1.05, 0.38, -1.3], [-1.05, 0.38, 1.3], [1.05, 0.38, 1.3]].forEach(pos => {
      const wGrp = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      wGrp.add(tire, rim);
      wGrp.position.set(pos[0], pos[1], pos[2]);
      car.add(wGrp);
      wheels.push(wGrp);
    });
    car.userData.wheels = wheels;

    const exMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.95 });
    const ex1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 8), exMat);
    ex1.rotation.x = Math.PI / 2;
    ex1.position.set(-0.4, 0.32, 2.24);
    const ex2 = ex1.clone();
    ex2.position.set(0.4, 0.32, 2.24);
    car.add(ex1, ex2);

    if (isPlayer) {
      const underglowMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65 });
      playerUnderglow = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.2), underglowMat);
      playerUnderglow.rotation.x = -Math.PI / 2;
      playerUnderglow.position.y = 0.05;
      car.add(playerUnderglow);

      const beamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.15 });
      const beam = new THREE.Mesh(new THREE.ConeGeometry(3.5, 14, 16), beamMat);
      beam.rotation.x = Math.PI / 2 + 0.12;
      beam.position.set(0, 0.3, -9);
      car.add(beam);
    }

    return car;
  }

  function buildCollectable(type) {
    const group = new THREE.Group();
    group.userData.type = type;

    if (type === 'coin') {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.68, 0.14, 16),
        new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, roughness: 0.2, emissive: 0xffaa00, emissiveIntensity: 0.4 })
      );
      mesh.rotation.x = Math.PI / 2;
      group.add(mesh);
    } else if (type === 'nitro') {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 1.15, 12),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8, emissive: 0x00a8ff, emissiveIntensity: 0.6 })
      );
      group.add(mesh);
    } else if (type === 'shield') {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.6, 1),
        new THREE.MeshStandardMaterial({ color: 0x00ff88, wireframe: true, emissive: 0x00ff88, emissiveIntensity: 0.9 })
      );
      group.add(mesh);
    } else if (type === 'heart') {
      const mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.55),
        new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 0.8 })
      );
      group.add(mesh);
    }

    group.position.y = 0.9;
    return group;
  }

  // --- 4. SCENE SETUP ---
  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060814);
    scene.fog = new THREE.FogExp2(0x060814, 0.011);

    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 800);
    camera.position.set(0, 4.3, 7.8);
    camera.lookAt(0, 1.4, -16);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    root.appendChild(renderer.domElement);

    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xbbe1fa, 1.25);
    dir.position.set(25, 45, -25);
    dir.castShadow = true;
    scene.add(dir);

    const hemi = new THREE.HemisphereLight(0x00f0ff, 0xff0077, 0.35);
    scene.add(hemi);

    setupHighway();
    setupCitySkyline();
    setupSpeedWarpLines();

    playerCar = buildCarMesh(selectedColor, true);
    scene.add(playerCar);

    setupTraffic();
    window.addEventListener('resize', handleResize);
  }

  function setupHighway() {
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH, 1, 1);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x10131a, roughness: 0.85 });
    roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    const lineGeo = new THREE.PlaneGeometry(0.24, 4.2);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let z = -ROAD_LENGTH / 2; z < ROAD_LENGTH / 2; z += 8.5) {
      [-2, 2].forEach(lx => {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(lx, 0.02, z);
        scene.add(line);
        roadLines.push(line);
      });
    }

    const railMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00a8ff, emissiveIntensity: 0.65, metalness: 0.8 });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, ROAD_LENGTH), railMat);
    leftRail.position.set(-ROAD_WIDTH / 2, 0.25, 0);
    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, ROAD_LENGTH), railMat);
    rightRail.position.set(ROAD_WIDTH / 2, 0.25, 0);
    scene.add(leftRail, rightRail);

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f2438 });
    const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    for (let z = -ROAD_LENGTH / 2; z < ROAD_LENGTH / 2; z += 35) {
      [-ROAD_WIDTH / 2 - 1.5, ROAD_WIDTH / 2 + 1.5].forEach((xPos, i) => {
        const lamp = new THREE.Group();
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 3;
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 0.35), lampHeadMat);
        head.position.set(i === 0 ? 0.6 : -0.6, 6, 0);
        lamp.add(pole, head);
        lamp.position.set(xPos, 0, z);
        scene.add(lamp);
        roadLamps.push(lamp);
      });
    }
  }

  function setupCitySkyline() {
    const city = new THREE.Group();
    for (let i = -12; i <= 12; i++) {
      const bh = 25 + Math.random() * 45;
      const bw = 7 + Math.random() * 9;
      const bMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x070b17 : 0x0b1021 });
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 10), bMat);
      bMesh.position.set(i * 11, bh / 2 - 6, -ROAD_LENGTH / 2 - 35);
      city.add(bMesh);
    }
    scene.add(city);
  }

  function setupSpeedWarpLines() {
    const pGeo = new THREE.BufferGeometry();
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * ROAD_WIDTH * 1.6;
      positions[i + 1] = 0.5 + Math.random() * 5;
      positions[i + 2] = -Math.random() * ROAD_LENGTH;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.28, transparent: true, opacity: 0.6 });
    speedParticles = new THREE.Points(pGeo, pMat);
    speedParticles.frustumCulled = false;
    scene.add(speedParticles);
  }

  // --- 5. TRAFFIC & PICKUPS ---
  const CAR_COLORS = [0xffffff, 0x3b82f6, 0xf59e0b, 0x10b981, 0x8b5cf6, 0xec4899];

  function setupTraffic() {
    trafficCars.forEach(c => scene.remove(c));
    trafficCars = [];
    const initialCarCount = 3 + Math.min(3, currentLevel - 1);
    for (let i = 0; i < initialCarCount; i++) {
      const car = buildCarMesh(CAR_COLORS[i % CAR_COLORS.length], false);
      resetTrafficCar(car, -60 - (i * 45));
      scene.add(car);
      trafficCars.push(car);
    }

    collectables.forEach(item => scene.remove(item));
    collectables = [];
    const types = ['coin', 'coin', 'nitro', 'shield', 'heart'];
    types.forEach((type, idx) => {
      const item = buildCollectable(type);
      resetCollectable(item, -30 - (idx * 50));
      scene.add(item);
      collectables.push(item);
    });
  }

  function resetTrafficCar(car, startZ) {
    const laneIdx = Math.floor(Math.random() * LANES.length);
    car.position.x = LANES[laneIdx];
    car.position.y = 0;
    car.position.z = (startZ !== undefined && startZ !== null) ? startZ : -ROAD_LENGTH / 2 - (Math.random() * 50);
    car.userData.speedFactor = 0.45 + (currentLevel * 0.08) + Math.random() * 0.2;
    car.userData.passed = false;
  }

  function resetCollectable(item, startZ) {
    const laneIdx = Math.floor(Math.random() * LANES.length);
    item.position.x = LANES[laneIdx];
    item.position.z = (startZ !== undefined && startZ !== null) ? startZ : -ROAD_LENGTH / 2 - (Math.random() * 70);
  }

  // --- 6. NOTIFICATIONS & LEVELS ---
  let popupT = null;
  function showBanner(text, color) {
    popupEl.textContent = text;
    popupEl.style.color = color || '#ffea00';
    popupEl.style.opacity = '1';
    popupEl.style.transform = 'translate(-50%, -50%) scale(1.15)';
    if (popupT) clearTimeout(popupT);
    popupT = setTimeout(() => {
      popupEl.style.opacity = '0';
      popupEl.style.transform = 'translate(-50%, -50%) scale(0)';
    }, 850);
  }

  function updateLivesDisplay() {
    let hearts = '';
    for (let i = 0; i < lives; i++) hearts += '\u2764\uFE0F';
    for (let i = lives; i < 3; i++) hearts += '\uD83D\uDDA4';
    livesBox.textContent = hearts;
  }

  function checkLevelProgression() {
    let newLevel = 1;
    let label = 'LEVEL 1: BEGINNER';

    if (score >= 4500) {
      newLevel = 4;
      label = 'LEVEL 4: MASTER';
      baseCruisingSpeed = 160;
      maxNitroSpeed = 250;
    } else if (score >= 2200) {
      newLevel = 3;
      label = 'LEVEL 3: ADVANCED';
      baseCruisingSpeed = 130;
      maxNitroSpeed = 210;
    } else if (score >= 800) {
      newLevel = 2;
      label = 'LEVEL 2: INTERMEDIATE';
      baseCruisingSpeed = 100;
      maxNitroSpeed = 180;
    } else {
      newLevel = 1;
      label = 'LEVEL 1: BEGINNER';
      baseCruisingSpeed = 75;
      maxNitroSpeed = 145;
    }

    if (newLevel !== currentLevel) {
      currentLevel = newLevel;
      levelBadge.textContent = label;
      sound.playLevelUp();
      showBanner(label + ' UNLOCKED!', '#00ff88');

      if (trafficCars.length < 3 + currentLevel) {
        const car = buildCarMesh(CAR_COLORS[trafficCars.length % CAR_COLORS.length], false);
        resetTrafficCar(car);
        scene.add(car);
        trafficCars.push(car);
      }
    }
  }

  // --- 7. GAME LOOP ---
  let prevTime = performance.now();

  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - prevTime) / 1000, 0.1);
    prevTime = now;

    if (isPlaying && !isGameOver) {
      updateDriving(dt);
    }

    collectables.forEach(c => { c.rotation.y += dt * 3.2; });

    const wSpeed = (currentSpeed / 20) * dt;
    if (playerCar && playerCar.userData.wheels) {
      playerCar.userData.wheels.forEach(w => { w.rotation.x += wSpeed; });
    }
    trafficCars.forEach(tc => {
      if (tc.userData.wheels) tc.userData.wheels.forEach(w => { w.rotation.x += wSpeed * 0.75; });
    });

    if (speedParticles && speedParticles.geometry) {
      const pos = speedParticles.geometry.attributes.position.array;
      const warpSpeed = (currentSpeed * 1.2) * dt;
      for (let i = 2; i < pos.length; i += 3) {
        pos[i] += warpSpeed;
        if (pos[i] > 20) pos[i] -= ROAD_LENGTH;
      }
      speedParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (invincibleTimer > 0) {
      invincibleTimer -= dt;
      playerCar.visible = (Math.floor(invincibleTimer * 10) % 2 === 0);
      if (invincibleTimer <= 0) playerCar.visible = true;
    }

    renderer.render(scene, camera);
  }

  function updateDriving(dt) {
    if (keys.nitro && nitroAmount > 5) {
      targetSpeed = maxNitroSpeed;
      isNitroActive = true;
      nitroAmount = Math.max(0, nitroAmount - (dt * 26));
      sound.playNitroThrottled();
    } else {
      isNitroActive = false;
      targetSpeed = keys.brake ? minBrakeSpeed : baseCruisingSpeed;
      if (nitroAmount < MAX_NITRO) nitroAmount = Math.min(MAX_NITRO, nitroAmount + (dt * 8));
    }

    currentSpeed += (targetSpeed - currentSpeed) * (dt * 3.5);
    const speedRatio = Math.max(0, (currentSpeed - minBrakeSpeed) / (maxNitroSpeed - minBrakeSpeed));

    speedDisplay.textContent = Math.round(currentSpeed);
    nitroBarInner.style.width = nitroAmount + '%';
    vignetteEl.classList.toggle('nitro-on', isNitroActive);

    sound.updateEngineSound(speedRatio, true);

    const steerSpeed = 15.5 * dt;
    let targetTilt = 0;
    if (keys.left) {
      targetPlayerX -= steerSpeed * 1.6;
      targetTilt = 0.2;
    }
    if (keys.right) {
      targetPlayerX += steerSpeed * 1.6;
      targetTilt = -0.2;
    }
    targetPlayerX = Math.max(-ROAD_WIDTH / 2 + 1.6, Math.min(ROAD_WIDTH / 2 - 1.6, targetPlayerX));

    playerX += (targetPlayerX - playerX) * (dt * 12);
    carTilt += (targetTilt - carTilt) * (dt * 8);

    playerCar.position.x = playerX;
    playerCar.rotation.z = carTilt;
    playerCar.rotation.y = -carTilt * 0.6;

    camera.position.x += ((playerX * 0.42) - camera.position.x) * (dt * 8);
    const desiredFOV = 62 + (speedRatio * 14);
    camera.fov += (desiredFOV - camera.fov) * (dt * 4);
    camera.updateProjectionMatrix();

    const dz = (currentSpeed * 0.55) * dt;
    score += Math.round(dz * 0.5);
    scoreDisplay.textContent = score;

    checkLevelProgression();

    roadLines.forEach(l => {
      l.position.z += dz;
      if (l.position.z > 25) l.position.z -= ROAD_LENGTH;
    });

    roadLamps.forEach(lp => {
      lp.position.z += dz;
      if (lp.position.z > 25) lp.position.z -= ROAD_LENGTH;
    });

    if (shieldTimer > 0) {
      shieldTimer -= dt;
      shieldPill.style.display = 'block';
      if (shieldTimer <= 0) shieldPill.style.display = 'none';
    }

    playerCar.updateMatrixWorld(true);
    const pBox = new THREE.Box3().setFromObject(playerCar);
    pBox.expandByScalar(-0.2);

    for (let i = 0; i < trafficCars.length; i++) {
      const car = trafficCars[i];
      const enemyDz = dz - ((currentSpeed * car.userData.speedFactor * 0.35) * dt);
      car.position.z += enemyDz;

      if (car.position.z > 25) resetTrafficCar(car);

      if (!car.userData.passed && car.position.z > playerCar.position.z && car.position.z < playerCar.position.z + 3.8) {
        const dx = Math.abs(car.position.x - playerCar.position.x);
        if (dx < 3.2 && dx > 1.6) {
          car.userData.passed = true;
          score += 150;
          nitroAmount = Math.min(MAX_NITRO, nitroAmount + 15);
          sound.playCoin();
          showBanner('SPEED OVERTAKE! +150', '#00f0ff');
        }
      }

      car.updateMatrixWorld(true);
      const eBox = new THREE.Box3().setFromObject(car);
      eBox.expandByScalar(-0.2);

      if (pBox.intersectsBox(eBox)) {
        if (shieldTimer > 0) {
          resetTrafficCar(car);
          sound.playHit();
          showBanner('SHIELD SMASH! +200', '#00ff88');
          score += 200;
        } else if (invincibleTimer <= 0) {
          lives--;
          updateLivesDisplay();
          root.classList.add('cg-shake');
          setTimeout(() => root.classList.remove('cg-shake'), 450);

          if (lives > 0) {
            sound.playHit();
            invincibleTimer = 2.0;
            currentSpeed = minBrakeSpeed;
            resetTrafficCar(car);
            showBanner('-1 LIFE! (' + lives + ' REMAINING)', '#ff0055');
          } else {
            gameOver();
            return;
          }
        }
      }
    }

    collectables.forEach(item => {
      item.position.z += dz;
      if (item.position.z > 25) resetCollectable(item);

      if (playerCar.position.distanceTo(item.position) < 2.2) {
        if (item.userData.type === 'coin') {
          score += 250;
          sound.playCoin();
          showBanner('+250 GOLD COINS!', '#ffea00');
        } else if (item.userData.type === 'nitro') {
          nitroAmount = MAX_NITRO;
          sound.playNitro();
          showBanner('NITRO 100% FULL!', '#00f0ff');
        } else if (item.userData.type === 'shield') {
          shieldTimer = 7.0;
          sound.playCoin();
          showBanner('SHIELD ACTIVE (7s)!', '#00ff88');
        } else if (item.userData.type === 'heart') {
          if (lives < 3) {
            lives++;
            updateLivesDisplay();
            sound.playCoin();
            showBanner('+1 EXTRA LIFE! \u2764\uFE0F', '#ff0055');
          } else {
            score += 300;
            sound.playCoin();
            showBanner('+300 BONUS!', '#00ff88');
          }
        }
        resetCollectable(item);
      }
    });
  }

  // --- 8. GAME OVER & RESTART ---
  function gameOver() {
    isGameOver = true;
    isPlaying = false;
    sound.playCrash();
    sound.stopBGM();
    sound.updateEngineSound(0, false);

    root.classList.add('cg-shake');
    setTimeout(() => root.classList.remove('cg-shake'), 450);

    const subEl = document.getElementById('cg-gameover-sub');
    if (score > highscore) {
      highscore = score;
      try { localStorage.setItem('cyber_horizon_highscore', String(highscore)); } catch (e) {}
      highDisplay.textContent = highscore;
      subEl.textContent = 'NEW HIGH SCORE!';
      subEl.style.color = '#ffea00';
    } else {
      subEl.textContent = 'Traffic speeds up as you advance!';
      subEl.style.color = '#94a3b8';
    }

    finalScoreDisplay.textContent = score;
    setTimeout(() => {
      gameoverOverlay.classList.remove('cg-hidden');
    }, 500);
  }

  function restart() {
    score = 0;
    lives = 3;
    currentLevel = 1;
    invincibleTimer = 0;
    playerCar.visible = true;
    updateLivesDisplay();
    levelBadge.textContent = 'LEVEL 1: BEGINNER';

    nitroAmount = 100;
    shieldTimer = 0;
    shieldPill.style.display = 'none';

    baseCruisingSpeed = 75;
    maxNitroSpeed = 145;
    currentSpeed = baseCruisingSpeed;

    playerX = 0;
    targetPlayerX = 0;
    carTilt = 0;
    playerCar.position.set(0, 0, 0);
    playerCar.rotation.set(0, 0, 0);
    camera.position.set(0, 4.3, 7.8);

    scoreDisplay.textContent = '0';
    setupTraffic();

    gameoverOverlay.classList.add('cg-hidden');
    startOverlay.classList.add('cg-hidden');

    isGameOver = false;
    isPlaying = true;

    sound.init();
    sound.startBGM();

    requestGameFullscreen();
  }

  // --- 9. FULLSCREEN HELPER ---
  function requestGameFullscreen() {
    const elem = document.documentElement;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          const p = elem.requestFullscreen();
          if (p && p.catch) p.catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      }
    } catch (e) {}
  }

  // --- 10. EVENT LISTENERS ---
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) !== -1) e.preventDefault();
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = true;
    if (k === 'arrowright' || k === 'd') keys.right = true;
    if (k === 'arrowup' || k === 'w' || k === ' ') keys.nitro = true;
    if (k === 'arrowdown' || k === 's') keys.brake = true;
  });

  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
    if (k === 'arrowup' || k === 'w' || k === ' ') keys.nitro = false;
    if (k === 'arrowdown' || k === 's') keys.brake = false;
  });

  window.addEventListener('blur', () => {
    keys.left = keys.right = keys.nitro = keys.brake = false;
  });

  function bindBtn(id, prop) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = e => { e.preventDefault(); keys[prop] = true; el.classList.add('active-touch'); };
    const stop = e => { e.preventDefault(); keys[prop] = false; el.classList.remove('active-touch'); };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', stop, { passive: false });
    el.addEventListener('touchcancel', stop, { passive: false });
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', stop);
    el.addEventListener('mouseleave', stop);
  }

  bindBtn('cg-btn-left', 'left');
  bindBtn('cg-btn-right', 'right');
  bindBtn('cg-btn-nitro', 'nitro');
  bindBtn('cg-btn-brake', 'brake');

  document.querySelectorAll('.cg-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.cg-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      selectedColor = dot.getAttribute('data-color');
      if (playerChassisMat) playerChassisMat.color.set(selectedColor);
      if (playerUnderglow) playerUnderglow.material.color.set(selectedColor);
    });
  });

  btnStart.addEventListener('click', () => { sound.init(); restart(); });
  btnRestart.addEventListener('click', () => { restart(); });

  btnMute.addEventListener('click', () => {
    sound.init();
    const state = sound.toggle();
    muteIcon.textContent = state ? '\uD83D\uDD0A' : '\uD83D\uDD07';
  });

  btnFs.addEventListener('click', () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      requestGameFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  });

  function handleResize() {
    const w = root.clientWidth || window.innerWidth;
    const h = root.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  init();
  loop();
})();
