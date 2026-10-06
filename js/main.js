'use strict';

/* ══════════════════════════════════════════════
   SETUP DASAR
══════════════════════════════════════════════ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const getAspect = () => window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000);
camera.position.z = 10;

const updateCamera = () => {
    const aspect = getAspect();
    let viewWidth = 10 * aspect;
    let viewHeight = 10;
    
    // Pada layar sempit (mobile), paksa lebar view minimal 9 agar gedung tidak terpotong (fit-to-width)
    if (aspect < 1.0) {
        viewWidth = 9; 
        viewHeight = 9 / aspect;
    }
    
    camera.left = -viewWidth;
    camera.right = viewWidth;
    camera.top = viewHeight;
    camera.bottom = -viewHeight;
    
    // Geser kamera ke atas pada layar tinggi agar tanah (Y = -10) selalu mengunci di bagian paling bawah layar
    camera.position.y = viewHeight - 10;
    camera.updateProjectionMatrix();
};
// Set kamera pertama kali
updateCamera();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const mat = (hex, alpha) => {
    const cfg = { color: hex, side: THREE.DoubleSide };
    if (alpha !== undefined && alpha < 1) { cfg.transparent = true; cfg.opacity = alpha; }
    return new THREE.MeshBasicMaterial(cfg);
};

const mkRect = (w, h, color, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color));
    m.position.set(x, y, z !== undefined ? z : 0);
    return m;
};

const mkTriangle = (base, height, color, x, y, z, rotZ) => {
    const geo = new THREE.BufferGeometry();
    const b2 = base / 2;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -b2, 0, 0,
         b2, 0, 0,
         0,  height, 0
    ]), 3));
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z !== undefined ? z : 0);
    if (rotZ !== undefined) m.rotation.z = rotZ;
    return m;
};

/* ══════════════════════════════════════════════
   LANGIT & LAUT GRADASI
══════════════════════════════════════════════ */
// Langit biru muda
scene.add(mkRect(80, 80, 0xbae6fd, 0, 40, -2));
// Lautan cyan di cakrawala (Horizon)
scene.add(mkRect(80, 12, 0x7dd3fc, 0, 0, -2.1));

/* ══════════════════════════════════════════════
   AWAN (Kelompok Lingkaran)
   Transformasi: Translasi (posisi) + Scaling (ukuran tiap awan)
══════════════════════════════════════════════ */
const mkCloud = (cx, cy, sc) => {
    const g = new THREE.Group();
    // Setiap blob awan = lingkaran (Objek Lingkaran)
    const blobs = [
        [0, 0, 1.1], [-1.0, -0.3, 0.85], [1.0, -0.25, 0.8],
        [-0.45, 0.35, 0.7], [0.5, 0.3, 0.65]
    ];
    blobs.forEach(([bx, by, r]) => {
        const c = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat(0xffffff, 0.92));
        c.position.set(bx, by, 0);
        g.add(c);
    });
    // Transformasi Scaling pada group awan
    g.scale.set(sc, sc, 1);
    // Transformasi Translasi ke posisi di langit
    g.position.set(cx, cy, -1);
    return g;
};

const clouds = [
    mkCloud(-9, 7.5, 0.9),
    mkCloud(-3, 8.2, 1.1),
    mkCloud( 4, 7.8, 0.85),
    mkCloud(10, 8.5, 1.0)
];
clouds.forEach(c => scene.add(c));

/* ══════════════════════════════════════════════
   MATAHARI
   Objek: Lingkaran (inti) + Segitiga (sinar)
   Transformasi:
     1. Translasi – posisi pojok kiri atas
     2. Rotasi    – sinar berputar terus-menerus
     3. Scaling   – dikontrol slider
══════════════════════════════════════════════ */
const sunGroup = new THREE.Group();

// Lingkaran inti matahari
const sunCore = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), mat(0xfde68a));
sunGroup.add(sunCore);
// Lingkaran dalam lebih terang
const sunInner = new THREE.Mesh(new THREE.CircleGeometry(1.0, 64), mat(0xfef3c7));
sunInner.position.z = 0.1;
sunGroup.add(sunInner);

// Sinar-sinar (Objek Segitiga) – 12 sinar
const rayGeo = new THREE.BufferGeometry();
rayGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    -0.2, 0, 0,
     0.2, 0, 0,
     0.0, 1.4, 0
]), 3));
for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i;
    const ray = new THREE.Mesh(rayGeo, mat(0xfbbf24));
    // Transformasi Rotasi: tiap sinar diputar agar melingkar
    ray.rotation.z = angle;
    // Transformasi Translasi: tiap sinar digeser dari pusat
    ray.position.set(2.0 * Math.cos(angle - Math.PI/2), 2.0 * Math.sin(angle - Math.PI/2), -0.05);
    sunGroup.add(ray);
}

// Transformasi Translasi: posisi matahari di pojok kiri atas
// Digeser ke -7.5 agar tetap terlihat di layar sempit (mobile)
sunGroup.position.set(-7.5, 8, 0);
scene.add(sunGroup);

