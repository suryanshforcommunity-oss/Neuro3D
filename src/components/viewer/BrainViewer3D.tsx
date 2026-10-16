import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Maximize2,
  Sliders,
  Scissors,
  Grid,
  Crosshair as CrosshairIcon,
  ShieldAlert,
} from 'lucide-react';
import {
  RegionVisibility,
  RegionOpacity,
  ClippingPlanes,
  WorldCoordinate,
  VoxelCoordinate,
  VolumeDimensions,
  VoxelSpacing,
} from '../../types';
import { TumourLegend } from './TumourLegend';

interface BrainViewer3DProps {
  visibility: RegionVisibility;
  opacity: RegionOpacity;
  clipping: ClippingPlanes;
  onToggleVisibility: (key: keyof RegionVisibility) => void;
  onChangeOpacity: (key: keyof RegionOpacity, value: number) => void;
  onChangeClipping: (clipping: ClippingPlanes) => void;
  worldCoordinate: WorldCoordinate;
  voxelCoordinate: VoxelCoordinate;
  dimensions: VolumeDimensions;
  spacing: VoxelSpacing;
  isDemoMode: boolean;
  hasSegmentation: boolean;
  onResetCamera: () => void;
}

export const BrainViewer3D: React.FC<BrainViewer3DProps> = ({
  visibility,
  opacity,
  clipping,
  onToggleVisibility,
  onChangeOpacity,
  onChangeClipping,
  worldCoordinate,
  voxelCoordinate,
  dimensions,
  spacing,
  isDemoMode,
  hasSegmentation,
  onResetCamera,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<{
    brainSurface?: THREE.Mesh;
    wtMesh?: THREE.Mesh;
    tcMesh?: THREE.Mesh;
    etMesh?: THREE.Mesh;
    crosshairGroup?: THREE.Group;
    clipPlane?: THREE.Plane;
  }>({});

  const [showClippingControls, setShowClippingControls] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Orbit control state
  const isDragging = useRef<boolean>(false);
  const dragButton = useRef<number>(0);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRotation = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: 170,
  });
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Initialize Three.js scene once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b12);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f2fe, 0.9);
    dirLight1.position.set(100, 150, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b5cf6, 0.7);
    dirLight2.position.set(-100, -50, -100);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0xffffff, 0.5, 300);
    rimLight.position.set(0, 120, -100);
    scene.add(rimLight);

    // Anatomical Brain Surface Geometry (Procedural cortical hemispheres)
    const brainGeom = new THREE.SphereGeometry(46, 64, 48);
    const posAttr = brainGeom.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);

      // Elongate in A-P axis (Y) and flatten slightly in S-I (Z)
      vertex.x *= 0.85; // Lateral width
      vertex.y *= 1.15; // Anterior-Posterior length
      vertex.z *= 0.90; // Superior-Inferior height

      // Interhemispheric longitudinal fissure indent
      const distFromMidline = Math.abs(vertex.x);
      if (distFromMidline < 7) {
        vertex.x *= 0.75 + (distFromMidline / 7) * 0.25;
        if (vertex.z > 0) {
          vertex.z -= Math.cos((distFromMidline / 7) * (Math.PI / 2)) * 4.5;
        }
      }

      // Procedural gyri and sulci wave displacements
      const gyriFreq = 0.22;
      const wave =
        Math.sin(vertex.x * gyriFreq) *
        Math.cos(vertex.y * gyriFreq) *
        Math.sin(vertex.z * gyriFreq);
      vertex.addScaledVector(vertex.clone().normalize(), wave * 2.2);

      // Temporal lobe anterior bulge
      if (vertex.z < -10 && vertex.y > 0 && Math.abs(vertex.x) > 15) {
        vertex.y += 3.5;
      }

      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    brainGeom.computeVertexNormals();

    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1000);
    meshesRef.current.clipPlane = clipPlane;

    const brainMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.15,
      transparent: true,
      opacity: opacity.brainSurface,
      wireframe: visibility.wireframe,
      side: THREE.DoubleSide,
      clippingPlanes: [clipPlane],
    });

    const brainMesh = new THREE.Mesh(brainGeom, brainMaterial);
    scene.add(brainMesh);
    meshesRef.current.brainSurface = brainMesh;

    // Tumour meshes (nested: WT > TC > ET)
    // Placed in right hemisphere (X > 0, slightly anterior and superior)
    const tumourCenter = new THREE.Vector3(18, 6, 4);

    // WT (Whole Tumour) - Cyan
    const wtGeom = new THREE.SphereGeometry(15, 36, 36);
    const wtPos = wtGeom.attributes.position;
    for (let i = 0; i < wtPos.count; i++) {
      vertex.fromBufferAttribute(wtPos, i);
      vertex.x *= 1.1;
      vertex.y *= 1.25;
      const noise = Math.sin(vertex.x * 0.4) * Math.cos(vertex.y * 0.4) * 1.8;
      vertex.addScaledVector(vertex.clone().normalize(), noise);
      wtPos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    wtGeom.computeVertexNormals();
    const wtMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: opacity.wt,
      wireframe: visibility.wireframe,
      clippingPlanes: [clipPlane],
    });
    const wtMesh = new THREE.Mesh(wtGeom, wtMat);
    wtMesh.position.copy(tumourCenter);
    scene.add(wtMesh);
    meshesRef.current.wtMesh = wtMesh;

    // TC (Tumour Core) - Violet
    const tcGeom = new THREE.SphereGeometry(10.5, 32, 32);
    const tcMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // Violet
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: opacity.tc,
      wireframe: visibility.wireframe,
      clippingPlanes: [clipPlane],
    });
    const tcMesh = new THREE.Mesh(tcGeom, tcMat);
    tcMesh.position.copy(tumourCenter);
    scene.add(tcMesh);
    meshesRef.current.tcMesh = tcMesh;

    // ET (Enhancing Tumour) - Amber
    const etGeom = new THREE.SphereGeometry(6.8, 28, 28);
    const etMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: opacity.et,
      wireframe: visibility.wireframe,
      clippingPlanes: [clipPlane],
    });
    const etMesh = new THREE.Mesh(etGeom, etMat);
    etMesh.position.copy(tumourCenter);
    scene.add(etMesh);
    meshesRef.current.etMesh = etMesh;

    // 3D Synchronized Crosshair Indicator
    const crosshairGroup = new THREE.Group();
    const axisMatX = new THREE.LineBasicMaterial({ color: 0xff3b30, linewidth: 2 });
    const axisMatY = new THREE.LineBasicMaterial({ color: 0x34c759, linewidth: 2 });
    const axisMatZ = new THREE.LineBasicMaterial({ color: 0x007aff, linewidth: 2 });

    const geomX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-14, 0, 0), new THREE.Vector3(14, 0, 0)]);
    const geomY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -14, 0), new THREE.Vector3(0, 14, 0)]);
    const geomZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -14), new THREE.Vector3(0, 0, 14)]);

    crosshairGroup.add(new THREE.Line(geomX, axisMatX));
    crosshairGroup.add(new THREE.Line(geomY, axisMatY));
    crosshairGroup.add(new THREE.Line(geomZ, axisMatZ));

    // Center focal bead
    const beadGeom = new THREE.SphereGeometry(1.4, 16, 16);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    crosshairGroup.add(new THREE.Mesh(beadGeom, beadMat));

    scene.add(crosshairGroup);
    meshesRef.current.crosshairGroup = crosshairGroup;

    // Animation render loop
    let animationFrameId: number;
    const updateCamera = () => {
      const { theta, phi, radius } = cameraRotation.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      camera.position.set(x, y, z).add(cameraTarget.current);
      camera.lookAt(cameraTarget.current);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      updateCamera();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update visibility and opacity
  useEffect(() => {
    const { brainSurface, wtMesh, tcMesh, etMesh, crosshairGroup } = meshesRef.current;

    if (brainSurface) {
      brainSurface.visible = visibility.brainSurface;
      (brainSurface.material as THREE.MeshStandardMaterial).opacity = opacity.brainSurface;
      (brainSurface.material as THREE.MeshStandardMaterial).wireframe = visibility.wireframe;
      (brainSurface.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }

    if (wtMesh) {
      wtMesh.visible = visibility.wt && hasSegmentation;
      (wtMesh.material as THREE.MeshStandardMaterial).opacity = opacity.wt;
      (wtMesh.material as THREE.MeshStandardMaterial).wireframe = visibility.wireframe;
      (wtMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }

    if (tcMesh) {
      tcMesh.visible = visibility.tc && hasSegmentation;
      (tcMesh.material as THREE.MeshStandardMaterial).opacity = opacity.tc;
      (tcMesh.material as THREE.MeshStandardMaterial).wireframe = visibility.wireframe;
      (tcMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }

    if (etMesh) {
      etMesh.visible = visibility.et && hasSegmentation;
      (etMesh.material as THREE.MeshStandardMaterial).opacity = opacity.et;
      (etMesh.material as THREE.MeshStandardMaterial).wireframe = visibility.wireframe;
      (etMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
    }

    if (crosshairGroup) {
      crosshairGroup.visible = visibility.crosshair;
    }
  }, [visibility, opacity, hasSegmentation]);

  // Synchronize 3D crosshair with current world coordinates in mm
  useEffect(() => {
    const { crosshairGroup } = meshesRef.current;
    if (crosshairGroup) {
      crosshairGroup.position.set(worldCoordinate.x, worldCoordinate.y, worldCoordinate.z);
    }
  }, [worldCoordinate]);

  // Update clipping cutaway plane
  useEffect(() => {
    const { clipPlane } = meshesRef.current;
    if (!clipPlane) return;

    if (!clipping.enabled) {
      clipPlane.constant = 1000; // Far away, no cutaway
    } else {
      // Axial cut plane along Z
      clipPlane.normal.set(0, 0, -1);
      clipPlane.constant = clipping.axial * 45;
    }
  }, [clipping]);

  // Mouse interaction event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragButton.current = e.button;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    if (dragButton.current === 0) {
      // Left click: Orbit rotate
      cameraRotation.current.theta += deltaX * 0.008;
      cameraRotation.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, cameraRotation.current.phi - deltaY * 0.008)
      );
    } else if (dragButton.current === 2) {
      // Right click: Pan
      const panSpeed = 0.12;
      cameraTarget.current.x -= deltaX * panSpeed;
      cameraTarget.current.y += deltaY * panSpeed;
    }

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
    cameraRotation.current.radius = Math.max(50, Math.min(400, cameraRotation.current.radius * zoomFactor));
  };

  const resetCamera = useCallback(() => {
    cameraRotation.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 170 };
    cameraTarget.current.set(0, 0, 0);
    onResetCamera();
  }, [onResetCamera]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#080B12] overflow-hidden select-none flex flex-col"
      onContextMenu={e => e.preventDefault()}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
        <div className="px-2.5 py-1 rounded-md bg-[#0F1423]/90 border border-slate-700/60 backdrop-blur-md text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>3D BRAIN RECONSTRUCTION</span>
        </div>
        {isDemoMode && (
          <div className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            SYNTHETIC PREVIEW MODEL
          </div>
        )}
      </div>

      {/* Floating 3D Control Bar (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={() => onToggleVisibility('wireframe')}
          className={`p-2 rounded-lg border text-xs font-medium transition backdrop-blur-md ${
            visibility.wireframe
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle wireframe mesh mode"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onToggleVisibility('crosshair')}
          className={`p-2 rounded-lg border text-xs font-medium transition backdrop-blur-md ${
            visibility.crosshair
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle 3D crosshair cursor"
        >
          <CrosshairIcon className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowClippingControls(prev => !prev)}
          className={`p-2 rounded-lg border text-xs font-medium transition backdrop-blur-md ${
            clipping.enabled || showClippingControls
              ? 'bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle 3D anatomical cutaway / clipping plane"
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={resetCamera}
          className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-slate-200 transition backdrop-blur-md"
          title="Reset 3D camera orientation and zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowLegend(prev => !prev)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-mono transition backdrop-blur-md"
        >
          {showLegend ? 'Hide Legend' : 'Show Legend'}
        </button>
      </div>

      {/* Clipping / Cutaway Controls Panel */}
      {showClippingControls && (
        <div className="absolute top-14 right-3 w-64 bg-[#0F1423]/95 backdrop-blur-md border border-[#1E293B] rounded-xl p-3 z-20 text-xs shadow-2xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-violet-400" />
              Anatomical Cutaway Plane
            </span>
            <button
              onClick={() => onChangeClipping({ ...clipping, enabled: !clipping.enabled })}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                clipping.enabled
                  ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {clipping.enabled ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Superior-Inferior Cut (Z)</span>
                <span className="font-mono text-cyan-300">{(clipping.axial * 45).toFixed(0)} mm</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                disabled={!clipping.enabled}
                value={clipping.axial}
                onChange={e => onChangeClipping({ ...clipping, axial: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic leading-tight">
              Slices through the outer cortical brain surface to visualize internal nested tumour core and enhancing rim.
            </p>
          </div>
        </div>
      )}

      {/* Permanent Tumour Legend Overlay (Bottom Left) */}
      {showLegend && (
        <div className="absolute bottom-3 left-3 w-80 max-w-[calc(100%-24px)] z-10 pointer-events-auto">
          <TumourLegend
            visibility={visibility}
            opacity={opacity}
            onToggleVisibility={onToggleVisibility}
            onChangeOpacity={onChangeOpacity}
          />
        </div>
      )}

      {/* Orbit Interaction Hint (Bottom Right) */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#0A0E18]/80 border border-slate-800/60 backdrop-blur-sm text-[10px] font-mono text-slate-400 pointer-events-none flex items-center gap-3">
        <span>Left Drag: Orbit</span>
        <span>•</span>
        <span>Wheel: Zoom</span>
        <span>•</span>
        <span>Right Drag: Pan</span>
      </div>
    </div>
  );
};
