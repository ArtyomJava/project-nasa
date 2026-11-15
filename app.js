// FILE: app.js
// Unified NASA-style interactive engine with strict Moon/Mars page separation,
// sharp-edged UI components, NASA Red (#E4002B) active markers, and 2D/3D planetary maps.

let currentWorld = 'moon'; // 'moon' or 'mars'
let selectedMapPinId = 'apollo11-descent';
let selectedForRecycling = new Set(['saturn-sivb', 'apollo11-descent', 'surveyor3-moon']);
let activeModalItem = null;
let activeModalTab = 'story';
let currentMapMode = '2d';
let laserFired = false;

// 2D Map variables (Leaflet)
let planetaryMap = null;
let mainMarkersLayer = null;
let extraMarkersLayer = null;
let showExtraCatalog = false;
let currentTileLayer = null;
let currentTileStyle = 'primary';
const PLANETARY_MAP_BOUNDS = [[-85, -180], [85, 180]];

// 3D Globe variables (Three.js)
let threeInitialized = false;
let scene3D, camera3D, renderer3D, planetGroup, planetMesh, wireframeMesh;
let autoRotate3D = true;
let showGrid3D = false;
let isDragging3D = false;
let prevMouse3D = { x: 0, y: 0 };
let targetRotation3D = { x: 0.05, y: 0.4 };
let currentRotation3D = { x: 0.05, y: 0.4 };
let cameraDistance3D = 12.5;
let pinElements3D = [];
const GLOBE_RADIUS = 5;
let cachedTextures = { moon: null, mars: null };

function getActiveWorldItems() {
  return currentWorld === 'moon' ? moonArtifacts : marsArtifacts;
}

function getAllItems() {
  return [...moonArtifacts, ...marsArtifacts];
}