/* ══════════════════════════════════════════════
   TANAH & JALAN (Persegi / Persegi Panjang)
══════════════════════════════════════════════ */
const groundGroup = new THREE.Group();
// Rumput
groundGroup.add(mkRect(80, 4,   0x4ade80, 0, -8.5, 0));
groundGroup.add(mkRect(80, 1,   0x16a34a, 0, -9.5, 0.05));
// Aspal jalan
groundGroup.add(mkRect(80, 2.5, 0x334155, 0, -9.7, 0.1));
// Marka jalan
for (let i = -14; i <= 14; i++) {
    groundGroup.add(mkRect(1.4, 0.14, 0xf8fafc, i * 3.0, -9.7, 0.2));
}
// Trotoar
groundGroup.add(mkRect(80, 0.5, 0x94a3b8, 0, -8.2, 0.1));
// Striping trotoar
for (let i = -30; i <= 30; i++) {
    groundGroup.add(mkRect(1.1, 0.12, i % 2 === 0 ? 0x1e293b : 0xfacc15, i * 1.1, -8.04, 0.15));
}
scene.add(groundGroup);

/* ══════════════════════════════════════════════
   GEDUNG POLINDRA (REPLIKA PERSIS)
   Dekomposisi struktur kompleks menjadi bentuk dasar.
══════════════════════════════════════════════ */
const bldGroup = (() => {

  const studentCenterGroup = new THREE.Group();
  studentCenterGroup.name = "Student Center";

  // Palette references
  const cNavy = 0x1E3A8A;         // 0x1E3A8A
  const cGlass = 0x0EA5E9;       // 0x0EA5E9
  const cYellow = 0xEAB308;     // 0xEAB308
  const cWhite = 0xF8FAFC;       // 0xF8FAFC
  const cSilver = 0x94A3B8;     // 0x94A3B8
  const cDarkWin = 0x475569;// 0x475569

  // =========================================================================
  // 0. FONDASI DASAR & PODIUM (Plinth & Ground Curb)
  // =========================================================================
  const basePlinthGeom = new THREE.PlaneGeometry(450, 10);
  const basePlinthMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
  const basePlinth = new THREE.Mesh(basePlinthGeom, basePlinthMat);
  basePlinth.position.set(0, 5, 0.01);
  studentCenterGroup.add(basePlinth);

  const curbGeom = new THREE.PlaneGeometry(454, 3);
  const curbMat = new THREE.MeshBasicMaterial({ color: 0x94A3B8 });
  const curb = new THREE.Mesh(curbGeom, curbMat);
  curb.position.set(0, 10, 0.02);
  studentCenterGroup.add(curb);

  // =========================================================================
  // 1. PART 1: RIGHT WING & YELLOW FIN (MENARA SAYAP KANAN & BILAH KUNING)
  // =========================================================================
  // A. Sayap Gedung Samping Belakang (Right Annex Wing di belakang menara kuning)
  const annexGeom = new THREE.PlaneGeometry(36, 175);
  const annexMat = new THREE.MeshBasicMaterial({ color: 0xE2E8F0 });
  const annexMesh = new THREE.Mesh(annexGeom, annexMat);
  annexMesh.position.set(208, 92, 0.01);
  studentCenterGroup.add(annexMesh);

  // Jendela pita horisontal pada sayap belakang
  for (let w = 0; w < 5; w++) {
    const aWinGeom = new THREE.PlaneGeometry(30, 14);
    const aWinMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const aWin = new THREE.Mesh(aWinGeom, aWinMat);
    aWin.position.set(208, 30 + w * 32, 0.02);
    studentCenterGroup.add(aWin);
  }

  // B. Dinding Menara Putih Utama (Right Tower White Base)
  const rightTowerGeom = new THREE.PlaneGeometry(92, 264); // new THREE.PlaneGeometry(85, 260)
  const rightTowerMat = new THREE.MeshBasicMaterial({ color: 0xF8FAFC });
  const rightTowerMesh = new THREE.Mesh(rightTowerGeom, rightTowerMat);
  rightTowerMesh.position.set(118, 137, 0.03);
  studentCenterGroup.add(rightTowerMesh);

  // C. Struktur Kisi Louver Bertingkat Menara Kanan (6 Tingkat Arsitektural)
  const louverDarkMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
  const louverSlatMat = new THREE.MeshBasicMaterial({ color: 0x64748B });
  const tierCount = 6;
  const tierHeight = 28;
  const tierStartY = 38;
  for (let i = 0; i < tierCount; i++) {
    const yCenter = tierStartY + i * 40;
    
    // Ceruk jendela gelap
    const recessGeom = new THREE.PlaneGeometry(44, tierHeight);
    const recessMesh = new THREE.Mesh(recessGeom, louverDarkMat);
    recessMesh.position.set(96, yCenter, 0.05);
    studentCenterGroup.add(recessMesh);

    // Kisi-kisi horizontal louver
    for (let s = -1; s <= 1; s++) {
      const slatGeom = new THREE.PlaneGeometry(42, 3);
      const slatMesh = new THREE.Mesh(slatGeom, louverSlatMat);
      slatMesh.position.set(96, yCenter + s * 8, 0.07);
      studentCenterGroup.add(slatMesh);
    }
  }

  // Kolom vertikal putih pembatas louver
  const louverColGeom = new THREE.PlaneGeometry(6, 252);
  const louverCol = new THREE.Mesh(louverColGeom, rightTowerMat);
  louverCol.position.set(73, 137, 0.08);
  studentCenterGroup.add(louverCol);

  // D. 5 Jendela Celah Gelap Vertikal (Slit Windows on Right White Wall)
  const slitGeom = new THREE.PlaneGeometry(24, 6.5);
  const slitMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
  const slitYs = [58, 98, 138, 178, 218];
  slitYs.forEach((sy) => {
    const slitMesh = new THREE.Mesh(slitGeom, slitMat);
    slitMesh.position.set(142, sy, 0.08);
    studentCenterGroup.add(slitMesh);

    // Lis bingkai putih tipis di atas celah
    const slitTrimGeom = new THREE.PlaneGeometry(26, 1.5);
    const slitTrim = new THREE.Mesh(slitTrimGeom, new THREE.MeshBasicMaterial({ color: 0xCBD5E1 }));
    slitTrim.position.set(142, sy + 4.5, 0.09);
    studentCenterGroup.add(slitTrim);
  });

  // E. Bilah Kolom Kuning Ikonik (Polindra Yellow Architectural Fin / Crown)
  // Bentuk L-crown modern di tepi kanan fasad yang menjadi ciri khas utama kampus
  const yellowShape = new THREE.Shape();
  yellowShape.moveTo(158, 10);
  yellowShape.lineTo(192, 10);
  yellowShape.lineTo(192, 274);
  yellowShape.lineTo(158, 282); // Puncak miring dinamis
  yellowShape.closePath();

  const yellowGeom = new THREE.ShapeGeometry(yellowShape);
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xEAB308 });
  const yellowMesh = new THREE.Mesh(yellowGeom, yellowMat);
  yellowMesh.position.set(0, 0, 0.10);
  studentCenterGroup.add(yellowMesh);

  // Aksen garis lis putih di sisi dalam kolom kuning
  const yellowInnerLineGeom = new THREE.PlaneGeometry(2, 260);
  const yellowInnerLine = new THREE.Mesh(yellowInnerLineGeom, new THREE.MeshBasicMaterial({ color: 0xFEF08A }));
  yellowInnerLine.position.set(162, 142, 0.12);
  studentCenterGroup.add(yellowInnerLine);


  // =========================================================================
  // 2. PART 2: CENTRAL GLASS CURTAIN WALL (MENARA KACA CYAN & PYLON NAVY)
  // =========================================================================
  // A. Fasad Kaca Reflektif Cyan Utama
  const glassWidth = 172;
  const glassHeight = 256;
  const glassGeom = new THREE.PlaneGeometry(glassWidth, glassHeight);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x0EA5E9, transparent: true, opacity: 0.94 });
  const glassMesh = new THREE.Mesh(glassGeom, glassMat);
  glassMesh.position.set(-15, 138, 0.03);
  studentCenterGroup.add(glassMesh);

  // B. Garis Lantai Spandrel Horisontal (6 Lantai Bangunan Kaca)
  const spandrelMat = new THREE.MeshBasicMaterial({ color: 0x0284C7 });
  for (let fl = 1; fl <= 5; fl++) {
    const spGeom = new THREE.PlaneGeometry(glassWidth - 4, 3);
    const spMesh = new THREE.Mesh(spGeom, spandrelMat);
    spMesh.position.set(-15, 10 + fl * 42, 0.05);
    studentCenterGroup.add(spMesh);
  }

  // C. Mullion & Frame Vertikal Navy
  const navyMat = new THREE.MeshBasicMaterial({ color: 0x1E3A8A });

  // Bingkai tepi kaca
  const leftGlassFrameGeom = new THREE.PlaneGeometry(7, glassHeight + 2);
  const leftGlassFrame = new THREE.Mesh(leftGlassFrameGeom, navyMat);
  leftGlassFrame.position.set(-98, 138, 0.08);
  studentCenterGroup.add(leftGlassFrame);

  const rightGlassFrameGeom = new THREE.PlaneGeometry(6, glassHeight + 2);
  const rightGlassFrame = new THREE.Mesh(rightGlassFrameGeom, navyMat);
  rightGlassFrame.position.set(68, 138, 0.08);
  studentCenterGroup.add(rightGlassFrame);

  // Mullion pembagi panel kaca tipis
  const vertMullionPositions = [-78, -58, -38, 18, 42];
  vertMullionPositions.forEach((mx) => {
    const mulGeom = new THREE.PlaneGeometry(2.5, glassHeight);
    const mulMesh = new THREE.Mesh(mulGeom, navyMat);
    mulMesh.position.set(mx, 138, 0.07);
    studentCenterGroup.add(mulMesh);
  });

  // D. Pylon Vertikal Navy Utama (Main Central Navy Feature Column)
  // Menara kolom struktural navy di tengah-kiri fasad kaca
  const mainPylonGeom = new THREE.PlaneGeometry(24, 225);
  const mainPylon = new THREE.Mesh(mainPylonGeom, navyMat);
  mainPylon.position.set(-10, 153, 0.12);
  studentCenterGroup.add(mainPylon);

  // E. Jalur Pipa Aksen Sirkuit Perak (Iconic Step-Jogged Circuit Conduits)
  // Ciri khas arsitektur Polindra: pipa conduit perak yang berjalan tegak lalu berbelok miring
  const conduitMat = new THREE.MeshBasicMaterial({ color: 0x94A3B8 });

  // Pipa lurus atas
  const conduitTopLGeom = new THREE.PlaneGeometry(2.5, 95);
  const conduitTopL = new THREE.Mesh(conduitTopLGeom, conduitMat);
  conduitTopL.position.set(-24, 208, 0.15);
  studentCenterGroup.add(conduitTopL);

  const conduitTopRGeom = new THREE.PlaneGeometry(2.5, 95);
  const conduitTopR = new THREE.Mesh(conduitTopRGeom, conduitMat);
  conduitTopR.position.set(4, 208, 0.15);
  studentCenterGroup.add(conduitTopR);

  // Bagian sirkuit miring 45 derajat (jogged circuit trace)
  const jogL1Geom = new THREE.PlaneGeometry(2.5, 45);
  const jogL1 = new THREE.Mesh(jogL1Geom, conduitMat);
  jogL1.position.set(-27, 142, 0.15);
  jogL1.rotation.z = THREE.MathUtils.degToRad(-25);
  studentCenterGroup.add(jogL1);

  const jogL2Geom = new THREE.PlaneGeometry(2.5, 45);
  const jogL2 = new THREE.Mesh(jogL2Geom, conduitMat);
  jogL2.position.set(7, 142, 0.15);
  jogL2.rotation.z = THREE.MathUtils.degToRad(-25);
  studentCenterGroup.add(jogL2);

  // Pipa lurus bawah menyambung ke kanopi
  const conduitBotLGeom = new THREE.PlaneGeometry(2.5, 65);
  const conduitBotL = new THREE.Mesh(conduitBotLGeom, conduitMat);
  conduitBotL.position.set(-36, 92, 0.15);
  studentCenterGroup.add(conduitBotL);

  const conduitBotRGeom = new THREE.PlaneGeometry(2.5, 65);
  const conduitBotR = new THREE.Mesh(conduitBotRGeom, conduitMat);
  conduitBotR.position.set(-2, 92, 0.15);
  studentCenterGroup.add(conduitBotR);

  // F. Atap Parapet Putih & Penthouse Mesin AC (Rooftop Cornice & HVAC)
  const parapetGeom = new THREE.PlaneGeometry(180, 16);
  const parapetMesh = new THREE.Mesh(parapetGeom, rightTowerMat);
  parapetMesh.position.set(-15, 270, 0.10);
  studentCenterGroup.add(parapetMesh);

  // 4 Unit Kotak Mesin Pendingin HVAC di Atap
  for (let h = 0; h < 4; h++) {
    const hvacGeom = new THREE.PlaneGeometry(18, 12);
    const hvacMesh = new THREE.Mesh(hvacGeom, conduitMat);
    hvacMesh.position.set(-70 + h * 24, 282, 0.04);
    studentCenterGroup.add(hvacMesh);

    // Kisi kisi ventilasi HVAC
    const ventGeom = new THREE.PlaneGeometry(14, 2);
    const ventMesh = new THREE.Mesh(ventGeom, louverDarkMat);
    ventMesh.position.set(-70 + h * 24, 282, 0.06);
    studentCenterGroup.add(ventMesh);
  }


  // =========================================================================
  // 3. PART 3: LEFT DROP-OFF PORTICO & CANOPY (KANOPI MIRING & LOUVER PERAK)
  // =========================================================================
  // A. Sayap Mezzanine Lantai 2 di Belakang Kanopi
  const mezzBaseGeom = new THREE.PlaneGeometry(100, 48);
  const mezzBase = new THREE.Mesh(mezzBaseGeom, rightTowerMat);
  mezzBase.position.set(-145, 96, 0.02);
  studentCenterGroup.add(mezzBase);

  // Kaca jendela lantai 2 sayap kiri
  const mezzGlassGeom = new THREE.PlaneGeometry(94, 28);
  const mezzGlass = new THREE.Mesh(mezzGlassGeom, new THREE.MeshBasicMaterial({ color: 0x38BDF8 }));
  mezzGlass.position.set(-145, 94, 0.04);
  studentCenterGroup.add(mezzGlass);

  // Parapet atap mezzanine
  const mezzRoofGeom = new THREE.PlaneGeometry(106, 8);
  const mezzRoof = new THREE.Mesh(mezzRoofGeom, rightTowerMat);
  mezzRoof.position.set(-145, 122, 0.06);
  studentCenterGroup.add(mezzRoof);

  // B. Tiang Miring Portico Kiri (Massive Angled Drop-off Support Pylon)
  // Tiang struktural arang gelap miring di sisi kiri yang menyangga kanopi drop-off
  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(-222, 10);
  canopyShape.lineTo(-195, 10);
  canopyShape.lineTo(-195, 82);
  canopyShape.lineTo(-228, 82);
  canopyShape.lineTo(-222, 10);
  canopyShape.closePath();

  const pylonGeom = new THREE.ShapeGeometry(canopyShape);
  const pylonMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
  const pylonMesh = new THREE.Mesh(new THREE.ShapeGeometry(canopyShape), pylonMat);
  pylonMesh.position.set(0, 0, 0.20);
  studentCenterGroup.add(pylonMesh);

  // Garis alur panel horisontal pada tiang miring
  for (let g = 1; g <= 4; g++) {
    const grooveGeom = new THREE.PlaneGeometry(30, 1.5);
    const groove = new THREE.Mesh(grooveGeom, new THREE.MeshBasicMaterial({ color: 0x475569 }));
    groove.position.set(-210, 10 + g * 14, 0.22);
    studentCenterGroup.add(groove);
  }

  // C. Balok Kanopi Utama Navy (Main Navy Canopy Roof Beam)
  const canopyBeamGeom = new THREE.PlaneGeometry(140, 24);
  const canopyBeam = new THREE.Mesh(canopyBeamGeom, navyMat);
  canopyBeam.position.set(-140, 72, 0.18);
  studentCenterGroup.add(canopyBeam);

  // Lis putih plafon bawah kanopi (Soffit Trim)
  const soffitGeom = new THREE.PlaneGeometry(138, 3.5);
  const soffit = new THREE.Mesh(soffitGeom, new THREE.MeshBasicMaterial({ color: 0xF1F5F9 }));
  soffit.position.set(-140, 60, 0.22);
  studentCenterGroup.add(soffit);

  // D. 4 Garis Louver Perak Berbelok Sudut 45 Derajat (Iconic Stepped Silver Stripes)
  // Fitur paling ikonik dari foto referensi: garis perak yang berbelok miring 45 derajat
  const stripeYs = [54, 47, 40, 33];
  stripeYs.forEach((baseY, idx) => {
    // 1. Segmen horisontal kiri (di bawah kanopi)
    const segLWidth = 60 - idx * 2;
    const segLGeom = new THREE.PlaneGeometry(segLWidth, 3.5);
    const segL = new THREE.Mesh(segLGeom, conduitMat);
    segL.position.set(-110 - idx, baseY - 8, 0.25);
    studentCenterGroup.add(segL);

    // 2. Segmen miring 45 derajat (diagonal step-up)
    const segDiagGeom = new THREE.PlaneGeometry(3.5, 12);
    const segDiag = new THREE.Mesh(segDiagGeom, conduitMat);
    segDiag.position.set(-78 - idx, baseY - 3, 0.25);
    segDiag.rotation.z = THREE.MathUtils.degToRad(-45);
    studentCenterGroup.add(segDiag);

    // 3. Segmen horisontal kanan (melintang di fasad kaca)
    const segRWidth = 92 - idx * 4;
    const segRGeom = new THREE.PlaneGeometry(segRWidth, 3.5);
    const segR = new THREE.Mesh(segRGeom, conduitMat);
    segR.position.set(-28 + idx * 2, baseY + 2, 0.25);
    studentCenterGroup.add(segR);
  });

  // E. Lobi Kaca Lantai Dasar & Pintu Masuk Utama (Ground Entrance Lobby)
  const lobbyWallGeom = new THREE.PlaneGeometry(92, 46);
  const lobbyWall = new THREE.Mesh(lobbyWallGeom, new THREE.MeshBasicMaterial({ color: 0x0284C7 }));
  lobbyWall.position.set(-40, 33, 0.08);
  studentCenterGroup.add(lobbyWall);

  // Pintu masuk kaca ganda berbingkai navy gelap
  const doorPortalGeom = new THREE.PlaneGeometry(42, 36);
  const doorPortal = new THREE.Mesh(doorPortalGeom, new THREE.MeshBasicMaterial({ color: 0x0F172A }));
  doorPortal.position.set(-30, 28, 0.12);
  studentCenterGroup.add(doorPortal);

  const doorGlassLGeom = new THREE.PlaneGeometry(16, 30);
  const doorGlassL = new THREE.Mesh(doorGlassLGeom, new THREE.MeshBasicMaterial({ color: 0x7DD3FC }));
  doorGlassL.position.set(-39, 27, 0.14);
  studentCenterGroup.add(doorGlassL);

  const doorGlassRGeom = new THREE.PlaneGeometry(16, 30);
  const doorGlassR = new THREE.Mesh(doorGlassRGeom, new THREE.MeshBasicMaterial({ color: 0x7DD3FC }));
  doorGlassR.position.set(-21, 27, 0.14);
  studentCenterGroup.add(doorGlassR);

  // F. Plat Tulisan & Kanopi Pintu Masuk "STUDENT CENTER"
  const signCanopyGeom = new THREE.PlaneGeometry(95, 14);
  const signCanopy = new THREE.Mesh(signCanopyGeom, navyMat);
  signCanopy.position.set(20, 52, 0.22);
  studentCenterGroup.add(signCanopy);

  // Strip lis biru cyan di bawah kanopi nama
  const signTrimGeom = new THREE.PlaneGeometry(95, 2.5);
  const signTrim = new THREE.Mesh(signTrimGeom, new THREE.MeshBasicMaterial({ color: 0x38BDF8 }));
  signTrim.position.set(20, 45, 0.24);
  studentCenterGroup.add(signTrim);

  // Plat huruf nama "STUDENT CENTER"
  const signTextGeom = new THREE.PlaneGeometry(88, 8);
  const signText = new THREE.Mesh(signTextGeom, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
  signText.position.set(20, 52, 0.26);
  studentCenterGroup.add(signText);


  // =========================================================================
  // 4. PART 4: POLINDRA LOGO BADGE (LAMBANG RESMI POLINDRA)
  // =========================================================================
  // Bertumpu di kolom navy kaca lantai 4/5 (y = 192, x = -10)
  const logoOuterGeom = new THREE.CircleGeometry(16, 32);
  const logoOuterMat = new THREE.MeshBasicMaterial({ color: 0xEAB308 });
  const logoOuterMesh = new THREE.Mesh(logoOuterGeom, logoOuterMat);
  logoOuterMesh.position.set(-10, 192, 0.32);
  studentCenterGroup.add(logoOuterMesh);

  const logoMidGeom = new THREE.CircleGeometry(12.5, 32);
  const logoMidMat = new THREE.MeshBasicMaterial({ color: 0x1E3A8A });
  const logoMidMesh = new THREE.Mesh(logoMidGeom, logoMidMat);
  logoMidMesh.position.set(-10, 192, 0.36);
  studentCenterGroup.add(logoMidMesh);

  const logoCoreGeom = new THREE.CircleGeometry(8, 24);
  const logoCoreMesh = new THREE.Mesh(logoCoreGeom, new THREE.MeshBasicMaterial({ color: cGlass }));
  logoCoreMesh.position.set(-10, 192, 0.40);
  studentCenterGroup.add(logoCoreMesh);

  const logoCrescentGeom = new THREE.CircleGeometry(4.5, 16);
  const logoCrescentMesh = new THREE.Mesh(logoCrescentGeom, new THREE.MeshBasicMaterial({ color: 0xF59E0B }));
  logoCrescentMesh.position.set(-10, 194, 0.44);
  studentCenterGroup.add(logoCrescentMesh);


  // =========================================================================
  // 5. PART 5: LANDSCAPING TANAMAN HIJAU (TROPICAL SHRUBS ALONG THE PLINTH)
  // =========================================================================
  // Semak-semak hijau di depan lobi seperti pada foto asli
  const shrubMatDark = new THREE.MeshBasicMaterial({ color: 0x059669 });
  const shrubMatLight = new THREE.MeshBasicMaterial({ color: 0x10B981 });
  const shrubPositions = [
    { x: -92, r: 8, c: shrubMatDark },
    { x: -80, r: 10, c: shrubMatLight },
    { x: -68, r: 7, c: shrubMatDark },
    { x: 38, r: 9, c: shrubMatLight },
    { x: 50, r: 11, c: shrubMatDark },
    { x: 62, r: 8, c: shrubMatLight }
  ];
  shrubPositions.forEach((sh) => {
    const shGeom = new THREE.CircleGeometry(sh.r, 16);
    const shMesh = new THREE.Mesh(shGeom, sh.c);
    shMesh.position.set(sh.x, 14, 0.28);
    shMesh.scale.set(1.1, 0.8, 1);
    studentCenterGroup.add(shMesh);
  });

  // --- PENEMPATAN PADA TINGKAT RUMPUT ---
  // Bertumpu pas di atas garis rumput (y = -135)
  studentCenterGroup.position.set(0, -135, 0);

  

  
  // Scale down heavily since the original was 100x bigger
  studentCenterGroup.scale.set(0.038, 0.038, 1);
  // Position it correctly in the user's viewport (on the ground)
  studentCenterGroup.position.set(0, -6.5, 0);
  return studentCenterGroup;
})();
scene.add(bldGroup);

