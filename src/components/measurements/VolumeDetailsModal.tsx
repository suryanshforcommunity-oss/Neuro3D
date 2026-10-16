import React from 'react';
import { X, Calculator, HelpCircle, CheckCircle2 } from 'lucide-react';
import { VoxelSpacing, TumourLabelCounts } from '../../types';

interface VolumeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spacing: VoxelSpacing;
  labelCounts: TumourLabelCounts;
  expertCounts?: TumourLabelCounts;
}

export const VolumeDetailsModal: React.FC<VolumeDetailsModalProps> = ({
  isOpen,
  onClose,
  spacing,
  labelCounts,
  expertCounts,
}) => {
  if (!isOpen) return null;

  const voxelVolumeMm3 = spacing.x * spacing.y * spacing.z;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              How Tumor Size in Milliliters (mL) Is Calculated
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          {/* Formula box */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-700 font-semibold block mb-1">
              Standard Physical Volume Formula
            </span>
            <div className="font-mono text-sm text-sky-900 bg-white p-2.5 rounded-lg border border-sky-200/60 font-semibold shadow-2xs">
              Volume (mL) = Total Voxels × (Width × Height × Depth in mm) / 1000
            </div>
            <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
              An MRI scan is made of tiny 3D cubes called <strong className="text-slate-800">voxels</strong> (3D pixels). We multiply the total number of tumor voxels by the physical size of each voxel from your scan file, then divide by 1,000 to convert cubic millimeters into milliliters (mL).
            </p>
          </div>

          {/* Active Header Voxel Spacing */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">Single Voxel Dimensions (dx, dy, dz)</span>
              <span className="text-sm font-semibold text-slate-900">
                {spacing.x.toFixed(3)} × {spacing.y.toFixed(3)} × {spacing.z.toFixed(3)} mm
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 block mb-1">Single Voxel Volume</span>
              <span className="text-sm font-semibold text-sky-700">
                {voxelVolumeMm3.toFixed(4)} mm³
              </span>
            </div>
          </div>

          {/* BraTS Hierarchical Label Definitions */}
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">Tumor Layer Breakdown</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-700">Inner Dead Tumor Tissue (NCR): Label 1</span>
                <span className="text-slate-500">{labelCounts.ncrCount.toLocaleString()} voxels</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-700">Brain Swelling & Fluid (ED): Label 2</span>
                <span className="text-slate-500">{labelCounts.edCount.toLocaleString()} voxels</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-700">Active Growing Tumor (ET): Label 4</span>
                <span className="text-slate-500">{labelCounts.etCount.toLocaleString()} voxels</span>
              </div>
            </div>
          </div>

          {/* Verified Official Test Cube */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Mathematically Verified:</strong>
              A test cube of 20 × 20 × 20 voxels (8,000 voxels) with 1 × 1 × 2 mm voxel size equals exactly <strong>16.0 mL</strong>. Verified by automated unit tests.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
