import React, { useEffect, useRef } from 'react';

export default function Confetti({ onComplete }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Confetti particles
    const particles = [];
    const particleCount = 200;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: `hsl(${Math.random() * 360}, 90%, 65%)`,
        tilt: Math.random() * 10 - 5,
        tiltAngle: 0,
        tiltAngleIncrement: Math.random() * 0.1 + 0.05,
        speedY: Math.random() * 2 + 1,
        speedX: Math.random() * 1 - 0.5,
        gravity: 0.1,
        opacity: 1
      });
    }
    
    // Animation
    let animationFrameId;
    let timer = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        ctx.save();
        ctx.beginPath();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.tiltAngle * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        
        // Update
        p.tiltAngle += p.tiltAngleIncrement;
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity -= 0.006;
        p.speedY += p.gravity;
        
        // Reset if it goes out of screen or becomes invisible
        if (p.y > canvas.height || p.opacity <= 0) {
          if (timer < 3000) { // Keep generating confetti for 3 seconds
            particles[i] = {
              x: Math.random() * canvas.width,
              y: -20,
              size: Math.random() * 10 + 5,
              color: `hsl(${Math.random() * 360}, 90%, 65%)`,
              tilt: Math.random() * 10 - 5,
              tiltAngle: 0,
              tiltAngleIncrement: Math.random() * 0.1 + 0.05,
              speedY: Math.random() * 2 + 1,
              speedX: Math.random() * 1 - 0.5,
              gravity: 0.1,
              opacity: 1
            };
          } else {
            particles[i].opacity = 0; // Make invisible
          }
        }
      }
      
      // Increment timer
      timer += 16; // ~60fps
      
      // Check if all particles are invisible
      const allInvisible = particles.every(p => p.opacity <= 0);
      
      if (allInvisible || timer > 6000) {
        // Animation done
        if (onComplete) onComplete();
        cancelAnimationFrame(animationFrameId);
        document.body.removeChild(canvas);
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    };
  }, [onComplete]);
  
  return null;
}