/* ══════════════════════════════════════════════
   POHON
   Objek: Segitiga bertumpuk (mahkota) + Persegi (batang)
   Transformasi:
     1. Translasi – posisi berbeda tiap pohon
     2. Rotasi    – dikontrol slider
     3. Scaling   – dikontrol slider
══════════════════════════════════════════════ */
const mkTree = (x, y, sc) => {
    const g = new THREE.Group();
    // Batang (persegi coklat)
    g.add(mkRect(0.45, 1.2, 0x92400e, 0, -1.5, 0.1));
    // Mahkota bawah (segitiga)
    g.add(mkTriangle(3.0, 2.5, 0x15803d, 0, -0.8, 0.2));
    // Mahkota tengah
    g.add(mkTriangle(2.4, 2.0, 0x16a34a, 0, 0.5, 0.3));
    // Mahkota atas
    g.add(mkTriangle(1.8, 1.8, 0x22c55e, 0, 1.6, 0.4));
    // Transformasi Scaling
    g.scale.set(sc, sc, 1);
    // Transformasi Translasi
    g.position.set(x, y, 0.5);
    return g;
};

const allTrees = new THREE.Group();
allTrees.add(mkTree(-12, -5.5, 1.1));
allTrees.add(mkTree(-9,  -5.8, 0.9));
allTrees.add(mkTree(10,  -5.5, 1.1));
allTrees.add(mkTree(8,   -5.8, 0.85));
allTrees.add(mkTree(-7.5,-5.9, 0.8));
allTrees.add(mkTree( 6.5,-5.9, 0.78));
scene.add(allTrees);

