import React, { useEffect, useRef } from 'react';

/*
 * Sparks: little green electrical discharges that pop on the corners of page
 * components. Each spark is a short-lived event made of:
 *   - a flash of light at the corner
 *   - a few jagged arcs that flicker outward, re-drawn every couple of frames
 *   - current that crawls a short way along the two edges meeting at the corner
 *   - embers that spray out and fall
 * Behind the page sits a faint green grid; each spark lights up the grid
 * around it, as if the discharge were illuminating the wall behind.
 * Sparks track their element while alive, so they stay put when the page scrolls.
 * Hovering a component can also set off its nearest corner.
 *
 * Self-contained: needs nothing from the page except the selector below.
 */

// Components whose corners can spark.
const TARGETS = '.terminal, .profile-card, .panel-cta, .timeline-item, .year';

const START_DELAY_MS = 2600; // let the intro animation finish first
const MIN_GAP_MS = 3500;
const MAX_GAP_MS = 9000;
// Playback speed of each spark (flash, arcs, crawl, embers). 1 = original, lower = slower.
const SPEED = 0.4;
const DOUBLE_POP_CHANCE = 0.3;
const HOVER_COOLDOWN_MS = 1200;
const MAX_ACTIVE = 6;

// Background grid
const GRID_SIZE = 40; // px between lines
const GRID_COLOR = '0, 255, 65';
const GRID_BASE_ALPHA = 0.06; // resting grid, barely there
const GRID_LIT_ALPHA = 0.45; // line brightness right next to a fresh spark
const GLOW_RADIUS = 170; // px of grid lit around a spark
const GLOW_HAZE_ALPHA = 0.05; // soft wash of light under the lit lines
const GLOW_LIFE = 600; // spark-time ms the light lingers (scaled by SPEED like everything else)

const LAYER = {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
};

// Resting grid, drawn by CSS so it costs nothing. Fades out toward the edges.
const GRID_STYLE = {
    ...LAYER,
    zIndex: 0,
    backgroundImage: `linear-gradient(to right, rgba(${GRID_COLOR}, ${GRID_BASE_ALPHA}) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(${GRID_COLOR}, ${GRID_BASE_ALPHA}) 1px, transparent 1px)`,
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
    maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 100%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 100%)',
};

// Light cast on the grid: behind the content.
const GLOW_STYLE = { ...LAYER, zIndex: 0 };

// The sparks themselves: above the content, so they sit on the component edges.
const SPARK_STYLE = { ...LAYER, zIndex: 5 };

const CORNERS = [
    { key: 'TopLeft', sx: -1, sy: -1 },
    { key: 'TopRight', sx: 1, sy: -1 },
    { key: 'BottomRight', sx: 1, sy: 1 },
    { key: 'BottomLeft', sx: -1, sy: 1 },
];

const rand = (min, max) => min + Math.random() * (max - min);

// Launch directions, in radians below horizontal (negative = above).
// Sparks fire outward sideways and mostly level-to-down, like real sparks
// falling off a contact, rather than bursting upward like fireworks.
const ARC_DROP = [-0.3, 1.0];
const EMBER_DROP = [-0.15, 1.3];
const MAX_RISE = 0.35; // steepest any arc or fork may point upward

/** Absolute canvas angle pointing outward from the corner, `drop` radians below horizontal. */
const launchAngle = (corner, drop) => (corner.sx > 0 ? drop : Math.PI - drop);

/** Limit how far above horizontal an angle may point. */
function clampRise(angle) {
    const dx = Math.cos(angle);
    const rise = Math.atan2(-Math.sin(angle), Math.abs(dx));
    if (rise <= MAX_RISE) return angle;
    return dx >= 0 ? -MAX_RISE : Math.PI + MAX_RISE;
}
const SQRT1_2 = Math.SQRT1_2;

/** Geometry of one corner of an element, in viewport coordinates. */
function cornerGeometry(el, corner) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const r = Math.min(parseFloat(style[`border${corner.key}Radius`]) || 0, rect.width / 2, rect.height / 2);
    const x = corner.sx < 0 ? rect.left : rect.right;
    const y = corner.sy < 0 ? rect.top : rect.bottom;
    const inset = r * (1 - SQRT1_2); // point on the rounded curve at 45°
    return {
        rect,
        // the spark origin sits on the curve of the rounded corner
        origin: { x: x - corner.sx * inset, y: y - corner.sy * inset },
        // where each straight edge starts, and which way it runs away from the corner
        edges: [
            { x: x - corner.sx * r, y, dx: -corner.sx, dy: 0 },
            { x, y: y - corner.sy * r, dx: 0, dy: -corner.sy },
        ],
    };
}

