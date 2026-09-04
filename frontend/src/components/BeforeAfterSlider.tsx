import React, { useState, useRef, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number | string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Reported Hazard',
  afterLabel = 'Official Repair Proof',
  height = 240,
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="before-after-slider-container"
      style={{
        position: 'relative',
        height,
        width: '100%',
        borderRadius: 'var(--radius-sm, 8px)',
        overflow: 'hidden',
        userSelect: 'none',
        border: '1px solid var(--border-default, #e2e8f0)',
        boxShadow: 'var(--elevation-1)',
        cursor: 'col-resize',
        background: 'var(--bg-subtle, #f8fafc)',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background layer) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        loading="lazy"
        decoding="async"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          background: 'var(--status-verified-fg, #059669)',
          color: '#ffffff',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.02em',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 2,
        }}
      >
        {afterLabel}
      </div>

      {/* Before Image (Clipped layer) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${sliderPos}%`,
          height: '100%',
          overflow: 'hidden',
          borderRight: '2px solid #ffffff',
          zIndex: 3,
        }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          loading="lazy"
          decoding="async"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerRef.current ? containerRef.current.clientWidth : '100vw',
            height: '100%',
            maxWidth: 'none',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle Knob */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPos}%`,
          transform: 'translate(-50%, -50%)',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#ffffff',
          border: '2px solid var(--primary, #0284c7)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          cursor: 'col-resize',
          pointerEvents: 'none',
        }}
      >
        <ChevronsLeftRight size={16} color="var(--primary, #0284c7)" />
      </div>
    </div>
  );
};