/* ══════════════════════════════════════════════
   TIANG BENDERA (Persegi + Segitiga)
══════════════════════════════════════════════ */
const flagGroup = new THREE.Group();
flagGroup.add(mkRect(0.08, 4.5, 0x94a3b8, 0, -5.25, 0.6));
flagGroup.add(mkRect(1.2, 0.5, 0xef4444, 0.6, -3.35, 0.7));
flagGroup.add(mkRect(1.2, 0.5, 0xf8fafc, 0.6, -3.85, 0.7));
flagGroup.add(mkTriangle(0.25, 0.35, 0xfbbf24, 0, -3.0, 0.8));
flagGroup.position.set(4.8, 1.2, 0);
scene.add(flagGroup);

/* ══════════════════════════════════════════════
   LAMPU JALAN (Persegi + Lingkaran)
══════════════════════════════════════════════ */
const mkLamp = (x) => {
    const g = new THREE.Group();
    g.add(mkRect(0.12, 3.5, 0x475569, 0, -1.75, 0));
    g.add(mkRect(1.4, 0.1, 0x475569, 0.7, -0.2, 0));
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32), mat(0xfef9c3));
    bulb.position.set(1.4, -0.2, 0.1);
    g.add(bulb);
    const bulbInner = new THREE.Mesh(new THREE.CircleGeometry(0.18, 32), mat(0xfde68a));
    bulbInner.position.set(1.4, -0.2, 0.15);
    g.add(bulbInner);
    g.position.set(x, -5.2, 0.6);
    return g;
};
scene.add(mkLamp(-5.5));
scene.add(mkLamp( 4.5));
scene.add(mkLamp(12));
scene.add(mkLamp(-13));

