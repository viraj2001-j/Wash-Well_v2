"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Helper function to create rounded extruded box geometry
function createRoundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material
) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: radius * 0.3,
    bevelThickness: radius * 0.3,
  });

  geometry.center();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

// 👕 Helper function to create 3D T-Shirt mesh
function createTShirt(colorHex: number) {
  const shirtGroup = new THREE.Group();

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.85,
    sheen: 0.5,
    sheenColor: 0xffffff,
  });

  // Torso Body
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.08), mat);
  shirtGroup.add(torso);

  // Left Sleeve
  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.07), mat);
  leftSleeve.position.set(-0.21, 0.11, 0);
  leftSleeve.rotation.z = -0.35;
  shirtGroup.add(leftSleeve);

  // Right Sleeve
  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.07), mat);
  rightSleeve.position.set(0.21, 0.11, 0);
  rightSleeve.rotation.z = 0.35;
  shirtGroup.add(rightSleeve);

  // Collar Ring
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.07, 0.02, 12, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  collar.position.set(0, 0.18, 0.04);
  shirtGroup.add(collar);

  shirtGroup.scale.set(0.85, 0.85, 0.85);
  return shirtGroup;
}

// 👖 Helper function to create 3D Trouser / Jeans mesh
function createTrouser(colorHex: number) {
  const trouserGroup = new THREE.Group();

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Waistband
  const waist = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.09), mat);
  waist.position.y = 0.18;
  trouserGroup.add(waist);

  // Left Leg
  const leftLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.065, 0.36, 16),
    mat
  );
  leftLeg.position.set(-0.08, -0.06, 0);
  trouserGroup.add(leftLeg);

  // Right Leg
  const rightLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.065, 0.36, 16),
    mat
  );
  rightLeg.position.set(0.08, -0.06, 0);
  trouserGroup.add(rightLeg);

  trouserGroup.scale.set(0.85, 0.85, 0.85);
  return trouserGroup;
}

// 🧦 Helper function to create 3D Sock mesh
function createSock(colorHex: number) {
  const sockGroup = new THREE.Group();

  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.9,
    sheen: 0.6,
  });

  // Ankle Leg Tube
  const ankle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16),
    mat
  );
  ankle.position.y = 0.08;
  sockGroup.add(ankle);

  // Ankle Ribbed Cuff Ring
  const cuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.012, 12, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = 0.15;
  sockGroup.add(cuff);

  // Foot Toe Section (L-Shape turn)
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.042, 0.16, 16),
    mat
  );
  foot.rotation.z = Math.PI / 2;
  foot.position.set(0.06, 0.01, 0);
  sockGroup.add(foot);

  sockGroup.scale.set(0.85, 0.85, 0.85);
  return sockGroup;
}

