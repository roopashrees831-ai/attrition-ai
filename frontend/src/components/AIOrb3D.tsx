import React from 'react';

interface AIOrb3DProps {
  variant?: 'dark' | 'light';
}

export const AIOrb3D: React.FC<AIOrb3DProps> = ({ variant = 'dark' }) => {
  return (
    <div className={`ai-orb-3d ai-orb-3d--${variant}`} aria-hidden="true">
      <div className="ai-orb-3d__glow" />
      <div className="ai-orb-3d__core">
        <span className="ai-orb-3d__shine" />
      </div>
      <div className="ai-orb-3d__ring ai-orb-3d__ring--one" />
      <div className="ai-orb-3d__ring ai-orb-3d__ring--two" />
      <div className="ai-orb-3d__ring ai-orb-3d__ring--three" />
      <span className="ai-orb-3d__dot ai-orb-3d__dot--one" />
      <span className="ai-orb-3d__dot ai-orb-3d__dot--two" />
      <span className="ai-orb-3d__dot ai-orb-3d__dot--three" />
    </div>
  );
};