/* ══════════════════════════════════════════════
   MOBIL (Persegi + Segitiga kaca + Lingkaran roda)
   Transformasi: Translasi (animasi bergerak)
══════════════════════════════════════════════ */
const mkCar = (x, y, colorBody, colorRoof) => {
    const g = new THREE.Group();
    // Bodi mobil (persegi panjang)
    g.add(mkRect(3.0, 0.9, colorBody, 0, 0, 0));
    // Atap (persegi lebih kecil – Scaling implisit via width/height)
    g.add(mkRect(1.9, 0.75, colorRoof, -0.1, 0.7, 0.05));
    // Kaca depan (segitiga)
    g.add(mkTriangle(0.85, 0.7, 0xbae6fd, 0.85, 0.35, 0.1, 0));
    // Roda – lingkaran (Objek Lingkaran)
    const wheelGeo = new THREE.CircleGeometry(0.38, 32);
    const hubGeo   = new THREE.CircleGeometry(0.18, 32);
    [-0.95, 0.95].forEach(wx => {
        const wheel = new THREE.Mesh(wheelGeo, mat(0x1e293b));
        wheel.position.set(wx, -0.52, 0.1);
        g.add(wheel);
        const hub = new THREE.Mesh(hubGeo, mat(0x94a3b8));
        hub.position.set(wx, -0.52, 0.2);
        g.add(hub);
    });
    g.position.set(x, y, 0.7);
    return g;
};

