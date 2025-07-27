import React, { useState, useEffect, useRef } from 'react';

const Critter = () => {
    const critterRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastTimeRef = useRef(0);
    
    // Critter state
    const [position, setPosition] = useState({ x: 200, y: 200 });
    const [vertices, setVertices] = useState([]);
    const [currentFoot, setCurrentFoot] = useState(null);
    const [isWalking, setIsWalking] = useState(false);
    const [isLooking, setIsLooking] = useState(false);
    const [walkProgress, setWalkProgress] = useState(0);
      // Base shape parameters
    const baseRadius = 25;
    const vertexCount = 16;
    
    // Initialize base shape
    useEffect(() => {
        const initialVertices = [];
        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const radius = baseRadius + Math.random() * 8 - 4;
            initialVertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                baseX: Math.cos(angle) * radius,
                baseY: Math.sin(angle) * radius,
                stretchX: 0,
                stretchY: 0
            });
        }
        setVertices(initialVertices);
    }, []);
    
    // Find closest vertex to a point
    const findClosestVertex = (targetX, targetY) => {
        let closestIndex = 0;
        let minDistance = Infinity;
        
        vertices.forEach((vertex, index) => {
            const dx = vertex.x - targetX;
            const dy = vertex.y - targetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });
        
        return closestIndex;
    };
    
    // Get screen boundaries considering text areas
    const getValidPosition = () => {
        const margin = 100;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Avoid center area where text is
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const textAreaWidth = 600;
        const textAreaHeight = 400;
        
        let x, y;
        do {
            x = margin + Math.random() * (screenWidth - margin * 2);
            y = margin + Math.random() * (screenHeight - margin * 2);
        } while (
            x > centerX - textAreaWidth / 2 && x < centerX + textAreaWidth / 2 &&
            y > centerY - textAreaHeight / 2 && y < centerY + textAreaHeight / 2
        );
        
        return { x, y };
    };
    
    // Start walking behavior
    const startWalking = () => {
        if (isWalking || isLooking) return;
        
        // Pick random foot position relative to current position
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 60;
        const footX = position.x + Math.cos(angle) * distance;
        const footY = position.y + Math.sin(angle) * distance;
        
        // Ensure foot is in valid area
        const validFoot = getValidPosition();
        
        setCurrentFoot({
            x: validFoot.x,
            y: validFoot.y,
            stretchVertex: findClosestVertex(validFoot.x - position.x, validFoot.y - position.y)
        });
        
        setIsWalking(true);
        setWalkProgress(0);
    };
    
    // Start looking behavior
    const startLooking = () => {
        if (isWalking || isLooking) return;
        
        setIsLooking(true);
        setTimeout(() => {
            setIsLooking(false);
        }, 1000 + Math.random() * 2000);
    };
    
    // Animation loop
    const animate = (currentTime) => {
        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;
        
        if (isWalking && currentFoot) {
            const progress = Math.min(walkProgress + deltaTime * 0.001, 1);
            setWalkProgress(progress);
            
            // Update vertices
            setVertices(prevVertices => {
                return prevVertices.map((vertex, index) => {
                    let newVertex = { ...vertex };
                      if (index === currentFoot.stretchVertex) {
                        // Stretch vertex toward foot with rounded end
                        const stretchAmount = Math.sin(progress * Math.PI) * 0.8;
                        const dx = currentFoot.x - position.x;
                        const dy = currentFoot.y - position.y;
                        
                        // Create rounded effect by reducing stretch for adjacent vertices
                        const adjacentVertices = [
                            (index - 1 + vertices.length) % vertices.length,
                            (index + 1) % vertices.length
                        ];
                        
                        newVertex.stretchX = dx * stretchAmount;
                        newVertex.stretchY = dy * stretchAmount;
                    } else if (currentFoot && [
                        (currentFoot.stretchVertex - 1 + vertices.length) % vertices.length,
                        (currentFoot.stretchVertex + 1) % vertices.length
                    ].includes(index)) {
                        // Adjacent vertices get partial stretch for rounded effect
                        const stretchAmount = Math.sin(progress * Math.PI) * 0.4;
                        const dx = currentFoot.x - position.x;
                        const dy = currentFoot.y - position.y;
                        
                        newVertex.stretchX = dx * stretchAmount;
                        newVertex.stretchY = dy * stretchAmount;
                    } else {
                        // Gradually return to base position
                        newVertex.stretchX *= 0.95;
                        newVertex.stretchY *= 0.95;
                    }
                    
                    // Apply fluid motion
                    const fluidOffset = Math.sin(currentTime * 0.003 + index) * 2;
                    newVertex.x = newVertex.baseX + newVertex.stretchX + fluidOffset;
                    newVertex.y = newVertex.baseY + newVertex.stretchY + fluidOffset;
                    
                    return newVertex;
                });
            });
            
            // Move body toward foot
            if (progress > 0.3) {
                const bodyProgress = (progress - 0.3) / 0.7;
                const easeProgress = 1 - Math.pow(1 - bodyProgress, 3); // Ease out cubic
                
                setPosition(prevPos => ({
                    x: prevPos.x + (currentFoot.x - prevPos.x) * easeProgress * 0.05,
                    y: prevPos.y + (currentFoot.y - prevPos.y) * easeProgress * 0.05
                }));
            }
            
            // End walking
            if (progress >= 1) {
                setIsWalking(false);
                setCurrentFoot(null);
                setWalkProgress(0);
            }
        } else if (isLooking) {
            // Looking animation - subtle shape changes
            setVertices(prevVertices => {
                return prevVertices.map((vertex, index) => {
                    const lookOffset = Math.sin(currentTime * 0.005 + index * 0.5) * 3;
                    return {
                        ...vertex,
                        x: vertex.baseX + lookOffset,
                        y: vertex.baseY + lookOffset * 0.5,
                        stretchX: vertex.stretchX * 0.9,
                        stretchY: vertex.stretchY * 0.9
                    };
                });
            });
        } else {
            // Idle animation - gentle breathing
            setVertices(prevVertices => {
                return prevVertices.map((vertex, index) => {
                    const breathe = Math.sin(currentTime * 0.002 + index * 0.3) * 1.5;
                    return {
                        ...vertex,
                        x: vertex.baseX + breathe,
                        y: vertex.baseY + breathe,
                        stretchX: vertex.stretchX * 0.95,
                        stretchY: vertex.stretchY * 0.95
                    };
                });
            });
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation loop
    useEffect(() => {
        animationFrameRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isWalking, isLooking, walkProgress, currentFoot, position, vertices]);
    
    // Behavior timing
    useEffect(() => {
        const behaviorInterval = setInterval(() => {
            const rand = Math.random();
            if (rand < 0.6) {
                startWalking();
            } else {
                startLooking();
            }
        }, 2000 + Math.random() * 3000);
        
        return () => clearInterval(behaviorInterval);
    }, [isWalking, isLooking]);
    
    // Generate SVG path from vertices
    const generatePath = () => {
        if (vertices.length === 0) return '';
        
        let path = `M ${vertices[0].x + position.x} ${vertices[0].y + position.y}`;
        
        for (let i = 1; i < vertices.length; i++) {
            const curr = vertices[i];
            const next = vertices[(i + 1) % vertices.length];
            const prev = vertices[i - 1];
            
            // Smooth curves between vertices
            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp1y = prev.y + (curr.y - prev.y) * 0.5;
            const cp2x = curr.x + (next.x - curr.x) * 0.3;
            const cp2y = curr.y + (next.y - curr.y) * 0.3;
            
            path += ` Q ${curr.x + position.x} ${curr.y + position.y} ${cp2x + position.x} ${cp2y + position.y}`;
        }
        
        path += ' Z';
        return path;
    };
      return (
        <svg
            className="critter"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'all',
                zIndex: 1
            }}
        >
            <defs>
                <radialGradient id="fluidGradient" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="rgba(40, 120, 60, 0.9)" />
                    <stop offset="30%" stopColor="rgba(30, 90, 45, 0.85)" />
                    <stop offset="70%" stopColor="rgba(20, 70, 35, 0.8)" />
                    <stop offset="100%" stopColor="rgba(15, 50, 25, 0.75)" />
                </radialGradient>
                <filter id="fluidFilter">
                    <feTurbulence baseFrequency="0.02" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                    <feGaussianBlur stdDeviation="0.5" />
                </filter>
            </defs>
            <path
                d={generatePath()}
                fill="url(#fluidGradient)"
                stroke="rgba(80, 200, 100, 0.9)"
                strokeWidth="2"
                style={{
                    filter: 'drop-shadow(0 0 15px rgba(40, 120, 60, 0.6)) url(#fluidFilter)',
                    transition: 'all 0.1s ease'
                }}
                onMouseEnter={() => {
                    if (!isWalking && !isLooking) {
                        startWalking();
                    }
                }}
            />
        </svg>
    );
};

export default Critter;