function handleImageError(imgElement, fallbackUrl, expectedPath) {
  if (fallbackUrl && imgElement.src !== fallbackUrl) {
    imgElement.src = fallbackUrl;
    return;
  }
  imgElement.onerror = null;
  const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="100%" height="100%" fill="#0B0C0E"/>
    <rect x="20" y="20" width="560" height="360" fill="none" stroke="#26282E" stroke-width="2"/>
    <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#71717A" font-family="monospace" font-size="14">IMAGE FILE</text>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#E4E4E7" font-family="monospace" font-size="15" font-weight="bold">${expectedPath}</text>
  </svg>`;
  imgElement.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder);
}

// ==========================================
// 1. HERO PLANET SPRING MOTION
// ==========================================
function initHeroPlanetMotion() {
  const heroSection = document.getElementById('top');
  const planetGlobe = document.getElementById('heroPlanetGlobe');
  if (!heroSection || !planetGlobe) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let velX = 0, velY = 0;

  heroSection.addEventListener('pointermove', (event) => {
    const rect = heroSection.getBoundingClientRect();
    const moveX = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const moveY = (event.clientY - rect.top - rect.height / 2) / rect.height;
    targetX = moveX * 42;
    targetY = moveY * 32;
  });

  heroSection.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
  });

  function updateSpring() {
    const stiffness = 0.085;
    const damping = 0.82;
    velX = (velX + (targetX - currentX) * stiffness) * damping;
    velY = (velY + (targetY - currentY) * stiffness) * damping;
    currentX += velX;
    currentY += velY;
    planetGlobe.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
    requestAnimationFrame(updateSpring);
  }
  requestAnimationFrame(updateSpring);
}

// ==========================================
// 2. WORLD SWITCHER (STRICT MOON / MARS ISOLATION)
// ==========================================
function toggleWorld() {
  switchWorld(currentWorld === 'moon' ? 'mars' : 'moon');
}

function switchWorld(world) {
  currentWorld = world;
  document.body.classList.remove('moon', 'mars');
  document.body.classList.add(world);

  // Header Switcher
  document.getElementById('topBtnMoon').className = world === 'moon' ? 'active' : '';
  document.getElementById('topBtnMars').className = world === 'mars' ? 'active' : '';

  // Navigation Links & Page Sections Isolation
  const navWhyLeft = document.getElementById('navWhyLeftLink');
  const navResearch = document.getElementById('navResearchLink');
  const navPersonal = document.getElementById('navPersonalLink');
  const navRecycling = document.getElementById('navRecyclingLink');
  const navBeyond = document.getElementById('navBeyondLink');

  const secWhyLeft = document.getElementById('why-left');
  const secResearch = document.getElementById('research');
  const secCuriosities = document.getElementById('curiosities');
  const secRecycling = document.getElementById('recycling');
  const secBeyond = document.getElementById('beyond');
  const btnExtraPins = document.getElementById('btnExtraPins');

  if (world === 'moon') {
    // Hero strictly about the Moon
    document.getElementById('heroEyebrow').textContent = 'LUNAR SURFACE HERITAGE ARCHIVE • 1967–1972';
    document.getElementById('heroMainTitle').innerHTML = 'Abandoned,<br>But Not Forgotten.';
    document.getElementById('heroDescription').innerHTML = 'The total mass of objects left on the lunar surface by humans is approximately <strong class="text-white font-semibold">187,400 kilograms</strong> — comparable to the weight of <strong class="text-white font-semibold">twenty-two adult elephants</strong>. Explore the landers, rovers, experiments, and personal traces that remain on the Moon after the mission ends.';
    document.getElementById('heroSwitchBtnText').textContent = 'SWITCH TO MARS';
    document.getElementById('heroStat1Val').textContent = '187,400 kg';
    document.getElementById('heroStat1Label').textContent = 'LUNAR SURFACE MASS (≈22 ELEPHANTS)';
    document.getElementById('heroStat2Val').textContent = String(moonArtifacts.length);
    document.getElementById('heroStat2Label').textContent = 'LUNAR MISSION DOSSIERS';
    document.getElementById('heroStat3Val').textContent = '3.8 cm/yr';
    document.getElementById('heroStat3Label').textContent = 'LASER RANGING RECESSION';
    document.getElementById('heroCoordNumbers').textContent = '00°40′ N / 23°28′ E';
    document.getElementById('heroCoordPlace').textContent = 'SEA OF TRANQUILITY';
    document.getElementById('heroArchiveBadge').textContent = 'MOON';

    // Intro Strip & Headings strictly Moon
    document.getElementById('worldIntroText').textContent = 'A landscape that preserves the traces of humanity’s first steps beyond Earth — 187,400 kg of landers, rovers, experiments, and personal keepsakes.';
    document.getElementById('worldIndicatorLabel').textContent = 'ACTIVE ARCHIVE: THE MOON';
    document.getElementById('atlasKicker').textContent = '01 / INTERACTIVE SURFACE ATLAS • THE MOON';
    document.getElementById('atlasTitle').textContent = 'Interactive 2D Map & 3D Lunar Globe';
    document.getElementById('storiesHeading').textContent = 'Objects with a human story.';
    document.getElementById('storiesSubtext').textContent = 'From the first robotic landers to Apollo hardware, each record tells a different story about what a lunar mission leaves behind.';
    document.getElementById('sourcesHeading').textContent = 'Lunar Archive Sources & References';
    document.getElementById('footerBottomLabel').textContent = 'SPACE HERITAGE ARCHIVE · LUNAR SURFACE EDITION';

    // Show Moon sections, hide Mars sections
    secWhyLeft.classList.remove('hidden');
    secResearch.classList.remove('hidden');
    secCuriosities.classList.remove('hidden');
    secRecycling.classList.remove('hidden');
    secBeyond.classList.add('hidden');
    btnExtraPins.classList.remove('hidden');

    navWhyLeft.classList.remove('hidden');
    navResearch.classList.remove('hidden');
    navPersonal.classList.remove('hidden');
    navRecycling.classList.remove('hidden');
    navBeyond.classList.add('hidden');

    selectedMapPinId = 'apollo11-descent';
  } else {
    // Hero strictly about Mars (Zero mention of the Moon)
    document.getElementById('heroEyebrow').textContent = 'MARTIAN SURFACE HERITAGE ARCHIVE • 1976–2024';
    document.getElementById('heroMainTitle').innerHTML = 'Some Missions<br>Never Really Leave.';
    document.getElementById('heroDescription').innerHTML = 'Robotic explorers turned a distant planet into a world we can study up close. Explore the landers, rovers, and aerial pioneers that remain across the surface of <strong class="text-white font-semibold">Mars</strong> after their missions ended.';
    document.getElementById('heroSwitchBtnText').textContent = 'SWITCH TO THE MOON';
    document.getElementById('heroStat1Val').textContent = String(marsArtifacts.length);
    document.getElementById('heroStat1Label').textContent = 'MARS SURFACE MISSIONS';
    document.getElementById('heroStat2Val').textContent = '72 Flights';
    document.getElementById('heroStat2Label').textContent = 'INGENUITY AERIAL RECORD';
    document.getElementById('heroStat3Val').textContent = '1976—2024';
    document.getElementById('heroStat3Label').textContent = 'YEARS OF MARS EXPLORATION';
    document.getElementById('heroCoordNumbers').textContent = '18° N / 77° E';
    document.getElementById('heroCoordPlace').textContent = 'JEZERO CRATER';
    document.getElementById('heroArchiveBadge').textContent = 'MARS';

    // Intro Strip & Headings strictly Mars
    document.getElementById('worldIntroText').textContent = 'Robotic explorers that turned a distant world into a place we can study up close — from Viking 1 and Sojourner to Spirit, Opportunity, InSight, and Ingenuity.';
    document.getElementById('worldIndicatorLabel').textContent = 'ACTIVE ARCHIVE: MARS';
    document.getElementById('atlasKicker').textContent = '01 / INTERACTIVE SURFACE ATLAS • MARS';
    document.getElementById('atlasTitle').textContent = 'Interactive 2D Map & 3D Mars Globe';
    document.getElementById('storiesHeading').textContent = 'Robotic pioneers, lasting traces.';
    document.getElementById('storiesSubtext').textContent = 'A generation of landers, rovers and flight technology expanded our view of Mars. These records follow their journeys and mission endings.';
    document.getElementById('sourcesHeading').textContent = 'Mars Archive Sources & References';
    document.getElementById('footerBottomLabel').textContent = 'SPACE HERITAGE ARCHIVE · MARTIAN SURFACE EDITION';

    // Hide all Moon sections, show Mars sections
    secWhyLeft.classList.add('hidden');
    secResearch.classList.add('hidden');
    secCuriosities.classList.add('hidden');
    secRecycling.classList.add('hidden');
    secBeyond.classList.remove('hidden');
    btnExtraPins.classList.add('hidden');

    navWhyLeft.classList.add('hidden');
    navResearch.classList.add('hidden');
    navPersonal.classList.add('hidden');
    navRecycling.classList.add('hidden');
    navBeyond.classList.remove('hidden');

    selectedMapPinId = 'pathfinder';
  }

  document.getElementById('searchInput').value = '';
  populateCategorySelect();

  setPlanetaryTileLayer('primary');
  render2DMapMarkers();
  resetPlanetaryMapView();
  renderQuickPinButtons();
  renderMapTelemetry();
  renderCards();
  renderAllSources();

  if (threeInitialized) {
    update3DGlobeWorldTexture();
    rebuild3DPinElements();
    const firstItem = getActiveWorldItems().find(i => i.id === selectedMapPinId);
    if (firstItem) focus3DGlobeOnLatLng(firstItem.lat, firstItem.lng);
  }
}

function populateCategorySelect() {
  const select = document.getElementById('categoryFilter');
  const items = getActiveWorldItems();
  const categories = [...new Set(items.map(i => i.category))];
  select.innerHTML = `<option value="all">All Categories (${items.length})</option>` +
    categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ==========================================
// 3. VISUAL LASER RETROREFLECTOR EXPERIMENT
// ==========================================
function toggleLaserExperiment() {
  laserFired = !laserFired;
  const screen = document.getElementById('laserScreenBox');
  const btnLabel = document.getElementById('fireLaserBtnLabel');
  const title = document.getElementById('laserReadoutTitle');
  const sub = document.getElementById('laserReadoutSub');

  if (laserFired) {
    screen.classList.add('fired');
    btnLabel.textContent = 'RESET EXPERIMENT';
    title.textContent = 'PULSE RETURNED (~2.56 SEC)';
    sub.textContent = 'Signal path illustrated · reflected pulse confirms 3.8 cm/yr lunar recession';
  } else {
    screen.classList.remove('fired');
    btnLabel.textContent = 'SEND A LASER PULSE';
    title.textContent = 'STANDBY';
    sub.textContent = 'Awaiting command · reflector target locked (0.67337° N, 23.47293° E)';
  }
}

// ==========================================
// 4. 2D MAP / 3D GLOBE MODE SWITCHER
// ==========================================
function switchMapMode(mode) {
  currentMapMode = mode;
  const view2D = document.getElementById('view2DContainer');
  const view3D = document.getElementById('view3DContainer');
  const btn2D = document.getElementById('btnMode2D');
  const btn3D = document.getElementById('btnMode3D');
  const layer2DBtns = document.getElementById('map2DLayerButtons');
  const layer3DBtns = document.getElementById('map3DLayerButtons');

  if (mode === '2d') {
    view2D.classList.remove('hidden');
    view3D.classList.add('hidden');
    layer2DBtns.classList.remove('hidden');
    layer3DBtns.classList.add('hidden');
    layer3DBtns.classList.remove('flex');
    btn2D.className = "px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider bg-white text-black transition";
    btn3D.className = "px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider bg-nasaCard border border-nasaBorder text-zinc-300 hover:border-zinc-500 hover:text-white transition";
    if (planetaryMap) {
      setTimeout(() => planetaryMap.invalidateSize(), 100);
    }
  } else {
    view2D.classList.add('hidden');
    view3D.classList.remove('hidden');
    layer2DBtns.classList.add('hidden');
    layer3DBtns.classList.remove('hidden');
    layer3DBtns.classList.add('flex');
    btn3D.className = "px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider bg-white text-black transition";
    btn2D.className = "px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider bg-nasaCard border border-nasaBorder text-zinc-300 hover:border-zinc-500 hover:text-white transition";

    if (!threeInitialized) {
      initPlanetary3DGlobe();
    } else {
      update3DGlobeWorldTexture();
      rebuild3DPinElements();
      resize3DGlobe();
    }
    const currentItem = getActiveWorldItems().find(i => i.id === selectedMapPinId);
    if (currentItem) focus3DGlobeOnLatLng(currentItem.lat, currentItem.lng);
  }
}

// ==========================================
// 5. 3D PLANETARY GLOBE (MOON & MARS IN THREE.JS)
// ==========================================
function createProceduralPlanetTexture(world) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (world === 'moon') {
    ctx.fillStyle = '#8b919b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const maria = [
      { x: 430, y: 240, r: 95, a: 0.32 },
      { x: 580, y: 230, r: 70, a: 0.30 },
      { x: 640, y: 210, r: 55, a: 0.28 },
      { x: 490, y: 170, r: 65, a: 0.26 },
      { x: 360, y: 270, r: 85, a: 0.25 }
    ];
    maria.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, 10, m.x, m.y, m.r);
      grad.addColorStop(0, `rgba(45, 50, 60, ${m.a})`);
      grad.addColorStop(1, 'rgba(45, 50, 60, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#c87d65');
    bgGrad.addColorStop(0.5, '#b85d43');
    bgGrad.addColorStop(1, '#964734');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return new THREE.CanvasTexture(canvas);
}

function latLngToVector3(lat, lng, radius = GLOBE_RADIUS) {
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  const x = radius * Math.cos(latRad) * Math.sin(lngRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lngRad);
  return new THREE.Vector3(x, y, z);
}

function initPlanetary3DGlobe() {
  threeInitialized = true;
  const container = document.getElementById('planetaryGlobe3DCanvas');
  const width = container.clientWidth || 760;
  const height = container.clientHeight || 480;

  scene3D = new THREE.Scene();
  camera3D = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
  camera3D.position.set(0, 0, cameraDistance3D);

  renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer3D.setSize(width, height);
  renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer3D.domElement);

  const ambientLight = new THREE.AmbientLight(0x99aabb, 0.68);
  scene3D.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
  sunLight.position.set(14, 6, 12);
  scene3D.add(sunLight);

  const starsGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 1000; i++) {
    starPositions.push(
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 160,
      (Math.random() - 0.5) * 160 - 20
    );
  }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starsMat = new THREE.PointsMaterial({ color: 0x71717a, size: 0.2 });
  scene3D.add(new THREE.Points(starsGeo, starsMat));

  planetGroup = new THREE.Group();
  scene3D.add(planetGroup);

  const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    metalness: 0.04
  });

  planetMesh = new THREE.Mesh(sphereGeo, sphereMat);
  planetMesh.rotation.y = -Math.PI / 2;
  planetGroup.add(planetMesh);

  const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.03, 24, 18);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  wireframeMesh = new THREE.Mesh(wireGeo, wireMat);
  wireframeMesh.visible = showGrid3D;
  planetGroup.add(wireframeMesh);

  update3DGlobeWorldTexture();

  const domElem = renderer3D.domElement;

  domElem.addEventListener('pointerdown', (e) => {
    isDragging3D = true;
    autoRotate3D = false;
    updateAutoRotateBtnUI();
    prevMouse3D = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging3D) return;
    const dx = e.clientX - prevMouse3D.x;
    const dy = e.clientY - prevMouse3D.y;
    targetRotation3D.y += dx * 0.0065;
    targetRotation3D.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, targetRotation3D.x + dy * 0.0065));
    prevMouse3D = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointerup', () => {
    isDragging3D = false;
  });

  domElem.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraDistance3D = Math.max(7.2, Math.min(20, cameraDistance3D + e.deltaY * 0.006));
  }, { passive: false });

  window.addEventListener('resize', resize3DGlobe);

  rebuild3DPinElements();
  animate3DGlobe();
}

function update3DGlobeWorldTexture() {
  if (!planetMesh) return;
  const mat = planetMesh.material;
  const procedural = createProceduralPlanetTexture(currentWorld);
  mat.map = procedural;
  mat.bumpMap = procedural;
  mat.bumpScale = 0.06;
  mat.needsUpdate = true;

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  if (currentWorld === 'moon') {
    const applyMoon = (tex) => {
      cachedTextures.moon = tex;
      if (currentWorld === 'moon') {
        mat.map = tex;
        mat.bumpMap = tex;
        mat.bumpScale = 0.08;
        mat.needsUpdate = true;
      }
    };
    if (cachedTextures.moon) {
      applyMoon(cachedTextures.moon);
    } else {
      loader.load(
        'img/moon-texture.jpg',
        applyMoon,
        undefined,
        () => loader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/moon_1024.jpg', applyMoon)
      );
    }
  } else {
    const applyMars = (tex) => {
      cachedTextures.mars = tex;
      if (currentWorld === 'mars') {
        mat.map = tex;
        mat.bumpMap = tex;
        mat.bumpScale = 0.08;
        mat.needsUpdate = true;
      }
    };
    if (cachedTextures.mars) {
      applyMars(cachedTextures.mars);
    } else {
      loader.load(
        'img/mars-texture.jpg',
        applyMars,
        undefined,
        () => loader.load('https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg', applyMars)
      );
    }
  }
}

function rebuild3DPinElements() {
  const overlay = document.getElementById('globe3DPinsOverlay');
  if (!overlay) return;
  overlay.innerHTML = '';
  pinElements3D = [];

  const activeItems = getActiveWorldItems();

  activeItems.forEach(item => {
    const el = document.createElement('button');
    el.className = "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center group focus:outline-none transition-opacity duration-150";
    el.onclick = () => selectMapPin(item.id, true);
    el.dataset.id = item.id;
    el.innerHTML = `
      <span class="pin-dot w-3 h-3 rounded-full border-2 bg-white border-black shadow block transition"></span>
      <span class="pin-label ml-1.5 px-2 py-0.5 bg-black/90 border border-zinc-700 font-mono text-[10px] text-white whitespace-nowrap">
        ${item.name.split(' ')[0]}
      </span>
    `;
    overlay.appendChild(el);
    pinElements3D.push({
      el,
      id: item.id,
      isExtra: false,
      localPos: latLngToVector3(item.lat, item.lng, GLOBE_RADIUS + 0.06)
    });
  });

  if (currentWorld === 'moon' && showExtraCatalog) {
    extraCatalogPoints.forEach(pt => {
      const el = document.createElement('div');
      el.className = "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex items-center";
      el.title = `${pt.name} (${pt.coords})`;
      el.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-zinc-300 border border-black block"></span>
        <span class="ml-1 px-1.5 py-0.5 bg-black/85 border border-zinc-700 text-zinc-300 font-mono text-[9px] whitespace-nowrap">
          ${pt.name}
        </span>
      `;
      overlay.appendChild(el);
      pinElements3D.push({
        el,
        id: null,
        isExtra: true,
        localPos: latLngToVector3(pt.lat, pt.lng, GLOBE_RADIUS + 0.06)
      });
    });
  }

  highlightSelected3DPin();
}