// Mobil diletakkan di dua jalur yang berbeda (atas dan bawah marka jalan)
const car1 = mkCar(-3, -8.6, 0xef4444, 0xdc2626); // Jalur Atas
const car2 = mkCar( 6, -9.6, 0x3b82f6, 0x2563eb); // Jalur Bawah
scene.add(car1);
scene.add(car2);
let car1Dir = -1, car2Dir = 1;
car1.scale.x = car1Dir; // Atur hadap awal sesuai arah jalan
car2.scale.x = car2Dir;

/* ══════════════════════════════════════════════
   BURUNG (THREE.Shape)
   Transformasi: Translasi melayang di udara
══════════════════════════════════════════════ */
const mkBird = (x, y, sc) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(1.5, 1.0, 2.0, 1.5);
    s.quadraticCurveTo(1.5, 0.5, 0, -0.5);
    s.quadraticCurveTo(-1.5, 0.5, -2.0, 1.5);
    s.quadraticCurveTo(-1.5, 1.0, 0, 0);
    
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(0x334155));
    mesh.position.set(x, y, 0.5);
    mesh.scale.set(sc, sc, 1);
    // Simpan koordinat awal Y untuk animasi terbang (bobbing)
    mesh.userData = { baseY: y, speed: 0.02 + Math.random() * 0.02, offset: Math.random() * 100 };
    return mesh;
};