const onScreen = rect =>
    rect.width > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;

/** Jagged polyline from (x0,y0) to (x1,y1) with optional forks. */
function bolt(x0, y0, x1, y1, roughness, forks) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = -(y1 - y0) / (len || 1);
    const ny = (x1 - x0) / (len || 1);
    const segments = Math.max(3, Math.round(len / 6));
    const points = [{ x: x0, y: y0 }];
    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const taper = Math.sin(t * Math.PI); // pinned at both ends
        const offset = rand(-1, 1) * len * roughness * taper;
        points.push({ x: x0 + (x1 - x0) * t + nx * offset, y: y0 + (y1 - y0) * t + ny * offset });
    }
    points.push({ x: x1, y: y1 });

    const paths = [points];
    for (let f = 0; f < forks; f++) {
        const from = points[1 + Math.floor(Math.random() * (points.length - 2))];
        const angle = clampRise(Math.atan2(y1 - y0, x1 - x0) + rand(-0.9, 0.9));
        const flen = len * rand(0.3, 0.6);
        paths.push(...bolt(from.x, from.y, from.x + Math.cos(angle) * flen, from.y + Math.sin(angle) * flen, roughness, 0));
    }
    return paths;
}

function strokePath(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
}

/** Glow, body and white-hot core, drawn additively. */
function strokeElectric(ctx, paths, alpha) {
    const passes = [
        [7, `rgba(0, 255, 65, ${0.12 * alpha})`],
        [3, `rgba(0, 255, 65, ${0.55 * alpha})`],
        [1.1, `rgba(225, 255, 235, ${0.95 * alpha})`],
    ];
    for (const [width, color] of passes) {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        for (const p of paths) strokePath(ctx, p);
    }
}

function createSpark(el, corner, intensity = 1) {
    const arcCount = 2 + Math.floor(Math.random() * 3);
    return {
        el,
        corner,
        intensity,
        origin: null,
        age: 0,
        life: rand(220, 380) * intensity,
        flashSize: rand(14, 26) * intensity,
        arcs: Array.from({ length: arcCount }, () => ({
            angle: launchAngle(corner, rand(...ARC_DROP)),
            length: rand(12, 40) * intensity,
            life: rand(80, 220),
            forks: Math.random() < 0.4 ? 1 : 0,
            paths: null,
            redrawIn: 0,
        })),
        crawl: rand(18, 60) * intensity,
        embers: Array.from({ length: Math.max(1, Math.round(rand(3, 8) * intensity)) }, () => {
            const angle = launchAngle(corner, rand(...EMBER_DROP));
            const speed = rand(0.08, 0.35);
            return { angle, speed, x: 0, y: 0, vx: null, vy: null, life: rand(300, 750), px: 0, py: 0 };
        }),
    };
}