// NASA RED (#E4002B) ON SELECTED 3D PIN
function highlightSelected3DPin() {
  pinElements3D.forEach(p => {
    if (p.isExtra) return;
    const isSel = p.id === selectedMapPinId;
    const dot = p.el.querySelector('.pin-dot');
    const lbl = p.el.querySelector('.pin-label');
    if (dot && lbl) {
      dot.className = isSel
        ? "pin-dot w-3.5 h-3.5 rounded-full border-2 bg-[#E4002B] border-white scale-125 shadow-[0_0_12px_#E4002B] block"
        : "pin-dot w-3 h-3 rounded-full border-2 bg-zinc-300 border-black block";
      lbl.className = isSel
        ? "pin-label ml-2 px-2 py-0.5 bg-[#E4002B] text-white font-mono text-[10px] font-bold whitespace-nowrap shadow"
        : "pin-label ml-1.5 px-2 py-0.5 bg-black/90 border border-zinc-700 font-mono text-[10px] text-zinc-200 whitespace-nowrap";
    }
  });
}

function focus3DGlobeOnLatLng(lat, lng) {
  autoRotate3D = false;
  updateAutoRotateBtnUI();
  targetRotation3D.y = -lng * (Math.PI / 180);
  targetRotation3D.x = lat * (Math.PI / 180);
}

