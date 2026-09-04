"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CinematicWashingMachineIntro() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [skipHovered, setSkipHovered] = useState(false);
  const [introPhaseText, setIntroPhaseText] = useState("Initializing Wash & Well 3D Engine...");

  useEffect(() => {
    // 1. Session Persistence & Reduced Motion Check
    if (typeof window !== "undefined") {
      const hasSeenIntro = sessionStorage.getItem("goclean_intro_seen");
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (hasSeenIntro === "true" || prefersReducedMotion) {
        setIsFinished(true);
        return;
      }
    }

    // Lock body scroll during cinematic intro
    document.body.style.overflow = "hidden";

    if (!containerRef.current) return;
    const container = containerRef.current;
    let animationFrameId: number;

    // ═════════════════════════════════════════════════════════════════
    // 1. THREE.JS SCENE, CAMERA & RENDERER
    // ═════════════════════════════════════════════════════════════════
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a051b, 0.03);

    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0.6, 0.3, 8.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      precision: "highp",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // ═════════════════════════════════════════════════════════════════
    // 2. STUDIO LIGHTING & WARM DRUM ILLUMINATION
    // ═════════════════════════════════════════════════════════════════
    const ambientLight = new THREE.AmbientLight(0x8b5cf6, 1.8);
    scene.add(ambientLight);

    const mainStudioLight = new THREE.DirectionalLight(0xffffff, 3.4);
    mainStudioLight.position.set(6, 9, 7);
    mainStudioLight.castShadow = true;
    scene.add(mainStudioLight);

    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    cyanRimLight.position.set(-6, -2, 4);
    scene.add(cyanRimLight);

    // Warm Copper/Amber Drum Interior Illumination (Matching uploaded image)
    const warmCopperDrumLight = new THREE.PointLight(0xf97316, 7, 7);
    warmCopperDrumLight.position.set(-0.05, -0.2, 0.5);
    scene.add(warmCopperDrumLight);

    // ═════════════════════════════════════════════════════════════════
    // 3. 3D MODEL MATCHING UPLOADED WASHING MACHINE IMAGE
    // ═════════════════════════════════════════════════════════════════
    const machineMasterGroup = new THREE.Group();
    scene.add(machineMasterGroup);

    // Initial slight angled rotation to match image perspective
    machineMasterGroup.rotation.y = -0.25;

    // Materials
    const cleanWhiteCabinetMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.15,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    const darkGreyDoorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.25,
    });

    const polishedSilverChromeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.08,
    });

    const warmCopperDrumMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.92,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const blueTowelMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.8,
      sheen: 0.6,
    });

    const orangeTowelMat = new THREE.MeshPhysicalMaterial({
      color: 0xea580c,
      roughness: 0.8,
      sheen: 0.6,
    });

    const whiteTowelMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
      sheen: 0.6,
    });

    const lightBlueDrapeClothMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      roughness: 0.75,
      sheen: 0.5,
    });

    // 3A. Main Clean White Cabinet Body
    const cabinetBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 2.4, 1.75),
      cleanWhiteCabinetMat
    );
    cabinetBody.castShadow = true;
    cabinetBody.receiveShadow = true;
    machineMasterGroup.add(cabinetBody);

    // Dark Base Platform Pedestal
    const basePedestal = new THREE.Mesh(
      new THREE.BoxGeometry(2.14, 0.12, 1.79),
      darkGreyDoorFrameMat
    );
    basePedestal.position.y = -1.22;
    machineMasterGroup.add(basePedestal);

    // 3B. Stacked Folded Towels on Top Cabinet (Matching Uploaded Image)
    const stackedTowelsGroup = new THREE.Group();
    stackedTowelsGroup.position.set(0.35, 1.35, -0.1);
    machineMasterGroup.add(stackedTowelsGroup);

    // Folded Blue Towel (Top Layer)
    const blueTowel = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.12, 1.1),
      blueTowelMat
    );
    blueTowel.position.y = 0.16;
    stackedTowelsGroup.add(blueTowel);

    // Folded Orange Towel (Middle Layer)
    const orangeTowel = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.12, 1.15),
      orangeTowelMat
    );
    orangeTowel.position.y = 0.04;
    stackedTowelsGroup.add(orangeTowel);

    // Folded White Towel (Base Layer)
    const whiteTowel = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.1, 1.2),
      whiteTowelMat
    );
    whiteTowel.position.y = -0.07;
    stackedTowelsGroup.add(whiteTowel);

    // 3C. Top Control Panel Header with Dial & Screen
    const controlPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.44, 0.09),
      cleanWhiteCabinetMat
    );
    controlPanel.position.set(0, 0.98, 0.86);
    machineMasterGroup.add(controlPanel);

    // Detergent Drawer (Left)
    const detergentDrawer = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.28, 0.05),
      cleanWhiteCabinetMat
    );
    detergentDrawer.position.set(-0.62, 0.98, 0.88);
    machineMasterGroup.add(detergentDrawer);

    // Metallic Rotary Knob (Middle)
    const dialKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.08, 36),
      polishedSilverChromeMat
    );
    dialKnob.rotation.x = Math.PI / 2;
    dialKnob.position.set(0.04, 0.98, 0.89);
    machineMasterGroup.add(dialKnob);

    // Digital Display Screen (Right)
    const displayScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.24),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    displayScreen.position.set(0.62, 0.98, 0.9);
    machineMasterGroup.add(displayScreen);

    // 3D. Warm Copper Illuminated Inner Drum Cavity
    const drumCavityGroup = new THREE.Group();
    drumCavityGroup.position.set(-0.05, -0.2, 0.28);
    machineMasterGroup.add(drumCavityGroup);

    // Copper Perforated Inner Drum Cylinder
    const copperDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 1.2, 52, 1, true),
      warmCopperDrumMat
    );
    copperDrum.rotation.x = Math.PI / 2;
    drumCavityGroup.add(copperDrum);

    // 3E. Laundry Clothes Draping / Spilling Out from Open Drum (Matching Image)
    const drapedLaundryGroup = new THREE.Group();
    drapedLaundryGroup.position.set(0, -0.4, 0.65);
    drumCavityGroup.add(drapedLaundryGroup);

    // Light Blue Draping Cloth fold spilling over door lip
    const drapingCloth = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.65, 0.22),
      lightBlueDrapeClothMat
    );
    drapingCloth.rotation.z = -0.2;
    drapingCloth.rotation.x = 0.3;
    drapedLaundryGroup.add(drapingCloth);

    // Orange Fabric inside drum cavity
    const innerOrangeCloth = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 20, 20),
      orangeTowelMat
    );
    innerOrangeCloth.position.set(-0.1, 0.25, -0.2);
    drumCavityGroup.add(innerOrangeCloth);

    // 3F. Open Front Glass Door (Angled Left - Matching Image)
    const doorHingePivotGroup = new THREE.Group();
    doorHingePivotGroup.position.set(-0.8, -0.2, 0.88);
    machineMasterGroup.add(doorHingePivotGroup);

    // Door is swung wide open to the left by default (Matching Image)
    doorHingePivotGroup.rotation.y = -Math.PI * 0.62;

    const doorMainContainer = new THREE.Group();
    doorMainContainer.position.set(0.75, 0, 0);
    doorHingePivotGroup.add(doorMainContainer);

    // Dark Grey Metallic Outer Door Ring Frame
    const outerDoorRingFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.76, 0.12, 24, 60),
      darkGreyDoorFrameMat
    );
    doorMainContainer.add(outerDoorRingFrame);

    // Curved Convex Translucent Glass Window
    const doorGlassWindow = new THREE.Mesh(
      new THREE.SphereGeometry(0.66, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.38),
      new THREE.MeshPhysicalMaterial({
        color: 0xeff6ff,
        transmission: 0.97,
        transparent: true,
        opacity: 0.35,
        roughness: 0.02,
        ior: 1.52,
        clearcoat: 1.0,
      })
    );
    doorGlassWindow.position.z = -0.17;
    doorGlassWindow.rotation.x = Math.PI / 2;
    doorMainContainer.add(doorGlassWindow);

    // ═════════════════════════════════════════════════════════════════
    // 4. MOUSE DRAG 360-DEGREE ROTATION CONTROLS
    // ═════════════════════════════════════════════════════════════════
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = -0.25;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.006;
      targetRotationX += deltaY * 0.006;
      targetRotationX = Math.max(-0.4, Math.min(0.4, targetRotationX));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // ═════════════════════════════════════════════════════════════════
    // 5. ANIMATION & CAMERA TIMELINE
    // ═════════════════════════════════════════════════════════════════
    const clock = new THREE.Clock();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        completeIntro();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const completeIntro = () => {
      sessionStorage.setItem("goclean_intro_seen", "true");
      document.body.style.overflow = "";
      setIsFinished(true);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth Mouse Drag Interpolation
      machineMasterGroup.rotation.y += (targetRotationY - machineMasterGroup.rotation.y) * 0.08;
      machineMasterGroup.rotation.x += (targetRotationX - machineMasterGroup.rotation.x) * 0.08;

      // Slow drum spin inside warm copper cavity
      copperDrum.rotation.z = elapsed * 1.5;

      // Floating gentle bobbing
      machineMasterGroup.position.y = Math.sin(elapsed * 2.0) * 0.04;

      // Intro text timeline updates
      if (elapsed < 3.0) {
        setIntroPhaseText("Loaded Fresh Fabrics & Towels...");
      } else if (elapsed < 7.0) {
        setIntroPhaseText("Warm Copper Drum & Fabric Care Active...");
      } else if (elapsed < 11.0) {
        setIntroPhaseText("Entering Wash & Well Platform...");
        const camP = (elapsed - 7.0) / 4.0;
        camera.position.x = 0.6 - camP * 0.65;
        camera.position.y = 0.3 - camP * 0.5;
        camera.position.z = 8.2 - camP * 6.5;
      } else {
        completeIntro();
        return;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (isFinished) return null;

  const handleSkip = () => {
    sessionStorage.setItem("goclean_intro_seen", "true");
    document.body.style.overflow = "";
    setIsFinished(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#170830] via-[#0d041e] to-[#04010a] flex items-center justify-center pointer-events-auto select-none overflow-hidden transition-opacity duration-700 font-sans">
      
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing" title="Click & Drag to Rotate 3D Machine" />

      {/* Atmospheric Ambient Glow Radiance */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.28)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Top Header Brand Badge */}
      <div className="absolute top-6 left-6 lg:left-10 z-20 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-amber-400 p-0.5 shadow-lg shadow-purple-500/30">
          <div className="w-full h-full bg-[#0d041e] rounded-[14px] flex items-center justify-center text-white font-black text-xl">
            W
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-white font-black text-sm tracking-wider uppercase drop-shadow">
              Wash & Well
            </h2>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase rounded border border-amber-500/30">
              3D Fabric Model
            </span>
          </div>
          <p className="text-[11px] text-purple-300/80 font-mono font-semibold">
            Interactive Commercial Laundry Tech
          </p>
        </div>
      </div>

      {/* Skip Intro Glass Button */}
      <div className="absolute top-6 right-6 lg:right-10 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          onMouseEnter={() => setSkipHovered(true)}
          onMouseLeave={() => setSkipHovered(false)}
          className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-xl border border-white/20 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.3)] group cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>Skip Intro</span>
          <ArrowRight
            className={`w-3.5 h-3.5 text-purple-300 transition-transform duration-300 ${
              skipHovered ? "translate-x-1" : ""
            }`}
          />
        </button>
      </div>

      {/* Bottom Interactive Status Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-3 bg-purple-950/70 backdrop-blur-md border border-purple-500/30 px-5 py-2 rounded-full shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[12px] font-mono font-bold text-amber-200 tracking-wider uppercase">
            {introPhaseText}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-purple-300/70 font-mono">
          <span>Click & Drag to rotate 3D Model</span>
          <span>•</span>
          <span>Press ESC to skip</span>
        </div>
      </div>
    </div>
  );
}
