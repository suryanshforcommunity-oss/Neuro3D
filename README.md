# NeuroScope 3D — Stage 1 Frontend Medical Workstation

> **“See a brain tumour in 3D, measure it, and know how far to trust it.”**

---

### Mandatory Research Disclaimer

> **Research and teaching prototype only. Not for clinical diagnosis or treatment decisions. Model outputs are experimental and require independent expert review.**
>
> Exact terminology: *“Suspected tumour region predicted by the model.”* This application never claims to diagnose patients or replace board-certified radiologists.

---

## 1. Executive Summary

**NeuroScope 3D** is a medical-imaging visualization workstation designed for 3D brain MRI segmentation, quantitative volumetric measurement, and uncertainty verification. 

This repository contains the complete **Stage 1 Frontend Foundation**, implementing a dense, high-performance dark medical workstation interface built with React, TypeScript, Vite, Tailwind CSS, and Three.js.

---

## 2. Technology Stack & Key Libraries

| Technology | Purpose |
| :--- | :--- |
| **React 19 + TypeScript** | Component-based, strictly typed user interface |
| **Vite 6** | Ultra-fast HMR development server and production bundler |
| **Three.js** | 3D WebGL anatomical brain surface and nested tumour mesh rendering |
| **Tailwind CSS v3** | Custom dark medical-tech workstation design system |
| **nifti-reader-js + pako** | In-browser NIfTI (`.nii`, `.nii.gz`) parsing and decompression |
| **Lucide React** | Medical and engineering workstation iconography |
| **Vitest** | Automated unit test suite for physical volume formulas and affine transformations |

---

## 3. Key Workstation Features

### A. 3D Brain & Tumour Surface Viewer (`BrainViewer3D.tsx`)
- **Realistic Anatomical Cortex**: Procedural cerebral hemispheres with longitudinal fissure, frontal/temporal lobes, and gyri/sulci contours.
- **Nested BraTS Overlays**:
  - **Whole Tumour (WT)**: Cyan (`#06B6D4` / `#00F2FE`)
  - **Tumour Core (TC)**: Violet (`#8B5CF6`)
  - **Enhancing Tumour (ET)**: Amber (`#F59E0B`)
- **Interactive Orbit Navigation**: Left-click to orbit, mousewheel to zoom, right-click to pan.
- **Cutaway / Clipping Plane**: Slices through the cortical surface to expose internal nested lesion pathology.
- **Synchronized 3D Crosshair**: Real-time 3-axis stereotactic cursor tracked to canonical physical coordinates.
- **Permanent Legend**: Clarifies hierarchical nested label definitions.

### B. Synchronized Orthogonal MRI Slice Panels (`OrthogonalSliceView.tsx`)
- **Three Synchronized Views**:
  - **Axial (Transverse • Z)**
  - **Coronal (Frontal • Y)**
  - **Sagittal (Lateral • X)**
- **True Synchronized Coordinates**: Selecting or dragging a voxel in any slice panel immediately updates the single source of truth `(i, j, k)` and computes real-world stereotactic millimeters `(X, Y, Z) mm` via the volume affine matrix.
- **Window / Level Controls**: Interactive contrast width and center sliders with clinical presets (Brain Soft Tissue, High Contrast, Tumour Hyperintensity, Full Range).
- **Anatomical Orientation Indicators**: Standard radiological convention (Patient Left displayed on screen Right).

### C. 4-Sequence NIfTI Pre-Validation Interface (`NiftiUploadModal.tsx`)
- **4 Required Modalities**: T1, T1Gd (T1ce), T2, FLAIR.
- **Optional 5th Slot**: Expert ground truth mask (`.nii`, `.nii.gz`).
- **Client-Side Integrity Checks**:
  - Format / magic-number validation (`isNIFTI`)
  - Maximum file size guard (1 GB limit)
  - 3D volume verification (`dim[0] >= 3`, `dim[1..3] > 1`)
  - Positive voxel spacing validation (`pixdim[1..3] > 0`)
  - All-zero / constant volume detection and non-finite (NaN/Inf) checks
  - Cross-sequence matrix dimension consistency verification
  - In-browser SHA-256 cryptographic digest calculation (`crypto.subtle.digest`)