function toggle3DAutoRotate() {
  autoRotate3D = !autoRotate3D;
  updateAutoRotateBtnUI();
}

function updateAutoRotateBtnUI() {
  const btn = document.getElementById('btn3DAutoRotate');
  if (!btn) return;
  btn.className = autoRotate3D
    ? "px-3 py-1.5 bg-white text-black font-mono text-xs font-medium"
    : "px-3 py-1.5 bg-black border border-nasaBorder text-zinc-400 hover:text-white font-mono text-xs";
  btn.textContent = autoRotate3D ? "Auto-Rotate: ON" : "Auto-Rotate: OFF";
}

function toggle3DGrid() {
  showGrid3D = !showGrid3D;
  if (wireframeMesh) wireframeMesh.visible = showGrid3D;
  const btn = document.getElementById('btn3DWireframe');
  if (btn) {
    btn.className = showGrid3D
      ? "px-3 py-1.5 bg-white text-black font-mono text-xs font-medium"
      : "px-3 py-1.5 bg-black border border-nasaBorder text-zinc-300 hover:text-white font-mono text-xs";
  }
}

function resize3DGlobe() {
  if (!renderer3D || !camera3D) return;
  const container = document.getElementById('planetaryGlobe3DCanvas');
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w > 0 && h > 0) {
    camera3D.aspect = w / h;
    camera3D.updateProjectionMatrix();
    renderer3D.setSize(w, h);
  }
}

function animate3DGlobe() {
  requestAnimationFrame(animate3DGlobe);
  if (currentMapMode !== '3d' || !renderer3D) return;

  if (autoRotate3D && !isDragging3D) {
    targetRotation3D.y += 0.0018;
  }

  currentRotation3D.x += (targetRotation3D.x - currentRotation3D.x) * 0.08;
  currentRotation3D.y += (targetRotation3D.y - currentRotation3D.y) * 0.08;
  camera3D.position.z += (cameraDistance3D - camera3D.position.z) * 0.1;

  planetGroup.rotation.x = currentRotation3D.x;
  planetGroup.rotation.y = currentRotation3D.y;

  renderer3D.render(scene3D, camera3D);

  const container = document.getElementById('planetaryGlobe3DCanvas');
  const width = container.clientWidth;
  const height = container.clientHeight;

  pinElements3D.forEach(p => {
    const worldPos = p.localPos.clone().applyEuler(planetGroup.rotation);
    if (worldPos.z > 0.75) {
      const projected = worldPos.clone().project(camera3D);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      p.el.style.left = `${x}px`;
      p.el.style.top = `${y}px`;
      p.el.style.opacity = '1';
      p.el.style.pointerEvents = 'auto';
    } else {
      p.el.style.opacity = '0';
      p.el.style.pointerEvents = 'none';
    }
  });
}

