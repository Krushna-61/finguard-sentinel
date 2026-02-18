import React, { useEffect, useRef, useState } from 'react';

interface RiskSparklineProps {
  data: number[];
}

const RiskSparkline: React.FC<RiskSparklineProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 2;

    ctx.clearRect(0, 0, width, height);

    const max = Math.max(...data, 100);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const stepX = (width - padding * 2) / (data.length - 1);

    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const lastValue = data[data.length - 1];
    const color = lastValue > 80 ? '#EF4444' : lastValue > 60 ? '#F59E0B' : '#3B82F6';
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (data.length > 0) {
      const lastX = padding + (data.length - 1) * stepX;
      const lastY = height - padding - ((lastValue - min) / range) * (height - padding * 2);
      
      ctx.beginPath();
      ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [data, mounted]);

  if (!mounted) {
    return <div style={{ width: '100%', height: '40px', background: '#000000' }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      style={{ width: '100%', height: '40px' }}
    />
  );
};

export default React.memo(RiskSparkline);