- **Privacy Assurance**: All parsing occurs locally in browser memory without external transmissions.

### D. Volumetric Quantification (`RegionVolumeCards.tsx`)
- **Physical Volume Formula**:
  $$\text{Volume (mL)} = \frac{\text{Voxel Count} \times \Delta x \times \Delta y \times \Delta z}{1000}$$
  *Voxel spacing $(\Delta x, \Delta y, \Delta z)$ is read directly from the NIfTI header (`pixdim`), never assuming 1.0 mm isotropic spacing.*
- **BraTS Hierarchical Compositions**:
  - $\text{WT} = \text{NCR (1)} \cup \text{ED (2)} \cup \text{ET (4)}$
  - $\text{TC} = \text{NCR (1)} \cup \text{ET (4)}$
  - $\text{ET} = \text{Label 4}$
- **Expert Mask Comparison**: Computes volumetric difference ($\Delta \text{mL}$ and $\%$) when an expert mask is present.
- **Verified Official Test Cube**: $20 \times 20 \times 20$ voxels, spacing $1 \times 1 \times 2\text{ mm}$, Label 2 (ED) evaluates to **16.0 mL** for WT, **0.0 mL** for TC, and **0.0 mL** for ET.

### E. Model Reliability & Provenance Report (`ProvenanceReportView.tsx`)
- **Clear Offline State**: States clearly *“Model inference is not connected. No AI prediction is available.”* Never invents accuracy scores or fabricated Dice percentages.
- **Real Voxel Overlap Evaluation**: When an expert mask is uploaded, computes genuine Dice Similarity Coefficient (DSC), Sensitivity (Recall), and Specificity.
- **Printable Provenance Record**: Clinical audit sheet with SHA-256 digests, timestamps, software commit hashes, and mandatory research disclaimer.

---

## 4. Getting Started

### Prerequisites
- Node.js LTS (v18, v20, or v22)
- npm or yarn

### Installation
```bash
# Clone or navigate to the repository
cd Kurukshetra

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

### Running Unit Tests
```bash
# Execute automated test suite with Vitest
npm test
```

### Building for Production
```bash
# Type check and build production bundle
npm run build
```

---

## 5. API Integration Architecture (`src/services/api.ts`)

NeuroScope 3D defines typed API contracts ready for the future FastAPI + MONAI SegResNet backend:

- `GET /api/v1/health`: Backend service status and CUDA device inspection.
- `POST /api/v1/studies`: Multi-sequence study upload with SHA-256 validation.
- `POST /api/v1/studies/{study_id}/segment`: Triggers asynchronous MONAI SegResNet inference.
- `GET /api/v1/studies/{study_id}/status`: Polling for preprocessing, inference, and postprocessing progress.
- `GET /api/v1/studies/{study_id}/results`: NIfTI segmentation mask download and volume metrics.
- `GET /api/v1/studies/{study_id}/report`: Full provenance metadata and PDF generation.

*The frontend operates 100% offline in client-side preview mode when the backend is disconnected.*

---

## 6. Stage 1 vs. Stage 2 Roadmap

| Milestone | Stage 1 (Frontend Foundation — Completed) | Stage 2 (Backend & Scorer Integration) |
| :--- | :--- | :--- |
| **UI Workstation** | Dark medical-grade desktop workstation layout | Full screen multi-monitor layout |
| **3D Rendering** | Three.js brain surface & nested tumour overlays | Isosurface extraction from real NIfTI masks via Marching Cubes |
| **Slice Viewer** | Synchronized Axial/Coronal/Sagittal canvas views | Niivue WebGL GPU texture rendering pipeline |
| **NIfTI Upload** | Browser header validation, shape check & SHA-256 | Chunked upload to FastAPI with 24h retention purge |
| **Inference Engine** | Offline preview mode + synthetic research phantom | MONAI SegResNet ensemble with Monte Carlo Dropout uncertainty |
| **Scorer Tests** | Unit tests passing for official test cube and affines | Automated BraTS benchmark scoring pipeline validation |