const birds = [];
birds.push(mkBird(12, 6, 0.2));
birds.push(mkBird(14, 7, 0.15));
birds.push(mkBird(16, 5.5, 0.25));
birds.forEach(b => scene.add(b));

/* ══════════════════════════════════════════════
   KAPAL LAUT (ShapeGeometry + Persegi)
   Transformasi: Translasi mengarungi lautan
══════════════════════════════════════════════ */
const mkShip = (x, y, sc, dir) => {
    const g = new THREE.Group();
    // Lambung kapal (Trapezium menggunakan ShapeGeometry)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-2, 0);
    hullShape.lineTo(2, 0);
    hullShape.lineTo(2.5, 0.8);
    hullShape.lineTo(-2.2, 0.8);
    hullShape.closePath();
    const hull = new THREE.Mesh(new THREE.ShapeGeometry(hullShape), mat(0x1e293b));
    g.add(hull);
    
    // Kabin putih
    g.add(mkRect(2.4, 0.8, 0xffffff, 0, 1.2, 0.01));
    // Cerobong merah
    g.add(mkRect(0.4, 1.0, 0xef4444, -0.6, 1.8, 0.02));
    
    // Jendela kabin
    g.add(mkRect(0.3, 0.3, 0x0ea5e9, 0.5, 1.2, 0.02));
    g.add(mkRect(0.3, 0.3, 0x0ea5e9, 0.0, 1.2, 0.02));
    
    // Ditempatkan di kedalaman Z = -1.9 (Di belakang gedung Z=0, di depan laut Z=-2.1)
    g.position.set(x, y, -1.9); 
    g.scale.set(sc * dir, sc, 1);
    g.userData = { speed: 0.005 + Math.random() * 0.01, dir: dir };
    return g;
};

const ships = [];
// Kapal 1 bergerak ke kanan, ditempatkan di lautan cyan (Y = -3.5)
ships.push(mkShip(-15, -3.5, 0.6, 1)); 
// Kapal 2 lebih kecil, bergerak ke kiri, ditempatkan lebih dekat ke batas rumput (Y = -4.5)
ships.push(mkShip( 15, -4.5, 0.4, -1)); 
ships.forEach(s => scene.add(s));

/* ══════════════════════════════════════════════
   KONTROL UI
══════════════════════════════════════════════ */
let sunRotSpeed = 0.005;
let isPaused = false;

const el  = id => document.getElementById(id);
const txt = (id, v, dec) => { el(id).textContent = parseFloat(v).toFixed(dec !== undefined ? dec : 1); };