// ==========================================
// 6. 2D INTERACTIVE MAP (MOON & MARS IN LEAFLET)
// ==========================================
function initPlanetary2DMap() {
  planetaryMap = L.map('planetaryMap2D', {
    center: [5, 5],
    zoom: 2,
    minZoom: 2,
    maxZoom: 7,
    maxBounds: PLANETARY_MAP_BOUNDS,
    maxBoundsViscosity: 1.0,
    worldCopyJump: false
  });

  setPlanetaryTileLayer('primary');

  mainMarkersLayer = L.layerGroup().addTo(planetaryMap);
  extraMarkersLayer = L.layerGroup().addTo(planetaryMap);

  render2DMapMarkers();
}

function setPlanetaryTileLayer(style) {
  currentTileStyle = style;
  if (!planetaryMap) return;
  if (currentTileLayer) {
    planetaryMap.removeLayer(currentTileLayer);
  }

  if (currentWorld === 'moon') {
    if (style === 'primary') {
      currentTileLayer = L.tileLayer(
        'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
        {
          minZoom: 2,
          maxZoom: 7,
          noWrap: true,
          bounds: PLANETARY_MAP_BOUNDS,
          attribution: 'NASA / GSFC / Arizona State University · LROC'
        }
      ).addTo(planetaryMap);
    } else {
      currentTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          minZoom: 2,
          maxZoom: 7,
          noWrap: true,
          bounds: PLANETARY_MAP_BOUNDS,
          attribution: 'NASA Moon Trek / LRO WAC Mosaic'
        }
      ).addTo(planetaryMap);
    }
  } else {
    if (style === 'primary') {
      currentTileLayer = L.tileLayer(
        'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
        {
          minZoom: 2,
          maxZoom: 7,
          noWrap: true,
          bounds: PLANETARY_MAP_BOUNDS,
          attribution: 'NASA / MOLA Science Team · OpenPlanetaryMap Mars'
        }
      ).addTo(planetaryMap);
    } else {
      currentTileLayer = L.tileLayer(
        'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
        {
          minZoom: 2,
          maxZoom: 7,
          noWrap: true,
          bounds: PLANETARY_MAP_BOUNDS,
          attribution: 'NASA Mars Trek / Viking MDIM21 Mosaic'
        }
      ).addTo(planetaryMap);
    }
  }

  const btnPrimary = document.getElementById('btnTilePrimary');
  const btnSecondary = document.getElementById('btnTileSecondary');
  if (btnPrimary && btnSecondary) {
    btnPrimary.className = style === 'primary'
      ? "px-3 py-1.5 bg-white text-black font-mono text-xs font-medium"
      : "px-3 py-1.5 bg-black border border-nasaBorder text-zinc-400 hover:text-white font-mono text-xs";
    btnSecondary.className = style === 'secondary'
      ? "px-3 py-1.5 bg-white text-black font-mono text-xs font-medium"
      : "px-3 py-1.5 bg-black border border-nasaBorder text-zinc-400 hover:text-white font-mono text-xs";
  }
}

// NASA RED (#E4002B) ON SELECTED 2D MAP PIN
function render2DMapMarkers() {
  if (!planetaryMap) return;
  mainMarkersLayer.clearLayers();
  extraMarkersLayer.clearLayers();

  const wrapOffsets = [-360, 0, 360];
  const activeItems = getActiveWorldItems();

  activeItems.forEach((item, idx) => {
    const isSelected = item.id === selectedMapPinId;

    const icon = L.divIcon({
      className: 'custom-planetary-pin',
      html: `
        <div class="relative flex items-center group cursor-pointer">
          <span class="w-4 h-4 rounded-full border-2 ${isSelected ? 'bg-[#E4002B] border-white scale-125 text-white shadow-[0_0_12px_#E4002B]' : 'bg-zinc-200 border-black text-black'} flex items-center justify-center font-mono text-[8px] font-bold transition">
            ${String(idx + 1).padStart(2, '0')}
          </span>
          <span class="ml-2 px-2 py-0.5 ${isSelected ? 'bg-[#E4002B] text-white font-bold' : 'bg-black/90 border border-zinc-700 text-zinc-100'} font-mono text-[10px] whitespace-nowrap shadow">
            ${item.name}
          </span>
        </div>
      `,
      iconSize: [140, 24],
      iconAnchor: [8, 12]
    });

    wrapOffsets.forEach(offset => {
      const marker = L.marker([item.lat, item.lng + offset], { icon }).addTo(mainMarkersLayer);

      marker.bindPopup(`
        <div class="font-sans text-white p-1 min-w-[210px]">
          <div class="font-mono text-[10px] text-zinc-400 uppercase">${item.mission} • ${item.year}</div>
          <div class="font-bold text-sm mt-0.5">${item.name}</div>
          <div class="font-mono text-[11px] text-zinc-300 mt-1">${item.coordinates}</div>
          <button onclick="openModal('${item.id}')" class="mt-2.5 w-full py-1.5 px-3 bg-[#E4002B] text-white font-mono text-[11px] font-bold uppercase hover:bg-red-700 transition">
            Open Mission Dossier →
          </button>
        </div>
      `);

      marker.on('click', () => {
        selectMapPin(item.id, false);
      });
    });
  });

  if (currentWorld === 'moon' && showExtraCatalog) {
    extraCatalogPoints.forEach(pt => {
      const extraIcon = L.divIcon({
        className: 'custom-extra-pin',
        html: `
          <div class="flex items-center">
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-400 border border-black block"></span>
            <span class="ml-1.5 px-1.5 py-0.5 bg-black/90 border border-zinc-700 text-zinc-300 font-mono text-[10px] whitespace-nowrap">
              ${pt.name}
            </span>
          </div>
        `,
        iconSize: [110, 20],
        iconAnchor: [5, 10]
      });

      wrapOffsets.forEach(offset => {
        const m = L.marker([pt.lat, pt.lng + offset], { icon: extraIcon }).addTo(extraMarkersLayer);
        m.bindPopup(`
          <div class="font-sans text-white p-1">
            <div class="font-mono text-[10px] text-zinc-400 uppercase">${pt.group}</div>
            <div class="font-bold text-sm mt-0.5">${pt.name}</div>
            <div class="font-mono text-xs text-zinc-300 mt-1">Coordinates: ${pt.coords}</div>
          </div>
        `);
      });
    });
  }
}