/** Advance and draw a spark. Returns false once it has burned out. */
function drawSpark(ctx, spark, dt) {
    spark.age += dt;
    const geo = cornerGeometry(spark.el, spark.corner);
    const { origin } = geo;
    spark.origin = origin;
    let alive = false;

    // Flash
    const flashT = spark.age / 140;
    if (flashT < 1) {
        alive = true;
        const r = spark.flashSize * (0.6 + flashT * 0.6);
        const g = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, r);
        g.addColorStop(0, `rgba(235, 255, 240, ${0.9 * (1 - flashT)})`);
        g.addColorStop(0.25, `rgba(0, 255, 65, ${0.55 * (1 - flashT)})`);
        g.addColorStop(1, 'rgba(0, 255, 65, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Arcs: flicker by regenerating their shape every few frames
    for (const arc of spark.arcs) {
        if (spark.age > arc.life) continue;
        alive = true;
        arc.redrawIn -= dt;
        if (!arc.paths || arc.redrawIn <= 0) {
            const a = clampRise(arc.angle + rand(-0.15, 0.15));
            const len = arc.length * rand(0.7, 1.1);
            arc.paths = bolt(0, 0, Math.cos(a) * len, Math.sin(a) * len, 0.28, arc.forks);
            arc.redrawIn = rand(30, 60);
        }
        // occasional dropout reads as flicker
        if (Math.random() < 0.15) continue;
        const fade = 1 - spark.age / arc.life;
        ctx.save();
        ctx.translate(origin.x, origin.y);
        strokeElectric(ctx, arc.paths, fade);
        ctx.restore();
    }

    // Current crawling along both edges
    const crawlT = spark.age / spark.life;
    if (crawlT < 1) {
        alive = true;
        const head = spark.crawl * Math.min(1, crawlT * 1.6);
        const tail = Math.max(0, head - 14);
        for (const edge of geo.edges) {
            const pts = [];
            const steps = 5;
            for (let i = 0; i <= steps; i++) {
                const d = tail + ((head - tail) * i) / steps;
                const jitter = i === 0 || i === steps ? 0 : rand(-1.5, 1.5);
                pts.push({ x: edge.x + edge.dx * d + edge.dy * jitter, y: edge.y + edge.dy * d + edge.dx * jitter });
            }
            strokeElectric(ctx, [pts], (1 - crawlT) * 0.8);
        }
    }

    // Embers: spray outward, fall under gravity
    ctx.lineCap = 'round';
    for (const e of spark.embers) {
        if (spark.age > e.life) continue;
        alive = true;
        if (e.vx === null) {
            const a = e.angle;
            e.vx = Math.cos(a) * e.speed;
            e.vy = Math.sin(a) * e.speed;
        }
        e.px = e.x;
        e.py = e.y;
        e.vy += 0.0006 * dt; // gravity
        e.vx *= 0.995;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const t = spark.age / e.life;
        ctx.lineWidth = 1.4 * (1 - t) + 0.4;
        ctx.strokeStyle = t < 0.3 ? `rgba(230, 255, 210, ${1 - t})` : `rgba(0, 255, 65, ${1 - t})`;
        ctx.beginPath();
        ctx.moveTo(origin.x + e.px, origin.y + e.py);
        ctx.lineTo(origin.x + e.x, origin.y + e.y);
        ctx.stroke();
    }

    return alive;
}

/** How brightly a spark is lighting the grid right now (0..1). */
function glowLevel(spark) {
    const t = spark.age / GLOW_LIFE;
    if (t >= 1) return 0;
    const attack = Math.min(1, spark.age / 15);
    const decay = (1 - t) * (1 - t);
    const flicker = spark.age < 200 ? rand(0.7, 1) : 1; // stutters while the arcs are live
    return attack * decay * flicker * Math.min(1, spark.intensity);
}

/**
 * Light up the grid around a spark: draw grid lines into a scratch canvas,
 * keep only a radial falloff of them, and add the result onto the glow layer
 * with a faint haze underneath.
 */
function drawGlow(ctx, scratch, spark, dpr) {
    const level = glowLevel(spark);
    if (level <= 0.01 || !spark.origin) return;
    const R = GLOW_RADIUS * (0.75 + 0.25 * spark.intensity);
    const left = Math.round(spark.origin.x - R);
    const top = Math.round(spark.origin.y - R);
    const size = Math.ceil(R * 2);

    const sctx = scratch.getContext('2d');
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, size, size);

    // Grid lines, aligned with the CSS grid (lines sit at multiples of GRID_SIZE).
    sctx.strokeStyle = `rgb(${GRID_COLOR})`;
    sctx.lineWidth = 1;
    sctx.beginPath();
    const mod = n => ((n % GRID_SIZE) + GRID_SIZE) % GRID_SIZE;
    for (let x = (GRID_SIZE - mod(left)) % GRID_SIZE; x <= size; x += GRID_SIZE) {
        sctx.moveTo(x + 0.5, 0);
        sctx.lineTo(x + 0.5, size);
    }
    for (let y = (GRID_SIZE - mod(top)) % GRID_SIZE; y <= size; y += GRID_SIZE) {
        sctx.moveTo(0, y + 0.5);
        sctx.lineTo(size, y + 0.5);
    }
    sctx.stroke();

    // Keep a radial falloff of them.
    sctx.globalCompositeOperation = 'destination-in';
    const mask = sctx.createRadialGradient(R, R, 0, R, R, R);
    mask.addColorStop(0, `rgba(0, 0, 0, ${GRID_LIT_ALPHA * level})`);
    mask.addColorStop(0.4, `rgba(0, 0, 0, ${GRID_LIT_ALPHA * level * 0.35})`);
    mask.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = mask;
    sctx.fillRect(0, 0, size, size);

    // Haze, then the lit lines on top.
    const haze = ctx.createRadialGradient(spark.origin.x, spark.origin.y, 0, spark.origin.x, spark.origin.y, R);
    haze.addColorStop(0, `rgba(${GRID_COLOR}, ${GLOW_HAZE_ALPHA * level})`);
    haze.addColorStop(1, `rgba(${GRID_COLOR}, 0)`);
    ctx.fillStyle = haze;
    ctx.fillRect(left, top, size, size);
    ctx.drawImage(scratch, 0, 0, size * dpr, size * dpr, left, top, size, size);
}