el('s-sun-scale').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    sunGroup.scale.set(v, v, 1);
    txt('v-sun-scale', v);
});
el('s-sun-rot').addEventListener('input', e => {
    sunRotSpeed = parseFloat(e.target.value);
    txt('v-sun-rot', sunRotSpeed, 3);
});
el('s-sun-x').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    sunGroup.position.x = -7.5 + v * 2; // Base X = -7.5
    txt('v-sun-x', v);
});
el('s-bld-x').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    bldGroup.position.x = 0 + v; // Base X = 0
    txt('v-bld-x', v);
});
el('s-bld-y').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    bldGroup.position.y = -6.5 + v; // Base Y = -6.5 (berpijak di rumput)
    txt('v-bld-y', v);
});
el('s-bld-s').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    // Skala dasar gedung adalah 0.038, kalikan dengan slider
    bldGroup.scale.set(v * 0.038, v * 0.038, 1);
    txt('v-bld-s', v);
});
el('s-tree-rot').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    allTrees.rotation.z = v;
    txt('v-tree-rot', v, 2);
});
el('s-tree-s').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    allTrees.scale.set(v, v, 1);
    txt('v-tree-s', v);
});
el('btn-reset').addEventListener('click', () => {
    const defs = {
        's-sun-scale': 1, 's-sun-rot': 0.005, 's-sun-x': 0,
        's-bld-x': 0, 's-bld-y': 0, 's-bld-s': 1,
        's-tree-rot': 0, 's-tree-s': 1
    };
    Object.entries(defs).forEach(([id, val]) => {
        el(id).value = val;
        el(id).dispatchEvent(new Event('input'));
    });
});
el('btn-pause').addEventListener('click', () => {
    isPaused = !isPaused;
    el('btn-pause').textContent = isPaused ? '▶ Resume' : '⏸ Pause';
});

// Logika Pemilih Objek untuk Diedit
const objSelector = el('obj-selector');
const ctrlGroups = {
    'group-sun': el('group-sun'),
    'group-bld': el('group-bld'),
    'group-tree': el('group-tree')
};
if (objSelector) {
    objSelector.addEventListener('change', e => {
        const val = e.target.value;
        Object.keys(ctrlGroups).forEach(k => {
            if (ctrlGroups[k]) {
                ctrlGroups[k].style.display = (k === val) ? 'block' : 'none';
            }
        });
    });
}

// Logika Toggle Panel Pengaturan (Desktop & Mobile)
const toggleBtn = el('toggle-ui-btn');
const closePanelBtn = el('close-panel-btn');
const uiPanel = el('ui-panel');
const identityCard = el('identity-card');
const legend = el('legend');
const watermark = el('watermark');

// Cek apakah layar mobile untuk sembunyikan panel by default
if (window.innerWidth <= 768) {
    uiPanel.classList.add('hide');
    if (identityCard) identityCard.classList.add('hide');
    if (legend) legend.classList.add('hide');
    if (watermark) watermark.classList.add('hide');
}

const togglePanel = () => {
    const isHidden = uiPanel.classList.toggle('hide');
    if (identityCard) identityCard.classList.toggle('hide', isHidden);
    if (legend) legend.classList.toggle('hide', isHidden);
    if (watermark) watermark.classList.toggle('hide', isHidden);
    
    if (window.innerWidth > 768) {
        // Desktop: Tampilkan tombol toggle jika panel disembunyikan
        if (isHidden) {
            toggleBtn.classList.add('show');
        } else {
            toggleBtn.classList.remove('show');
        }
    } else {
        // Mobile: Tombol selalu terlihat di bawah, ubah teksnya
        toggleBtn.textContent = isHidden ? '⚙️ Pengaturan' : '⬇️ Tutup';
    }
};

if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);
if (closePanelBtn) closePanelBtn.addEventListener('click', togglePanel);

/* ══════════════════════════════════════════════
   LOOP RENDER & ANIMASI
══════════════════════════════════════════════ */
let clock = 0;
function animate() {
    requestAnimationFrame(animate);
    if (!isPaused) {
        clock += 0.016;
        // 1. Transformasi Rotasi: sinar matahari berputar
        sunGroup.rotation.z -= sunRotSpeed;
        // 2. Transformasi Translasi & Scaling: mobil bergerak kiri-kanan dan berbalik arah
        car1.position.x += 0.04 * car1Dir;
        car2.position.x += 0.03 * car2Dir;
        if (car1.position.x < -18 || car1.position.x > 18) {
            car1Dir *= -1;
            car1.scale.x = car1Dir; // Balikkan kepala (Transformasi Scaling X = -1)
        }
        if (car2.position.x < -18 || car2.position.x > 18) {
            car2Dir *= -1;
            car2.scale.x = car2Dir; // Balikkan kepala
        }
        // 3. Transformasi Scaling: gedung berdenyut pelan
        const pulse = 1 + 0.05 * Math.sin(clock * 2.5);
        // logoRing.scale.set(pulse, pulse, 1); // Dihapus karena logo ada di dalam IIFE
        // BldGroup sekarang statis atau bisa ditambahkan efek lain
        // 4. Translasi periodik: awan bergerak pelan
        clouds.forEach((c, i) => {
            c.position.x += 0.003 * (i % 2 === 0 ? 1 : -1);
            if (c.position.x > 18) c.position.x = -18;
            if (c.position.x < -18) c.position.x = 18;
        });
        // 5. Translasi burung terbang melintasi layar
        birds.forEach(b => {
            b.position.x -= b.userData.speed;
            b.position.y = b.userData.baseY + Math.sin(clock * 5 + b.userData.offset) * 0.2;
            if (b.position.x < -18) {
                b.position.x = 18;
                b.position.y = b.userData.baseY = 5 + Math.random() * 3;
            }
        });
        // 6. Translasi kapal melintasi laut
        ships.forEach(s => {
            s.position.x += s.userData.speed * s.userData.dir;
            // Berbalik arah jika sampai ujung layar
            if (s.position.x < -20 || s.position.x > 20) {
                s.userData.dir *= -1;
                s.scale.x = Math.abs(s.scale.x) * s.userData.dir; // Balikkan arah hadap
            }
        });
    }
    renderer.render(scene, camera);
}
animate();

/* ══════════════════════════════════════════════
   RESPONSIF
══════════════════════════════════════════════ */
window.addEventListener('resize', () => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