function toggleExtraCatalogPins() {
  showExtraCatalog = !showExtraCatalog;
  const btn = document.getElementById('btnExtraPins');
  btn.className = showExtraCatalog
    ? "px-3 py-1.5 bg-white text-black font-mono text-xs font-medium transition"
    : "px-3 py-1.5 bg-black border border-nasaBorder text-zinc-300 hover:border-zinc-500 hover:text-white font-mono text-xs transition";
  btn.textContent = showExtraCatalog
    ? "✓ Additional PDF Catalogue Sites"
    : "+ Additional PDF Catalogue Sites (USSR, USA, ESA)";
  render2DMapMarkers();
  if (threeInitialized) rebuild3DPinElements();
}

function resetPlanetaryMapView() {
  if (currentMapMode === '2d' && planetaryMap) {
    planetaryMap.setView([5, 5], 2, { animate: true });
  } else {
    cameraDistance3D = 12.5;
    targetRotation3D = { x: 0.05, y: 0.1 };
  }
}

function selectMapPin(id, flyToPin = true) {
  selectedMapPinId = id;
  render2DMapMarkers();
  renderMapTelemetry();
  renderQuickPinButtons();
  if (threeInitialized) highlightSelected3DPin();

  const item = getActiveWorldItems().find(i => i.id === id);
  if (item && flyToPin) {
    if (currentMapMode === '2d' && planetaryMap) {
      planetaryMap.flyTo([item.lat, item.lng], Math.max(planetaryMap.getZoom(), 3), {
        duration: 0.8
      });
    } else if (currentMapMode === '3d') {
      focus3DGlobeOnLatLng(item.lat, item.lng);
    }
  }
}

// NASA RED (#E4002B) ON ACTIVE QUICK SELECTOR BUTTON
function renderQuickPinButtons() {
  const bar = document.getElementById('quickPinSelector');
  if (!bar) return;
  const activeItems = getActiveWorldItems();
  bar.innerHTML = activeItems.map(item => {
    const active = item.id === selectedMapPinId;
    return `
      <button onclick="selectMapPin('${item.id}', true)" class="px-2.5 py-1 font-mono text-[11px] border transition ${
        active
          ? 'bg-[#E4002B] border-[#E4002B] text-white font-semibold'
          : 'bg-black border-nasaBorder text-zinc-400 hover:text-white hover:border-zinc-600'
      }">
        ${item.name.split(' ')[0]}
      </button>
    `;
  }).join('');
}

function renderMapTelemetry() {
  const item = getActiveWorldItems().find(i => i.id === selectedMapPinId) || getActiveWorldItems()[0];
  const panel = document.getElementById('mapTelemetryPanel');
  if (!item) return;

  panel.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between border-b border-nasaBorder pb-3">
        <span class="font-mono text-xs uppercase text-zinc-300">SELECTED RECORD // ${item.year}</span>
        <span class="font-mono text-xs text-zinc-400">${item.type}</span>
      </div>

      <div class="relative h-40 overflow-hidden border border-nasaBorder bg-black">
        <img src="${item.image}" alt="${item.name}" onerror="handleImageError(this, '${item.fallbackImage || ''}', '${item.image}')" class="w-full h-full object-cover">
        <span class="absolute bottom-2 left-2.5 px-2 py-0.5 bg-black/85 font-mono text-[10px] text-zinc-300">${item.imageCredit || 'NASA Archive'}</span>
      </div>

      <div>
        <span class="font-mono text-[11px] text-zinc-400 uppercase block">${item.locationName}</span>
        <h3 class="text-xl font-bold text-white mt-0.5">${item.name}</h3>
      </div>

      <div class="grid grid-cols-2 gap-2.5 font-mono text-xs">
        <div class="p-3 bg-black border border-nasaBorder">
          <span class="text-zinc-500 block text-[10px]">COORDINATES</span>
          <span class="text-zinc-200 mt-0.5 block">${item.coordinates}</span>
        </div>
        <div class="p-3 bg-black border border-nasaBorder">
          <span class="text-zinc-500 block text-[10px]">STATUS</span>
          <span class="text-zinc-200 mt-0.5 block">${item.heritageStatus}</span>
        </div>
      </div>

      <p class="text-sm text-zinc-300 leading-relaxed">${item.shortDesc}</p>

      <div class="pt-1">
        <button onclick="openModal('${item.id}')" class="w-full py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition">
          Open Mission Dossier ↗
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 7. MISSION DOSSIERS & CARDS (SHARP EDGES)
// ==========================================
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  const category = document.getElementById('categoryFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();
  const activeItems = getActiveWorldItems();

  const filtered = activeItems.filter(item => {
    const matchCategory = category === 'all' || item.category === category;
    const matchSearch = item.name.toLowerCase().includes(search) || 
                        item.mission.toLowerCase().includes(search) || 
                        item.locationName.toLowerCase().includes(search) ||
                        item.story.toLowerCase().includes(search);
    return matchCategory && matchSearch;
  });

  grid.innerHTML = filtered.map((item, idx) => {
    const isRecycled = selectedForRecycling.has(item.id);
    const hasRecycle = item.world === 'moon' && item.materials;

    return `
      <article class="group bg-nasaCard border border-nasaBorder hover:border-zinc-500 transition flex flex-col justify-between overflow-hidden">
        <div>
          <div class="relative h-52 overflow-hidden bg-black border-b border-nasaBorder">
            <img src="${item.image}" alt="${item.name}" onerror="handleImageError(this, '${item.fallbackImage || ''}', '${item.image}')" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span class="font-mono text-[11px] px-2.5 py-1 bg-black/85 text-white border border-zinc-700">
                ${String(idx + 1).padStart(2, '0')} • ${item.year}
              </span>
              <span class="font-mono text-[11px] px-2.5 py-1 bg-black/85 text-zinc-300 border border-zinc-700">
                ${item.type}
              </span>
            </div>
            <span class="absolute bottom-2 left-3 font-mono text-[10px] text-zinc-300 bg-black/80 px-2 py-0.5">${item.imageCredit || 'NASA'}</span>
          </div>

          <div class="p-6">
            <span class="font-mono text-[11px] text-zinc-400 uppercase tracking-wider block">${item.locationName}</span>
            <h3 class="text-xl font-bold text-white mt-1.5 leading-snug">${item.name}</h3>
            <p class="text-sm text-zinc-400 mt-3 leading-relaxed">
              ${item.shortDesc}
            </p>
          </div>
        </div>

        <div class="px-6 pb-6 pt-4 border-t border-nasaBorder flex items-center justify-between gap-2">
          <button onclick="openModal('${item.id}')" class="text-xs font-mono font-semibold uppercase tracking-wider px-4 py-2 bg-white hover:bg-zinc-200 text-black transition">
            Read Dossier ↗
          </button>

          ${hasRecycle ? `
            <button onclick="toggleRecycle('${item.id}')" class="text-xs font-mono px-3 py-2 border transition ${
              isRecycled 
                ? 'border-nasaRed bg-nasaRed text-white' 
                : 'border-nasaBorder text-zinc-400 hover:text-white hover:border-zinc-500'
            }">
              ${isRecycled ? '✓ In Recycling' : '+ Recycle'}
            </button>
          ` : `
            <a href="${item.url}" target="_blank" rel="noreferrer" class="text-xs font-mono text-zinc-400 hover:text-white underline">
              NASA Source ↗
            </a>
          `}
        </div>
      </article>
    `;
  }).join('');
}

