import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ShowcaseBrain3DProps {
  showWT: boolean;
  showTC: boolean;
  showET: boolean;
  className?: string;
}

export const ShowcaseBrain3D: React.FC<ShowcaseBrain3DProps> = ({
  showWT,
  showTC,
  showET,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const brainGroupRef = useRef<THREE.Group | null>(null);

  // Mesh refs for dynamic toggles
  const wtMeshRef = useRef<THREE.Mesh | null>(null);
  const tcMeshRef = useRef<THREE.Mesh | null>(null);
  const etMeshRef = useRef<THREE.Mesh | null>(null);
  const tumourBeaconRef = useRef<THREE.Line | null>(null);

  // Sync tumour visibility when props change
  useEffect(() => {
    if (wtMeshRef.current) wtMeshRef.current.visible = showWT;
    if (tcMeshRef.current) tcMeshRef.current.visible = showTC;
    if (etMeshRef.current) etMeshRef.current.visible = showET;
    if (tumourBeaconRef.current) tumourBeaconRef.current.visible = showWT || showTC || showET;
  }, [showWT, showTC, showET]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Scene & Camera setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 15, 115);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Master group holding brain and tumour
    const brainGroup = new THREE.Group();
    // Tilt slightly forward to showcase superior gyri and lateral contour
    brainGroup.rotation.x = 0.25;
    scene.add(brainGroup);
    brainGroupRef.current = brainGroup;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    keyLight.position.set(80, 100, 90);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 1.2);
    fillLight.position.set(-80, -40, -60);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x06b6d4, 1.5, 300);
    rimLight.position.set(0, 80, -90);
    scene.add(rimLight);

    // Build anatomical human brain hemispheres
    const createHemisphere = (isLeft: boolean): THREE.Mesh => {
      const geom = new THREE.SphereGeometry(32, 64, 48);
      const pos = geom.attributes.position;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        vertex.fromBufferAttribute(pos, i);

        // Anthropomorphic proportions:
        // X = Lateral, Y = Superior-Inferior, Z = Anterior-Posterior
        vertex.x *= 0.68; // Lateral hemisphere width
        vertex.y *= 0.88; // Superior-Inferior height
        vertex.z *= 1.18; // Anterior-Posterior length

        // Flatten medial longitudinal fissure
        const medialSign = isLeft ? 1 : -1;
        if (vertex.x * medialSign < 0) {
          vertex.x *= 0.35; // Sharp medial flattening at sagittal midline
        }

        // Cortical gyri and sulci wave displacements
        const g1 = Math.sin(vertex.x * 0.28) * Math.cos(vertex.y * 0.28) * Math.sin(vertex.z * 0.28);
        const g2 = Math.sin(vertex.x * 0.55 + 1.2) * Math.cos(vertex.z * 0.55);
        const fold = g1 * 2.2 + g2 * 0.9;
        vertex.addScaledVector(vertex.clone().normalize(), fold);

        // Frontal lobe anterior curvature
        if (vertex.z > 15) {
          vertex.y *= 0.95;
          vertex.x *= 0.92;
        }

        // Temporal lobe inferior bulge
        if (vertex.y < -5 && vertex.z > -8 && Math.abs(vertex.x) > 8) {
          vertex.y -= 2.5;
          vertex.x *= 1.08;
        }

        // Occipital lobe posterior tapering
        if (vertex.z < -18) {
          vertex.x *= 0.88;
          vertex.y *= 0.92;
        }

        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      geom.computeVertexNormals();

      // Translucent medical cortex material
      const mat = new THREE.MeshStandardMaterial({
        color: 0x334155, // Slate cortex
        roughness: 0.35,
        metalness: 0.15,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geom, mat);
      // Offset slightly away from sagittal midline
      mesh.position.x = isLeft ? 1.8 : -1.8;
      return mesh;
    };

    const leftHemi = createHemisphere(true);
    const rightHemi = createHemisphere(false);
    brainGroup.add(leftHemi);
    brainGroup.add(rightHemi);

    // Anatomical Brainstem & Cerebellum (inferior posterior)
    const cerebellumGeom = new THREE.SphereGeometry(14, 32, 24);
    cerebellumGeom.scale(1.4, 0.75, 0.9);
    const cbPos = cerebellumGeom.attributes.position;
    const cbV = new THREE.Vector3();
    for (let i = 0; i < cbPos.count; i++) {
      cbV.fromBufferAttribute(cbPos, i);
      const folia = Math.sin(cbV.y * 1.5) * 0.6;
      cbV.addScaledVector(cbV.clone().normalize(), folia);
      cbPos.setXYZ(i, cbV.x, cbV.y, cbV.z);
    }
    cerebellumGeom.computeVertexNormals();

    const cbMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const cerebellum = new THREE.Mesh(cerebellumGeom, cbMat);
    cerebellum.position.set(0, -18, -16);
    brainGroup.add(cerebellum);

    // --- "SMOL IDENTIFIABLE TUMOUR" ---
    // Placed in right subcortical parietal region
    const tumourOrigin = new THREE.Vector3(14, 6, 8);
    const tumourContainer = new THREE.Group();
    tumourContainer.position.copy(tumourOrigin);
    brainGroup.add(tumourContainer);

    // 1. Whole Tumour (WT) - Cyan outer boundary
    const wtGeom = new THREE.SphereGeometry(8.5, 32, 32);
    const wtPos = wtGeom.attributes.position;
    const wtV = new THREE.Vector3();
    for (let i = 0; i < wtPos.count; i++) {
      wtV.fromBufferAttribute(wtPos, i);
      const lump = Math.sin(wtV.x * 0.8) * Math.cos(wtV.y * 0.8) * 1.2;
      wtV.addScaledVector(wtV.clone().normalize(), lump);
      wtPos.setXYZ(i, wtV.x, wtV.y, wtV.z);
    }
    wtGeom.computeVertexNormals();
    const wtMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      emissive: 0x0891b2,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.75,
    });
    const wtMesh = new THREE.Mesh(wtGeom, wtMat);
    tumourContainer.add(wtMesh);
    wtMeshRef.current = wtMesh;

    // 2. Tumour Core (TC) - Violet core
    const tcGeom = new THREE.SphereGeometry(5.6, 28, 28);
    const tcMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // Violet
      emissive: 0x7c3aed,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const tcMesh = new THREE.Mesh(tcGeom, tcMat);
    tumourContainer.add(tcMesh);
    tcMeshRef.current = tcMesh;

    // 3. Enhancing Tumour (ET) - Amber active rim
    const etGeom = new THREE.SphereGeometry(3.4, 24, 24);
    const etMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Gold
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.95,
    });
    const etMesh = new THREE.Mesh(etGeom, etMat);
    tumourContainer.add(etMesh);
    etMeshRef.current = etMesh;

    // Floating Target Pointer Line from Tumour to Callout
    const pointerPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(12, 16, 12),
      new THREE.Vector3(24, 16, 12),
    ];
    const pointerGeom = new THREE.BufferGeometry().setFromPoints(pointerPoints);
    const pointerMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      linewidth: 2,
    });
    const pointerLine = new THREE.Line(pointerGeom, pointerMat);
    tumourContainer.add(pointerLine);
    tumourBeaconRef.current = pointerLine;

    // Target callout beacon pulsing sprite
    const beaconCanvas = document.createElement('canvas');
    beaconCanvas.width = 128;
    beaconCanvas.height = 128;
    const ctx = beaconCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
      grad.addColorStop(0, 'rgba(245, 158, 11, 1)');
      grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.7)');
      grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(64, 64, 60, 0, Math.PI * 2);
      ctx.fill();
    }
    const beaconTexture = new THREE.CanvasTexture(beaconCanvas);
    const beaconSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: beaconTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
      })
    );
    beaconSprite.scale.set(16, 16, 1);
    tumourContainer.add(beaconSprite);

    // Initial visibility sync
    wtMesh.visible = showWT;
    tcMesh.visible = showTC;
    etMesh.visible = showET;

    // Animation & Smooth Auto-Rotation Loop
    let animId = 0;
    let clock = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.018;

      // Auto-rotation around Y axis unless user is dragging
      if (!isDraggingRef.current && brainGroupRef.current) {
        brainGroupRef.current.rotation.y += 0.007;
      }

      // Gentle tumour breathing pulse effect
      if (tumourContainer) {
        const pulse = 1.0 + Math.sin(clock * 3) * 0.08;
        tumourContainer.scale.set(pulse, pulse, pulse);
      }

      // Sprite gentle glow oscillation
      if (beaconSprite) {
        const glow = 14 + Math.sin(clock * 4) * 3;
        beaconSprite.scale.set(glow, glow, 1);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Mouse Drag-to-Rotate Interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !brainGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      brainGroupRef.current.rotation.y += deltaX * 0.008;
      brainGroupRef.current.rotation.x = Math.max(
        -0.8,
        Math.min(0.8, brainGroupRef.current.rotation.x + deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
      geomDispose(scene);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full cursor-grab active:cursor-grabbing ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

// Helper to dispose geometries and materials
function geomDispose(obj: THREE.Object3D) {
  obj.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
    }
  });
}
