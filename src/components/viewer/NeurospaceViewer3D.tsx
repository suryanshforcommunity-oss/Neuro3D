import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RotateCcw,
  Scissors,
  Grid,
  Crosshair as CrosshairIcon,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { SurfaceMesh, NeurospaceRegionSet } from '../../utils/marchingCubes';
import { WorldCoordinate, VoxelCoordinate } from '../../types';

const NEUROSPACE_REGION_CONFIG: Record<
  string,
  {
    color: number;
    name: string;
    depthWrite: boolean;
    renderOrder: number;
    roughness: number;
    metalness: number;
  }
> = {
  WT: {
    color: 0x38bdf8, // Cyan / Ice Blue
    name: 'Whole Tumour',
    depthWrite: false,
    renderOrder: 2,
    roughness: 0.30,
    metalness: 0.20,
  },
  TC: {
    color: 0xf59e0b, // Amber / Warm Orange
    name: 'Tumour Core',
    depthWrite: false,
    renderOrder: 3,
    roughness: 0.30,
    metalness: 0.20,
  },
  ET: {
    color: 0xef4444, // Crimson / Red
    name: 'Enhancing Tumour',
    depthWrite: true,
    renderOrder: 4,
    roughness: 0.30,
    metalness: 0.20,
  },
  TP: {
    color: 0x10b981, // Vibrant Emerald Green
    name: 'True Positive (pred ∩ expert)',
    depthWrite: true,
    renderOrder: 4,
    roughness: 0.35,
    metalness: 0.15,
  },
  FP: {
    color: 0x8b5cf6, // Violet / Purple
    name: 'False Positive (pred - expert)',
    depthWrite: false,
    renderOrder: 3,
    roughness: 0.35,
    metalness: 0.15,
  },
  FN: {
    color: 0xf59e0b, // Amber / Coral
    name: 'False Negative (expert - pred)',
    depthWrite: false,
    renderOrder: 2,
    roughness: 0.35,
    metalness: 0.15,
  },
  brain: {
    color: 0x94a3b8, // Slate cortical anatomical shell
    name: 'Patient-specific MRI anatomy',
    depthWrite: false,
    renderOrder: 1,
    roughness: 0.40,
    metalness: 0.15,
  },
};

function createCrosshairMarker(): THREE.Group {
  const markerGroup = new THREE.Group();
  markerGroup.name = 'worldCrosshairMarker';

  // Central target sphere
  const sphereGeo = new THREE.SphereGeometry(2.5, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    depthTest: false,
    transparent: true,
    opacity: 0.95,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.renderOrder = 9999;
  markerGroup.add(sphere);

  // Outer target ring
  const ringGeo = new THREE.RingGeometry(3.8, 4.6, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    depthTest: false,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.renderOrder = 9999;
  markerGroup.add(ring);

  // 3 orthogonal axis crosshair lines (25mm in each direction)
  const lineMatX = new THREE.LineBasicMaterial({ color: 0xef4444, depthTest: false, transparent: true, opacity: 0.9 });
  const lineMatY = new THREE.LineBasicMaterial({ color: 0x10b981, depthTest: false, transparent: true, opacity: 0.9 });
  const lineMatZ = new THREE.LineBasicMaterial({ color: 0x38bdf8, depthTest: false, transparent: true, opacity: 0.9 });

  const geoX = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-25, 0, 0),
    new THREE.Vector3(25, 0, 0),
  ]);
  const lineX = new THREE.Line(geoX, lineMatX);
  lineX.renderOrder = 9999;
  markerGroup.add(lineX);

  const geoY = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -25, 0),
    new THREE.Vector3(0, 25, 0),
  ]);
  const lineY = new THREE.Line(geoY, lineMatY);
  lineY.renderOrder = 9999;
  markerGroup.add(lineY);

  const geoZ = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -25),
    new THREE.Vector3(0, 0, 25),
  ]);
  const lineZ = new THREE.Line(geoZ, lineMatZ);
  lineZ.renderOrder = 9999;
  markerGroup.add(lineZ);

  markerGroup.visible = false;
  return markerGroup;
}

export interface NeurospaceViewer3DProps {
  regions?: NeurospaceRegionSet | null;
  expertMeshes?: NeurospaceRegionSet | null;
  agreementMeshes?: NeurospaceRegionSet | null;
  cutaway?: boolean;
  onToggleCutaway?: () => void;
  viewMode?: 'predicted' | 'expert' | 'agreement';
  onChangeViewMode?: (mode: 'predicted' | 'expert' | 'agreement') => void;
  visibleRegions?: Record<string, boolean>;
  onToggleRegion?: (key: string) => void;
  opacities?: Record<string, number>;
  wireframe?: boolean;
  onToggleWireframe?: () => void;
  worldCrosshair?: WorldCoordinate | [number, number, number] | null;
  voxelCrosshair?: VoxelCoordinate | null;
  hasExpertMask?: boolean;
  isDemoMode?: boolean;
  hasSegmentation?: boolean;
  onResetView?: () => void;
  onUpdateCrosshair?: (coord: Partial<VoxelCoordinate>) => void;
}

