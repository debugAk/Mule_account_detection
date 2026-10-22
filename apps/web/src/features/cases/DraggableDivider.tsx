import React, { useState, useEffect, useCallback } from 'react';

interface DraggableDividerProps {
  onDrag: (delta: number) => void;
  direction?: 'horizontal';
  className?: string;
}

export const DraggableDivider: React.FC<DraggableDividerProps> = ({ onDrag, className }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      onDrag(e.movementX);
    },
    [isDragging, onDrag]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label="Resize panel divider"
      onMouseDown={handleMouseDown}
      className={`group relative w-[4px] bg-[var(--border)] hover:bg-[var(--accent)] cursor-col-resize shrink-0 transition-colors duration-[120ms] ${
        isDragging ? 'bg-[var(--accent)]' : ''
      } ${className || ''}`}
    >
      <div className="absolute inset-y-0 -left-[2px] -right-[2px] cursor-col-resize" />
    </div>
  );
};
