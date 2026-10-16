import React from 'react';
import LogoLoop, { LogoItem } from './LogoLoop';

// Custom clean SVG nodes for each technology in the NeuroScope 3D stack
const MonaiIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const PyTorchIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M13.5 2.2a.8.8 0 0 0-1.2.2L9.8 6.5A7.5 7.5 0 0 0 12 21a7.5 7.5 0 0 0 7.5-7.5c0-3.3-2.1-6-5-7.1l-1-4.2zM12 19a5.5 5.5 0 0 1-4.7-8.3l1.8-2.6.7 3a.8.8 0 0 0 1.2.5l2.2-1.2A5.5 5.5 0 0 1 12 19zm4.2-11.8a1 1 0 1 1 1.4-1.4 1 1 0 0 1-1.4 1.4z" />
  </svg>
);

const FastApiIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="13 2 6 14 12 14 11 22 18 10 12 10 13 2" fill="currentColor" stroke="none" />
  </svg>
);

const ThreeJsIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 2.5l8.5 4.9v9.8L12 22.1l-8.5-4.9V7.4L12 2.5zm0 2.3L5.5 8.5 12 12.2l6.5-3.7L12 4.8zm-7 5.1v6.2l6 3.5v-6.2l-6-3.5zm14 0l-6 3.5v6.2l6-3.5V9.9z" />
  </svg>
);

const ReactIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(0 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const TypeScriptIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <rect width="22" height="22" x="1" y="1" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M5 9h6m-3 0v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 16c.8.7 1.8 1.1 2.8 1.1 1.2 0 1.9-.5 1.9-1.3 0-1.8-3.7-.9-3.7-3.6 0-1.5 1.2-2.5 3-2.5 1 0 1.9.3 2.6.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const TailwindIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 6c-2.4 0-3.9 1.2-4.5 3.6 1-.8 2-1 3-0.7.6.2 1 .6 1.5 1.1 1 1 2 2 4 2 2.4 0 3.9-1.2 4.5-3.6-1 .8-2 1-3 .7-.6-.2-1-.6-1.5-1.1-1-1-2-2-4-2zm-6 6c-2.4 0-3.9 1.2-4.5 3.6 1-.8 2-1 3-.7.6.2 1 .6 1.5 1.1 1 1 2 2 4 2 2.4 0 3.9-1.2 4.5-3.6-1 .8-2 1-3 .7-.6-.2-1-.6-1.5-1.1-1-1-2-2-4-2z" />
  </svg>
);

const PythonIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2H8a5 5 0 0 0-5 5v3a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5z" fill="currentColor" fillOpacity="0.2" />
    <path d="M12.5 22H16a5 5 0 0 0 5-5v-3a2 2 0 0 0-2-2H12.5a2 2 0 0 0-2 2v3a5 5 0 0 0 5 5z" fill="currentColor" fillOpacity="0.2" />
    <circle cx="7" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const NibabelIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="M6 12h12" />
    <path d="M12 8v8" />
    <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const ViteIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M21.5 4.5l-8.7 17a.9.9 0 0 1-1.6 0L2.5 4.5a.8.8 0 0 1 1-1.1l7.8 3.5a.8.8 0 0 0 .7 0l7.8-3.5a.8.8 0 0 1 1.7.6v.5z" />
    <polygon points="12 8.5 7.5 10.5 11 15 10 18.5 15.5 13 12.5 13 14 9.5 12 8.5" fill="#facc15" />
  </svg>
);

const BratsIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const SegResNetIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="6" r="2.5" fill="currentColor" />
    <circle cx="5" cy="18" r="2.5" fill="currentColor" />
    <circle cx="19" cy="6" r="2.5" fill="currentColor" />
    <circle cx="19" cy="18" r="2.5" fill="currentColor" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <line x1="7.5" y1="6" x2="16.5" y2="6" />
    <line x1="7.5" y1="18" x2="16.5" y2="18" />
    <line x1="7" y1="7.5" x2="10" y2="10.5" />
    <line x1="14" y1="13.5" x2="17" y2="16.5" />
  </svg>
);

export const techStackLogos: LogoItem[] = [
  {
    node: <MonaiIcon />,
    title: 'MONAI 1.6.1',
    href: 'https://monai.io',
    hoverColor: '#00d2be',
  },
  {
    node: <SegResNetIcon />,
    title: 'SegResNet 3D',
    href: 'https://monai.io/model-zoo.html',
    hoverColor: '#ec4899',
  },
  {
    node: <PyTorchIcon />,
    title: 'PyTorch 2.1',
    href: 'https://pytorch.org',
    hoverColor: '#ee4c2c',
  },
  {
    node: <FastApiIcon />,
    title: 'FastAPI',
    href: 'https://fastapi.tiangolo.com',
    hoverColor: '#059669',
  },
  {
    node: <ThreeJsIcon />,
    title: 'Three.js (WebGL)',
    href: 'https://threejs.org',
    hoverColor: '#0284c7',
  },
  {
    node: <ReactIcon />,
    title: 'React 19',
    href: 'https://react.dev',
    hoverColor: '#0ea5e9',
  },
  {
    node: <TypeScriptIcon />,
    title: 'TypeScript 5.7',
    href: 'https://www.typescriptlang.org',
    hoverColor: '#2563eb',
  },
  {
    node: <TailwindIcon />,
    title: 'Tailwind CSS',
    href: 'https://tailwindcss.com',
    hoverColor: '#06b6d4',
  },
  {
    node: <PythonIcon />,
    title: 'Python 3.14',
    href: 'https://www.python.org',
    hoverColor: '#eab308',
  },
  {
    node: <NibabelIcon />,
    title: 'NiBabel 5.x',
    href: 'https://nipy.org/nibabel',
    hoverColor: '#8b5cf6',
  },
  {
    node: <BratsIcon />,
    title: 'BraTS 2023',
    href: 'https://www.synapse.org/Synapse:syn51156910/wiki/622351',
    hoverColor: '#10b981',
  },
  {
    node: <ViteIcon />,
    title: 'Vite 6',
    href: 'https://vitejs.dev',
    hoverColor: '#a855f7',
  },
];

interface TechStackLoopProps {
  className?: string;
}

export const TechStackLoop: React.FC<TechStackLoopProps> = ({ className = '' }) => {
  return (
    <div className={`py-6 relative ${className}`}>
      <div className="text-center mb-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 font-semibold bg-white/80 px-3 py-1 rounded-full border border-slate-200 shadow-2xs inline-block">
          Powered by Open-Source Medical AI & Web Technologies
        </span>
      </div>

      <div className="relative py-2 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 rounded-2xl border border-slate-200/60 shadow-xs backdrop-blur-xs">
        <LogoLoop
          logos={techStackLogos}
          speed={60}
          direction="left"
          logoHeight={26}
          gap={48}
          labels="inline"
          scaleOnHover={true}
          fadeOut={true}
          fadeOutWidth={0.12}
          pauseOnHover={true}
          ariaLabel="NeuroScope 3D technology stack partners and open source engines"
        />
      </div>
    </div>
  );
};

export default TechStackLoop;