export const NeurospaceViewer3D: React.FC<NeurospaceViewer3DProps> = ({
  regions = null,
  expertMeshes = null,
  agreementMeshes = null,
  cutaway = false,
  onToggleCutaway,
  viewMode = 'predicted',
  onChangeViewMode,
  visibleRegions = { WT: true, TC: true, ET: true, brain: true, TP: true, FP: true, FN: true },
  onToggleRegion,
  opacities = { WT: 0.35, TC: 0.65, ET: 0.85, brain: 0.28, TP: 0.85, FP: 0.65, FN: 0.55 },
  wireframe = false,
  onToggleWireframe,
  worldCrosshair = null,
  voxelCrosshair = null,
  hasExpertMask = false,
  isDemoMode = true,
  hasSegmentation = false,
  onResetView,
  onUpdateCrosshair,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const crosshairGroupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<Record<string, THREE.Mesh>>({});
  const boundingInfoRef = useRef<{ center: THREE.Vector3; maxDim: number }>({
    center: new THREE.Vector3(0, 0, 0),
    maxDim: 120,
  });
  const clipPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 10));
  const onUpdateCrosshairRef = useRef(onUpdateCrosshair);
  useEffect(() => {
    onUpdateCrosshairRef.current = onUpdateCrosshair;
  }, [onUpdateCrosshair]);

  const [activeTab, setActiveTab] = useState<'predicted' | 'expert' | 'agreement'>(viewMode);
  const [isCutawayActive, setIsCutawayActive] = useState<boolean>(cutaway);
  const [isWireframeActive, setIsWireframeActive] = useState<boolean>(wireframe);

  const handleTabChange = (mode: 'predicted' | 'expert' | 'agreement') => {
    setActiveTab(mode);
    if (onChangeViewMode) onChangeViewMode(mode);
  };

  const handleToggleCutaway = () => {
    setIsCutawayActive(prev => !prev);
    if (onToggleCutaway) onToggleCutaway();
  };

  const handleToggleWireframe = () => {
    setIsWireframeActive(prev => !prev);
    if (onToggleWireframe) onToggleWireframe();
  };

  const resetCamera = useCallback((maxDim = 120) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const dist = maxDim * 1.6;
    camera.position.set(dist * 0.7, dist * 0.7, dist * 1.1);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  // 1. Initialize Scene, Renderer, and OrbitControls
  useEffect(() => {
    const container = mountRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080e); // Sleek Neurospace deep space dark theme
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 180);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.localClippingEnabled = true; // Enables cutaway / section view
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 0.8;
    controlsRef.current = controls;

    // Spatial grid helper
    const gridHelper = new THREE.GridHelper(220, 22, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -60;
    scene.add(gridHelper);

    // Orientation axes helper
    const axesHelper = new THREE.AxesHelper(30);
    axesHelper.position.set(-80, -50, -80);
    scene.add(axesHelper);

    // Lighting setup (scientific key + rim + ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight1.position.set(120, 200, 180);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.75);
    dirLight2.position.set(-150, -100, -120);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight3.position.set(0, -100, 100);
    scene.add(dirLight3);

    // Group for surface meshes
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // Crosshair marker
    const crosshairMarker = createCrosshairMarker();
    scene.add(crosshairMarker);
    crosshairGroupRef.current = crosshairMarker;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist > 5) return; // User dragged the camera, do not reposition crosshair
      if (!canvas || !camera || !onUpdateCrosshairRef.current) return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(meshesRef.current).filter(m => m && m.visible);
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const center = boundingInfoRef.current.center;
        const wx = hit.point.x + center.x;
        const wy = hit.point.y + center.y;
        const wz = hit.point.z + center.z;

        const ivox = Math.round(Math.max(0, Math.min(239, -wx)));
        const jvox = Math.round(Math.max(0, Math.min(239, 239 - wy)));
        const kvox = Math.round(Math.max(0, Math.min(154, wz)));

        onUpdateCrosshairRef.current({ i: ivox, j: jvox, k: kvox });
      }
    };

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mouseup', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // 2. Build / Update 3D Surface Meshes
  useEffect(() => {
    const scene = sceneRef.current;
    const group = groupRef.current;
    if (!scene || !group) return;

    // Clear old meshes
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }
    meshesRef.current = {};

    let targetRegions = regions;
    if (activeTab === 'expert' && expertMeshes) {
      targetRegions = { ...expertMeshes, brain: regions?.brain };
    } else if (activeTab === 'agreement' && agreementMeshes) {
      targetRegions = { ...agreementMeshes, brain: regions?.brain };
    }

    if (!targetRegions) return;

    const globalBox = new THREE.Box3();
    let hasValidMesh = false;

    const meshKeys: (keyof NeurospaceRegionSet)[] = ['brain', 'WT', 'TC', 'ET', 'TP', 'FP', 'FN'];

    meshKeys.forEach(regionKey => {
      const meshData: SurfaceMesh | undefined = targetRegions?.[regionKey];
      if (!meshData || !meshData.vertices || !meshData.faces) return;
      if (meshData.vertices.length === 0 || meshData.faces.length === 0) return;

      const cfg = NEUROSPACE_REGION_CONFIG[regionKey] || {
        color: 0x38bdf8,
        depthWrite: false,
        renderOrder: 2,
        roughness: 0.35,
        metalness: 0.15,
      };

      const geometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(meshData.vertices.length * 3);
      for (let i = 0; i < meshData.vertices.length; i++) {
        posArray[i * 3] = meshData.vertices[i][0];
        posArray[i * 3 + 1] = meshData.vertices[i][1];
        posArray[i * 3 + 2] = meshData.vertices[i][2];
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

      const idxArray = new Uint32Array(meshData.faces.length * 3);
      for (let i = 0; i < meshData.faces.length; i++) {
        idxArray[i * 3] = meshData.faces[i][0];
        idxArray[i * 3 + 1] = meshData.faces[i][1];
        idxArray[i * 3 + 2] = meshData.faces[i][2];
      }
      geometry.setIndex(new THREE.BufferAttribute(idxArray, 1));
      geometry.computeVertexNormals();

      const defaultOpacity = regionKey === 'brain' ? 0.28 : 0.75;
      const material = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: regionKey === 'brain' ? 0.58 : (cfg.roughness ?? 0.35),
        metalness: regionKey === 'brain' ? 0.08 : (cfg.metalness ?? 0.15),
        transparent: true,
        opacity: opacities[regionKey] ?? defaultOpacity,
        depthWrite: cfg.depthWrite ?? false,
        wireframe: isWireframeActive,
        side: regionKey === 'brain' ? THREE.FrontSide : THREE.DoubleSide,
      });

      if (regionKey === 'brain' && isCutawayActive) {
        material.clippingPlanes = [clipPlaneRef.current];
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `mesh_${regionKey}`;
      mesh.renderOrder = cfg.renderOrder || 2;
      mesh.visible = visibleRegions[regionKey] !== false;

      group.add(mesh);
      meshesRef.current[regionKey] = mesh;

      geometry.computeBoundingBox();
      if (geometry.boundingBox) {
        globalBox.union(geometry.boundingBox);
        hasValidMesh = true;
      }
    });

    if (hasValidMesh && !globalBox.isEmpty()) {
      const center = new THREE.Vector3();
      globalBox.getCenter(center);
      group.position.set(-center.x, -center.y, -center.z);
      clipPlaneRef.current.constant = -center.z;

      const size = new THREE.Vector3();
      globalBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);

      boundingInfoRef.current = { center, maxDim };
      resetCamera(maxDim);
    }
  }, [regions, expertMeshes, agreementMeshes, activeTab, isCutawayActive, isWireframeActive, resetCamera]);

  // 3. Update 3D Crosshair Position
  useEffect(() => {
    const marker = crosshairGroupRef.current;
    if (!marker) return;

    if (worldCrosshair) {
      const center = boundingInfoRef.current.center;
      const wx = Array.isArray(worldCrosshair) ? worldCrosshair[0] : worldCrosshair.x;
      const wy = Array.isArray(worldCrosshair) ? worldCrosshair[1] : worldCrosshair.y;
      const wz = Array.isArray(worldCrosshair) ? worldCrosshair[2] : worldCrosshair.z;

      marker.position.set(wx - center.x, wy - center.y, wz - center.z);
      marker.visible = true;
    } else {
      marker.visible = false;
    }
  }, [worldCrosshair]);

  // 4. Update visibility, opacity, and wireframe
  useEffect(() => {
    const keys = ['brain', 'WT', 'TC', 'ET', 'TP', 'FP', 'FN'];
    keys.forEach(k => {
      const mesh = meshesRef.current[k];
      if (mesh && mesh.material) {
        mesh.visible = visibleRegions[k] !== false;
        const defaultOpacity = k === 'brain' ? 0.22 : 0.75;
        (mesh.material as THREE.MeshStandardMaterial).opacity = opacities[k] ?? defaultOpacity;
        (mesh.material as THREE.MeshStandardMaterial).wireframe = isWireframeActive;

        if (k === 'brain') {
          (mesh.material as THREE.MeshStandardMaterial).clippingPlanes = isCutawayActive
            ? [clipPlaneRef.current]
            : [];
        }
      }
    });
  }, [visibleRegions, opacities, isWireframeActive, isCutawayActive]);

  const worldX = worldCrosshair ? (Array.isArray(worldCrosshair) ? worldCrosshair[0] : worldCrosshair.x) : 0;
  const worldY = worldCrosshair ? (Array.isArray(worldCrosshair) ? worldCrosshair[1] : worldCrosshair.y) : 0;
  const worldZ = worldCrosshair ? (Array.isArray(worldCrosshair) ? worldCrosshair[2] : worldCrosshair.z) : 0;

  return (
    <div ref={mountRef} className="relative w-full h-full bg-[#06080e] overflow-hidden select-none font-sans flex flex-col">
      <canvas ref={canvasRef} className="w-full h-full block flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top Floating Controls Bar (Neurospace-3D Style) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2 z-10">
        {/* View Mode Switcher */}
        <div className="pointer-events-auto flex items-center bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
          <button
            onClick={() => handleTabChange('predicted')}
            className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'predicted'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Segmentation
          </button>

          {hasExpertMask && (
            <>
              <button
                onClick={() => handleTabChange('expert')}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition cursor-pointer ${
                  activeTab === 'expert'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ground Truth
              </button>

              <button
                onClick={() => handleTabChange('agreement')}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition cursor-pointer ${
                  activeTab === 'agreement'
                    ? 'bg-violet-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overlap (TP/FP/FN)
              </button>
            </>
          )}
        </div>

        {/* View Tool Buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
          <button
            onClick={handleToggleCutaway}
            className={`p-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1 ${
              isCutawayActive
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Cutaway Sagittal Slice Section"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Cutaway</span>
          </button>

          <button
            onClick={handleToggleWireframe}
            className={`p-1.5 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1 ${
              isWireframeActive
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Mesh Wireframe Rendering"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Wireframe</span>
          </button>

          <button
            onClick={() => resetCamera(boundingInfoRef.current.maxDim)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition cursor-pointer"
            title="Reset 3D Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Telemetry & Crosshair HUD */}
      <div className="absolute bottom-3 left-3 pointer-events-none flex flex-col gap-1.5 z-10">
        <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-300 shadow-md flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-sky-400 font-bold">
            <CrosshairIcon className="w-3 h-3" />
            <span>LINKED CROSSHAIR:</span>
          </div>
          {voxelCrosshair && (
            <>
              <span className="text-slate-400">
                Voxel: <strong className="text-white font-bold">[{voxelCrosshair.i}, {voxelCrosshair.j}, {voxelCrosshair.k}]</strong>
              </span>
              <span className="text-slate-600">|</span>
            </>
          )}
          <span>
            World: <strong className="text-sky-400 font-bold">({worldX.toFixed(1)}, {worldY.toFixed(1)}, {worldZ.toFixed(1)}) mm</strong>
          </span>
        </div>

        <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/60 text-[9px] font-mono text-slate-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {isDemoMode
              ? 'SIMULATED DEMO SEGMENTATION (Aarav Sharma)'
              : hasSegmentation
              ? 'MONAI Model Prediction Active (Patient Tumour Mesh) | Reference Brain Shell'
              : '3D Brain Surface: Reference Anatomical Model (Raw MRI Uploaded)'}
          </span>
        </div>
      </div>

      {/* Bottom Right Compartment Legend */}
      <div className="absolute bottom-3 right-3 pointer-events-none z-10 flex flex-col gap-1 items-end">
        <div className="bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 shadow-md space-y-1">
          {!isDemoMode && !hasSegmentation ? (
            <div className="text-[10px] font-mono text-slate-400 max-w-[180px]">
              <div className="text-sky-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>MRI Scan Active</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                Click 'Run MONAI SegResNet' to generate tumour mesh
              </div>
            </div>
          ) : activeTab === 'agreement' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>TP (Agreement)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                <span>FP (AI Only)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>FN (Doctor Only)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                <span>WT (Whole Tumour)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>TC (Core)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span>ET (Active Rim)</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