const Sparks = () => {
    const canvasRef = useRef(null);
    const glowRef = useRef(null);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const glow = glowRef.current;
        const gctx = glow.getContext('2d');
        const scratch = document.createElement('canvas');
        let dpr = 1;
        let sparks = [];
        let frame = 0;
        let last = 0;
        let timer = 0;
        const hoverCooldown = new WeakMap();
        const pending = new Set();
        const later = (fn, ms) => {
            const id = setTimeout(() => {
                pending.delete(id);
                fn();
            }, ms);
            pending.add(id);
        };

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            for (const [c, cx] of [
                [canvas, ctx],
                [glow, gctx],
            ]) {
                c.width = window.innerWidth * dpr;
                c.height = window.innerHeight * dpr;
                cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            scratch.width = scratch.height = Math.ceil(GLOW_RADIUS * 2 * dpr) + 2;
        };

        // Only animate while something is burning; idle otherwise.
        const tick = now => {
            const dt = Math.min(now - last, 50);
            last = now;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            gctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            ctx.globalCompositeOperation = 'lighter';
            gctx.globalCompositeOperation = 'lighter';
            sparks = sparks.filter(s => {
                if (!s.el.isConnected) return false;
                const burning = drawSpark(ctx, s, dt * SPEED);
                drawGlow(gctx, scratch, s, dpr);
                return burning || s.age < GLOW_LIFE;
            });
            ctx.globalCompositeOperation = 'source-over';
            gctx.globalCompositeOperation = 'source-over';
            frame = sparks.length ? requestAnimationFrame(tick) : 0;
        };

        const ignite = (el, corner, intensity) => {
            if (sparks.length >= MAX_ACTIVE) return;
            sparks.push(createSpark(el, corner, intensity));
            if (!frame) {
                last = performance.now();
                frame = requestAnimationFrame(tick);
            }
        };

        const randomSpark = () => {
            const candidates = [...document.querySelectorAll(TARGETS)].filter(el => onScreen(el.getBoundingClientRect()));
            if (candidates.length) {
                const el = candidates[Math.floor(Math.random() * candidates.length)];
                const corner = CORNERS[Math.floor(Math.random() * CORNERS.length)];
                ignite(el, corner, rand(0.8, 1.2));
                if (Math.random() < DOUBLE_POP_CHANCE) {
                    later(() => ignite(el, corner, rand(0.5, 0.8)), rand(70, 160));
                }
            }
            schedule();
        };

        const schedule = () => {
            timer = setTimeout(randomSpark, rand(MIN_GAP_MS, MAX_GAP_MS));
        };

        // Hovering a component sparks the corner nearest the pointer.
        const onPointerOver = e => {
            const el = e.target.closest?.(TARGETS);
            if (!el || (hoverCooldown.get(el) || 0) > performance.now()) return;
            hoverCooldown.set(el, performance.now() + HOVER_COOLDOWN_MS);
            const rect = el.getBoundingClientRect();
            const corner = CORNERS.find(
                c =>
                    c.sx === (e.clientX < rect.left + rect.width / 2 ? -1 : 1) &&
                    c.sy === (e.clientY < rect.top + rect.height / 2 ? -1 : 1)
            );
            ignite(el, corner, 0.7);
        };

        const onVisibility = () => {
            clearTimeout(timer);
            if (!document.hidden) schedule();
        };

        resize();
        const startTimer = setTimeout(schedule, START_DELAY_MS);
        window.addEventListener('resize', resize);
        document.addEventListener('pointerover', onPointerOver);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            clearTimeout(startTimer);
            clearTimeout(timer);
            pending.forEach(clearTimeout);
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
            document.removeEventListener('pointerover', onPointerOver);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    return (
        <>
            <div aria-hidden="true" style={GRID_STYLE} />
            <canvas ref={glowRef} aria-hidden="true" style={GLOW_STYLE} />
            <canvas ref={canvasRef} aria-hidden="true" style={SPARK_STYLE} />
        </>
    );
};

export default Sparks;