export default function Laundry3DObject() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ============================================================
    // SCENE & CAMERA
    // ============================================================
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      34,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.15, 8.5);

    // ============================================================
    // RENDERER
    // ============================================================
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // ============================================================
    // LIGHTING (PURPLE, PINK & WHITE ACCENTS)
    // ============================================================
    const ambient = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(5, 7, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const purpleLight = new THREE.PointLight(0xc084fc, 4.0, 12);
    purpleLight.position.set(-4, 1, 4);
    scene.add(purpleLight);

    // 🌸 Light Pink Glow Light
    const pinkLight = new THREE.PointLight(0xf472b6, 3.5, 10);
    pinkLight.position.set(4, 2, -2);
    scene.add(pinkLight);

    // ============================================================
    // MASTER MACHINE GROUP
    // ============================================================
    const machine = new THREE.Group();
    scene.add(machine);

    // Compact scale for top-right placement
    const getBaseScale = () => {
      if (window.innerWidth < 768) return 0.28;
      if (window.innerWidth < 1100) return 0.38;
      return 0.48;
    };

    machine.scale.setScalar(getBaseScale());

    // ============================================================
    // MATERIALS (PURPLE, WHITE & PINK ACCENTS)
    // ============================================================
    // Pure Glossy White Body
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.15,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    // Vibrant Royal Purple Trim
    const purpleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7c3aed,
      metalness: 0.35,
      roughness: 0.2,
      clearcoat: 1.0,
    });

    // 🌸 Light Pink Material for Accents
    const lightPinkMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf472b6,
      metalness: 0.2,
      roughness: 0.2,
      clearcoat: 0.8,
    });

    // Dark Purple Metallic Display
    const darkPurpleGlass = new THREE.MeshPhysicalMaterial({
      color: 0x3b0764,
      metalness: 0.25,
      roughness: 0.08,
      clearcoat: 1,
    });

    // Chrome Dial & Trim
    const chromeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1,
    });

    // Tinted Clear Glass Door
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.75,
      transparent: true,
      opacity: 0.6,
      ior: 1.45,
      clearcoat: 1,
    });

    // ============================================================
    // MAIN BODY (PURE WHITE)
    // ============================================================
    const body = createRoundedBox(3.65, 4.55, 2.35, 0.16, bodyMaterial);
    machine.add(body);

    // ============================================================
    // TOP CONTROL PANEL (ROYAL PURPLE)
    // ============================================================
    const controlPanel = createRoundedBox(3.35, 0.92, 0.12, 0.06, purpleMaterial);
    controlPanel.position.set(0, 1.55, 1.2);
    machine.add(controlPanel);

    // ============================================================
    // DETERGENT DRAWER (WHITE & LIGHT PINK HANDLE)
    // ============================================================
    const detergent = createRoundedBox(0.88, 0.25, 0.08, 0.03, bodyMaterial);
    detergent.position.set(-1.03, 1.63, 1.29);
    machine.add(detergent);

    const drawerHandle = createRoundedBox(0.4, 0.06, 0.09, 0.02, lightPinkMaterial);
    drawerHandle.position.set(-1.03, 1.63, 1.34);
    machine.add(drawerHandle);

    // ============================================================
    // DIAL (CHROME & LIGHT PINK CENTER)
    // ============================================================
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.12, 48),
      chromeMaterial
    );
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0.15, 1.63, 1.3);
    machine.add(dial);

    const dialCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.13, 48),
      lightPinkMaterial
    );
    dialCenter.rotation.x = Math.PI / 2;
    dialCenter.position.set(0.15, 1.63, 1.37);
    machine.add(dialCenter);

    // ============================================================
    // DISPLAY
    // ============================================================
    const display = createRoundedBox(0.92, 0.48, 0.06, 0.04, darkPurpleGlass);
    display.position.set(1.05, 1.63, 1.3);
    machine.add(display);

    // ============================================================
    // DIGITAL DISPLAY TEXTURE
    // ============================================================
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#2e1065";
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = "#f472b6";
      ctx.font = "bold 80px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("01:20", 256, 105);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "22px Arial";
      ctx.fillText("BLUE CARE WASH", 256, 185);
    }

    const displayTexture = new THREE.CanvasTexture(canvas);
    displayTexture.colorSpace = THREE.SRGBColorSpace;

    const displayText = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.35),
      new THREE.MeshBasicMaterial({ map: displayTexture })
    );
    displayText.position.set(1.05, 1.63, 1.345);
    machine.add(displayText);

    // ============================================================
    // DOOR OUTER RING (PURPLE) & CHROME RING & TINTED GLASS
    // ============================================================
    const doorOuter = new THREE.Mesh(
      new THREE.TorusGeometry(1.24, 0.2, 32, 96),
      purpleMaterial
    );
    doorOuter.position.set(0, -0.25, 1.27);
    machine.add(doorOuter);

    const chromeRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.03, 0.085, 32, 96),
      chromeMaterial
    );
    chromeRing.position.set(0, -0.25, 1.43);
    machine.add(chromeRing);

    const glass = new THREE.Mesh(
      new THREE.CircleGeometry(0.97, 64),
      glassMaterial
    );
    glass.position.set(0, -0.25, 1.48);
    machine.add(glass);

    // ============================================================
    // DRUM GROUP & CYLINDER
    // ============================================================
    const drum = new THREE.Group();
    drum.position.set(0, -0.25, 1.52);
    machine.add(drum);

    const drumMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const drumCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.38, 64, 1, true),
      drumMaterial
    );
    drumCylinder.rotation.x = Math.PI / 2;
    drum.add(drumCylinder);

    const drumBack = new THREE.Mesh(
      new THREE.CircleGeometry(0.78, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.5,
        roughness: 0.3,
      })
    );
    drumBack.position.z = -0.18;
    drum.add(drumBack);

    const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x020617 });

    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const radius = 0.25 + Math.random() * 0.46;
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(0.022, 8),
        holeMaterial
      );
      hole.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0.01
      );
      drum.add(hole);
    }

    // ============================================================
    // REAL 3D CLOTHES INSIDE WASHING MACHINE (INCLUDING LIGHT PINK CLOTHES)
    // ============================================================
    const clothes = new THREE.Group();
    drum.add(clothes);

    // 👕 1. Light Pink T-Shirt
    const pinkTShirt = createTShirt(0xf472b6);
    pinkTShirt.position.set(-0.2, 0.15, 0.05);
    pinkTShirt.rotation.set(0.4, -0.3, 0.2);
    clothes.add(pinkTShirt);

    // 👕 2. White T-Shirt
    const whiteTShirt = createTShirt(0xffffff);
    whiteTShirt.position.set(0.18, -0.1, 0.08);
    whiteTShirt.rotation.set(-0.2, 0.5, -0.4);
    clothes.add(whiteTShirt);

    // 👕 3. Royal Blue T-Shirt
    const blueTShirt = createTShirt(0x2563eb);
    blueTShirt.position.set(0.02, -0.22, 0.02);
    blueTShirt.rotation.set(0.3, 0.1, -0.5);
    clothes.add(blueTShirt);

    // 👖 4. Denim Blue Trouser / Jeans
    const denimTrouser = createTrouser(0x1e3a8a);
    denimTrouser.position.set(0.05, 0.22, -0.02);
    denimTrouser.rotation.set(0.5, 0.2, 0.8);
    clothes.add(denimTrouser);

    // 🧦 5. Light Pink Sock
    const pinkSock = createSock(0xfbcfe8);
    pinkSock.position.set(0.28, 0.2, 0.1);
    pinkSock.rotation.set(0.6, 0.8, -0.5);
    clothes.add(pinkSock);

    // 🧦 6. Cyan Sock
    const cyanSock = createSock(0x06b6d4);
    cyanSock.position.set(-0.3, -0.02, 0.09);
    cyanSock.rotation.set(-0.5, -0.4, 0.7);
    clothes.add(cyanSock);

    // ============================================================
    // WATER & RIPPLES (CRYSTAL BLUE WATER INSIDE DRUM)
    // ============================================================
    const water = new THREE.Group();
    water.position.z = 0.22;
    drum.add(water);

    // 🌊 Crystal Blue Water Material
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      transmission: 0.5,
      roughness: 0.04,
      ior: 1.333,
      clearcoat: 1,
    });

    const waterSurface = new THREE.Mesh(
      new THREE.CircleGeometry(0.72, 64),
      waterMaterial
    );
    waterSurface.rotation.x = 0.25;
    water.add(waterSurface);

    // Blue Ripples
    const ripples: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const ripple = new THREE.Mesh(
        new THREE.TorusGeometry(0.27 + i * 0.14, 0.012, 12, 48),
        new THREE.MeshBasicMaterial({
          color: 0x7dd3fc,
          transparent: true,
          opacity: 0.45,
        })
      );
      ripple.position.z = 0.02 + i * 0.01;
      water.add(ripple);
      ripples.push(ripple);
    }

    // ============================================================
    // DOOR REFLECTION & SERVICE PANEL & FEET
    // ============================================================
    const reflection = new THREE.Mesh(
      new THREE.TorusGeometry(0.84, 0.018, 12, 64, Math.PI * 0.75),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
      })
    );
    reflection.position.set(-0.05, -0.25, 1.55);
    reflection.rotation.z = 0.55;
    machine.add(reflection);

    const servicePanel = createRoundedBox(0.85, 0.5, 0.07, 0.04, purpleMaterial);
    servicePanel.position.set(0.85, -1.8, 1.2);
    machine.add(servicePanel);

    const footMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3b0764,
      metalness: 0.75,
      roughness: 0.3,
    });

    [-1.25, 1.25].forEach((x) => {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.16, 24),
        footMaterial
      );
      foot.position.set(x, -2.28, 0.75);
      machine.add(foot);
    });

    // ============================================================
    // WATER ARC & DROPLETS (LIGHT PINK & BLUE HYBRID ORBIT)
    // ============================================================
    const waterOrbit = new THREE.Group();
    machine.add(waterOrbit);

    // 🌸 Light Pink Water Orbit Arc
    const waterArc = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.045, 12, 100, Math.PI * 1.45),
      new THREE.MeshPhysicalMaterial({
        color: 0xf472b6,
        emissive: 0xdb2777,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.75,
        transmission: 0.4,
        roughness: 0.08,
        clearcoat: 1,
      })
    );
    waterArc.rotation.x = Math.PI / 2.8;
    waterArc.rotation.z = -0.4;
    waterArc.position.y = -0.15;
    waterOrbit.add(waterArc);

    const droplets: {
      mesh: THREE.Mesh;
      angle: number;
      radius: number;
      speed: number;
      y: number;
    }[] = [];

    // Blue & Pink Water Droplets
    for (let i = 0; i < 16; i++) {
      const isPinkDrop = i % 2 === 0;
      const dropletMaterial = new THREE.MeshPhysicalMaterial({
        color: isPinkDrop ? 0xfbcfe8 : 0x93c5fd,
        transparent: true,
        opacity: 0.75,
        transmission: 0.65,
        roughness: 0.04,
        ior: 1.333,
      });

      const drop = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 12, 12),
        dropletMaterial
      );
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.05 + Math.random() * 0.6;
      const y = (Math.random() - 0.5) * 2.2;

      drop.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      machine.add(drop);

      droplets.push({
        mesh: drop,
        angle,
        radius,
        speed: 0.25 + Math.random() * 0.5,
        y,
      });
    }

    // ============================================================
    // RAYCASTER & EXCLUSIVE MACHINE DRAG ROTATION (NO AUTO SPIN)
    // ============================================================
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let userRotationY = -0.12;
    let userRotationX = 0;

    // Helper to check if pointer is over the 3D washing machine
    const checkIntersection = (clientX: number, clientY: number) => {
      mouseVector.x = (clientX / window.innerWidth) * 2 - 1;
      mouseVector.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);
      const intersects = raycaster.intersectObject(machine, true);
      return intersects.length > 0;
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (checkIntersection(clientX, clientY)) {
        isDragging = true;
        previousMouseX = clientX;
        previousMouseY = clientY;
        renderer.domElement.style.cursor = "grabbing";
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Update cursor when hovering over the machine
      if (!isDragging) {
        const isOverMachine = checkIntersection(clientX, clientY);
        renderer.domElement.style.cursor = isOverMachine ? "grab" : "default";
      } else {
        const deltaX = clientX - previousMouseX;
        const deltaY = clientY - previousMouseY;

        // Smooth 360-degree rotation when dragging directly on the machine
        userRotationY += deltaX * 0.012;
        userRotationX += deltaY * 0.006;
        userRotationX = Math.max(-0.6, Math.min(0.6, userRotationX));

        previousMouseX = clientX;
        previousMouseY = clientY;
      }
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = "grab";
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    window.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      machine.scale.setScalar(getBaseScale());
    };
    window.addEventListener("resize", handleResize);

    // ============================================================
    // ANIMATION STATE & ZIG-ZAG SCROLL MOTION LOOP
    // ============================================================
    const clock = new THREE.Clock();
    let animationFrameId = 0;
    let currentX = 2.5;
    let currentY = 0.1;
    let visibility = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // POSITION BASED ON PAGE SCROLL
      const scrollHeight = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scroll = THREE.MathUtils.clamp(
        window.scrollY / scrollHeight,
        0,
        1
      );

      // SCROLL VISIBILITY TARGET (Disappears smoothly near why-choose-us / bottom)
      const whySection = document.getElementById("why-choose-us");
      let shouldHide = scroll > 0.55;

      if (whySection) {
        const rect = whySection.getBoundingClientRect();
        const middle = rect.top + rect.height / 2;
        shouldHide = shouldHide || middle <= window.innerHeight / 2;
      }

      const targetVisibility = shouldHide ? 0 : 1;
      visibility += (targetVisibility - visibility) * 0.08;

      // 🌀 ZIG-ZAG SCROLL MOVEMENT PATH
      // Oscillates in a smooth Zig-Zag wave pattern (Right -> Left -> Right -> Left) as you scroll!
      const normalizedScroll = THREE.MathUtils.clamp(scroll / 0.55, 0, 1);
      const zigZagWave = Math.sin(normalizedScroll * Math.PI * 3.0);
      const targetX = 2.4 * Math.cos(normalizedScroll * Math.PI * 1.5) + zigZagWave * 0.8;
      const targetY = 0.1 - normalizedScroll * 2.2;

      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;

      machine.position.x = currentX;
      machine.position.y = currentY + Math.sin(time * 1.4) * 0.035;

      // Rotation updates strictly from user drag (NO automatic spin)
      machine.rotation.y = userRotationY;
      machine.rotation.x = userRotationX;

      // Scale smoothly reduces to 0 when disappearing
      machine.scale.setScalar(getBaseScale() * visibility);

      // DRUM & REAL CLOTHES TUMBLING ANIMATION
      drum.rotation.z = time * 1.25;

      clothes.children.forEach((cloth, index) => {
        cloth.rotation.x += 0.012;
        cloth.rotation.y += 0.015;
        cloth.position.y += Math.sin(time * 2.5 + index) * 0.0012;
      });

      // WATER & RIPPLES ANIMATION (BLUE WATER)
      water.rotation.z = time * 0.75;
      ripples.forEach((ripple, index) => {
        const pulse = 1 + Math.sin(time * 2 + index) * 0.055;
        ripple.scale.setScalar(pulse);
      });

      // WATER ARC & DROPLETS
      waterOrbit.rotation.y = time * 0.15;
      waterArc.rotation.z = -0.4 + Math.sin(time * 0.7) * 0.06;

      droplets.forEach((drop, index) => {
        drop.angle += 0.0018 * drop.speed;
        drop.mesh.position.x = Math.cos(drop.angle) * drop.radius;
        drop.mesh.position.z = Math.sin(drop.angle) * drop.radius;
        drop.mesh.position.y = drop.y + Math.sin(time * 1.5 + index) * 0.06;
      });

      renderer.render(scene, camera);
    };

    animate();

    // ============================================================
    // CLEANUP
    // ============================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);

      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      window.removeEventListener("resize", handleResize);

      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          materials.forEach((material) => {
            material.dispose();
            if ("map" in material && (material as any).map) {
              (material as any).map.dispose();
            }
          });
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-20 overflow-hidden pointer-events-none"
      aria-label="Interactive 3D Zig-Zag Scroll Washing Machine"
    />
  );
}
