import React, { useEffect, useRef } from 'react';

const GREEN = [0, 255, 65];
const BLUE = [135, 206, 235];
// Sits behind the page content.
const CANVAS_STYLE = {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 0,
    pointerEvents: 'none',
};
const LINK_DISTANCE = 140;
const POINTER_RADIUS = 180;

// Blend from the personal green (left) to the professional blue (right).
const colorAt = (x, width, alpha) => {
    const t = Math.min(Math.max(x / width, 0), 1);
    const c = GREEN.map((g, i) => Math.round(g + (BLUE[i] - g) * t));
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
};

/**
 * Ambient background: drifting nodes that link up when close, tinted green
 * on the left and blue on the right. Gently attracted to the pointer.
 * Draws a single static frame when the user prefers reduced motion.
 */
const Constellation = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pointer = { x: -9999, y: -9999 };
        let nodes = [];
        let width = 0;
        let height = 0;
        let frame = 0;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.round(Math.min(90, (width * height) / 16000));
            nodes = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: 1 + Math.random() * 1.2,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const d = Math.hypot(a.x - b.x, a.y - b.y);
                    if (d < LINK_DISTANCE) {
                        ctx.strokeStyle = colorAt((a.x + b.x) / 2, width, 0.18 * (1 - d / LINK_DISTANCE));
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
                const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
                if (pd < POINTER_RADIUS) {
                    ctx.strokeStyle = colorAt(a.x, width, 0.35 * (1 - pd / POINTER_RADIUS));
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(pointer.x, pointer.y);
                    ctx.stroke();
                }
                ctx.fillStyle = colorAt(a.x, width, 0.6);
                ctx.beginPath();
                ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const step = () => {
            for (const n of nodes) {
                const dx = pointer.x - n.x;
                const dy = pointer.y - n.y;
                const d = Math.hypot(dx, dy);
                if (d < POINTER_RADIUS && d > 1) {
                    n.vx += (dx / d) * 0.004;
                    n.vy += (dy / d) * 0.004;
                }
                n.vx *= 0.995;
                n.vy *= 0.995;
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > width) n.vx *= -1;
                if (n.y < 0 || n.y > height) n.vy *= -1;
            }
            draw();
            frame = requestAnimationFrame(step);
        };

        const onPointerMove = e => {
            pointer.x = e.clientX;
            pointer.y = e.clientY;
        };
        const onPointerLeave = () => {
            pointer.x = -9999;
            pointer.y = -9999;
        };
        const onVisibility = () => {
            cancelAnimationFrame(frame);
            if (!document.hidden && !reduceMotion) frame = requestAnimationFrame(step);
        };
        const onResize = () => {
            resize();
            if (reduceMotion) draw();
        };

        resize();
        if (reduceMotion) draw();
        else frame = requestAnimationFrame(step);

        window.addEventListener('resize', onResize);
        window.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerleave', onPointerLeave);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerleave', onPointerLeave);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    return <canvas ref={canvasRef} aria-hidden="true" style={CANVAS_STYLE} />;
};

export default Constellation;