// ==========================================
// 8. PERSONAL ARTIFACTS, BEYOND MARS & FILTERED SOURCES
// ==========================================
function renderPersonalArtifacts() {
  const grid = document.getElementById('personalArtifactsGrid');
  if (!grid) return;
  grid.innerHTML = personalArtifactsData.map(item => `
    <div class="group bg-nasaCard border border-nasaBorder hover:border-zinc-500 transition overflow-hidden flex flex-col justify-between">
      <div>
        <div class="relative h-52 overflow-hidden bg-black border-b border-nasaBorder">
          <img src="${item.image}" alt="${item.title}" onerror="handleImageError(this, '${item.fallbackImage || ''}', '${item.image}')" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
          <div class="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono">
            <span class="px-2.5 py-1 bg-black/85 text-white border border-zinc-700">${item.mission}</span>
            <span class="px-2.5 py-1 bg-black/85 text-zinc-300 border border-zinc-700">${item.category}</span>
          </div>
        </div>

        <div class="p-6">
          <h3 class="text-lg font-bold text-white leading-snug">${item.title}</h3>
          <p class="text-sm text-zinc-400 mt-2.5 leading-relaxed">${item.desc}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function renderBeyondMars() {
  const grid = document.getElementById('beyondMarsGrid');
  if (!grid) return;
  grid.innerHTML = beyondMarsData.map((item, idx) => `
    <a href="${item.url}" target="_blank" rel="noreferrer" class="p-6 bg-nasaCard border border-nasaBorder hover:border-zinc-400 transition flex flex-col justify-between space-y-4">
      <div>
        <span class="font-mono text-xs text-zinc-400">0${idx + 1} / ${item.year}</span>
        <h3 class="text-xl font-bold text-white mt-2">${item.name}</h3>
        <span class="font-mono text-xs text-zinc-400 block mt-0.5">${item.destination}</span>
        <p class="text-sm text-zinc-300 mt-3 leading-relaxed">${item.summary}</p>
        <p class="text-xs text-zinc-500 mt-2 font-mono">${item.note}</p>
      </div>
      <span class="font-mono text-xs text-white uppercase tracking-wider pt-3 border-t border-nasaBorder block">
        NASA MISSION PAGE ↗
      </span>
    </a>
  `).join('');
}

function renderAllSources() {
  const grid = document.getElementById('sourcesListGrid');
  if (!grid) return;
  const filteredSources = projectSourcesData.filter(src => src.world === currentWorld);
  grid.innerHTML = filteredSources.map(src => `
    <a href="${src.url}" target="_blank" rel="noreferrer" class="p-3.5 bg-nasaCard border border-nasaBorder hover:border-zinc-500 transition flex flex-col justify-between gap-1">
      <span class="font-mono text-[10px] uppercase tracking-wider text-zinc-500">${src.group}</span>
      <span class="text-xs font-medium text-zinc-200 hover:text-white underline underline-offset-4">${src.title} ↗</span>
    </a>
  `).join('');
}

// ==========================================
// 9. MODAL DOSSIER WINDOW (SHARP EDGES)
// ==========================================
function openModal(id) {
  activeModalItem = getAllItems().find(i => i.id === id);
  if (!activeModalItem) return;

  document.getElementById('modalMeta').textContent = `${activeModalItem.locationName} • ${activeModalItem.mission} (${activeModalItem.year})`;
  document.getElementById('modalTitle').textContent = activeModalItem.name;
  document.getElementById('modalCoords').textContent = `COORDINATES: ${activeModalItem.coordinates}`;
  document.getElementById('modalStatusBadge').textContent = activeModalItem.heritageStatus;

  switchModalTab('story');
  const modal = document.getElementById('artifactModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function switchModalTab(tab) {
  activeModalTab = tab;

  ['story', 'inventory', 'condition', 'specs'].forEach(t => {
    const btn = document.getElementById(`tab-${t}`);
    btn.className = (t === tab)
      ? "pb-3 border-b-2 border-nasaRed text-white font-semibold"
      : "pb-3 border-b-2 border-transparent text-zinc-400 hover:text-white";
  });

  const body = document.getElementById('modalBody');
  const isMoon = Boolean(activeModalItem.materials);

  if (tab === 'story') {
    body.innerHTML = `
      <div class="space-y-4">
        <img src="${activeModalItem.image}" alt="${activeModalItem.name}" onerror="handleImageError(this, '${activeModalItem.fallbackImage || ''}', '${activeModalItem.image}')" class="w-full h-60 object-cover border border-nasaBorder">
        <p class="text-base leading-relaxed text-zinc-200">${activeModalItem.story}</p>
        <div class="pt-2">
          <a href="${activeModalItem.url || 'https://science.nasa.gov/'}" target="_blank" rel="noreferrer" class="inline-block font-mono text-xs text-white underline underline-offset-4">
            OPEN PRIMARY NASA SOURCE (${activeModalItem.source}) ↗
          </a>
        </div>
      </div>
    `;
  } else if (tab === 'inventory') {
    body.innerHTML = `
      <div class="space-y-3">
        <span class="font-mono text-xs text-zinc-400 uppercase block">
          ${isMoon ? 'Equipment Manifest (Catalogue of Manmade Material on the Moon):' : 'Mission Highlights (NASA Science):'}
        </span>
        <ul class="space-y-2 text-sm text-zinc-200">
          ${activeModalItem.inventoryList.map((line, i) => `
            <li class="p-3 bg-black border border-nasaBorder flex items-start gap-3">
              <span class="text-nasaRed font-mono text-xs">${String(i + 1).padStart(2, '0')}</span>
              <span>${line}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  } else if (tab === 'condition') {
    if (isMoon && activeModalItem.degradation) {
      body.innerHTML = `
        <div class="space-y-4">
          <p class="text-sm text-zinc-300">${activeModalItem.conditionToday}</p>
          <div class="p-5 bg-black border border-nasaBorder space-y-3">
            <div class="flex justify-between font-mono text-xs text-zinc-300">
              <span>SURFACE EXPOSURE TIMELINE:</span>
              <span id="timeStageLabel" class="text-white font-semibold">PRESENT DAY (2026)</span>
            </div>
            <input id="timeSlider" type="range" min="0" max="2" step="1" value="1" 
              oninput="updateTimeSimulation(this.value)"
              class="w-full accent-[#E4002B] cursor-pointer">
            <div class="flex justify-between font-mono text-[11px] text-zinc-500">
              <span>Landing Day (${activeModalItem.year})</span>
              <span>Present Day (2026)</span>
              <span>+100 Years in Vacuum</span>
            </div>
            <p id="timeStageDesc" class="text-sm text-zinc-200 pt-3 border-t border-nasaBorder">
              ${activeModalItem.degradation.now}
            </p>
          </div>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="p-5 bg-black border border-nasaBorder space-y-2">
          <span class="font-mono text-xs text-zinc-400 uppercase block">Mission Status</span>
          <p class="text-base text-zinc-200 leading-relaxed">${activeModalItem.conditionToday}</p>
        </div>
      `;
    }
  } else if (tab === 'specs') {
    if (isMoon) {
      body.innerHTML = `
        <div class="grid grid-cols-2 gap-4 font-mono text-sm">
          <div class="p-4 bg-black border border-nasaBorder">Total Dry Mass: <strong class="text-white block text-lg mt-1">${activeModalItem.massKg.toLocaleString('en-US')} kg</strong></div>
          <div class="p-4 bg-black border border-nasaBorder">Aluminum Alloys: <strong class="text-white block text-lg mt-1">${activeModalItem.materials.aluminum.toLocaleString('en-US')} kg</strong></div>
          <div class="p-4 bg-black border border-nasaBorder">Titanium & Steel: <strong class="text-white block text-lg mt-1">${activeModalItem.materials.titanium.toLocaleString('en-US')} kg</strong></div>
          <div class="p-4 bg-black border border-nasaBorder">Electronics & Copper: <strong class="text-white block text-lg mt-1">${activeModalItem.materials.electronics.toLocaleString('en-US')} kg</strong></div>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="p-5 bg-black border border-nasaBorder space-y-2">
          <div class="text-2xl font-mono text-zinc-400">—</div>
          <h4 class="text-base font-bold text-white">No material breakdown in the linked NASA summary</h4>
          <p class="text-sm text-zinc-300 leading-relaxed">
            The provided NASA mission page supports the mission history and outcomes, but does not give a verified abandoned-material mass breakdown for this record. No estimate has been invented.
          </p>
        </div>
      `;
    }
  }
}

function updateTimeSimulation(stage) {
  const label = document.getElementById('timeStageLabel');
  const desc = document.getElementById('timeStageDesc');

  if (stage === "0") {
    label.textContent = `LANDING DAY (${activeModalItem.year})`;
    desc.textContent = activeModalItem.degradation.day1;
  } else if (stage === "1") {
    label.textContent = "PRESENT DAY (2026)";
    desc.textContent = activeModalItem.degradation.now;
  } else {
    label.textContent = "PROJECTION: +100 YEARS ON THE MOON";
    desc.textContent = activeModalItem.degradation.future100;
  }
}

function closeModal() {
  const modal = document.getElementById('artifactModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ==========================================
// 10. LUNAR RECYCLING SIMULATOR (ISRU)
// ==========================================
function toggleRecycle(id) {
  if (selectedForRecycling.has(id)) {
    selectedForRecycling.delete(id);
  } else {
    selectedForRecycling.add(id);
  }
  renderCards();
  updateRecyclingCalculator();
}

function updateRecyclingCalculator() {
  let al = 0, ti = 0, el = 0;

  selectedForRecycling.forEach(id => {
    const item = moonArtifacts.find(i => i.id === id);
    if (item && item.materials) {
      al += item.materials.aluminum;
      ti += item.materials.titanium;
      el += item.materials.electronics;
    }
  });

  document.getElementById('calcAluminum').textContent = `${al.toLocaleString('en-US')} kg`;
  document.getElementById('calcTitanium').textContent = `${ti.toLocaleString('en-US')} kg`;
  document.getElementById('calcElectronics').textContent = `${el.toLocaleString('en-US')} kg`;

  const buildRes = document.getElementById('calcBuildResult');
  const total = al + ti + el;
  if (total === 0) {
    buildRes.textContent = "Select lunar spacecraft above using '+ Recycle'";
  } else if (total < 1000) {
    buildRes.textContent = "Communications relay mast, solar tracker & rover spare parts";
  } else if (total < 10000) {
    buildRes.textContent = "Lunar greenhouse structural frame & 500 m power cable grid";
  } else {
    buildRes.textContent = "Full lunar habitat pressure dome & 3 cargo rovers";
  }
}

// ==========================================
// 11. INITIALIZATION ON PAGE LOAD
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initHeroPlanetMotion();
  populateCategorySelect();
  initPlanetary2DMap();
  renderQuickPinButtons();
  renderMapTelemetry();
  renderCards();
  renderPersonalArtifacts();
  renderBeyondMars();
  renderAllSources();
  updateRecyclingCalculator();
});