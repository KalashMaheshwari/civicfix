import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface PointsIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const PointsIcon: React.FC<PointsIconProps> = ({ size = 16, className = '', style }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/points.png"
        alt="Points"
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'inline-block',
          verticalAlign: '-2px',
          ...style,
        }}
      />
    );
  }

  return (
    <Star
      size={size}
      fill="#F59E0B"
      color="#D97706"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-2px',
        filter: 'drop-shadow(0 1px 2px rgba(217, 119, 6, 0.2))',
        ...style,
      }}
    />
  );
};

// Backwards compatibility alias
export const StarIcon = PointsIcon;
