import React, { useEffect, useState } from 'react';

const TYPE_DELAY_MS = 150;
const BLINK_MS = 530;
const CURSOR_LINGER_MS = 1000;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Types `text` out one character at a time with a blinking cursor that retires when done. */
const TypedTitle = ({ text, className }) => {
    const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
    const [cursorVisible, setCursorVisible] = useState(true);
    const [cursorDone, setCursorDone] = useState(() => prefersReducedMotion());

    useEffect(() => {
        if (cursorDone) return undefined;
        let index = 0;
        let lingerTimeout;
        const typeInterval = setInterval(() => {
            index++;
            setCount(index);
            if (index >= text.length) {
                clearInterval(typeInterval);
                lingerTimeout = setTimeout(() => setCursorDone(true), CURSOR_LINGER_MS);
            }
        }, TYPE_DELAY_MS);
        return () => {
            clearInterval(typeInterval);
            clearTimeout(lingerTimeout);
        };
    }, []); // runs once on mount

    useEffect(() => {
        if (cursorDone) return undefined;
        const blinkInterval = setInterval(() => setCursorVisible(v => !v), BLINK_MS);
        return () => clearInterval(blinkInterval);
    }, [cursorDone]);

    return (
        <h1 className={className} aria-label={text}>
            <span aria-hidden="true">{text.slice(0, count)}</span>
            <span
                className="cursor"
                aria-hidden="true"
                style={{ visibility: !cursorDone && cursorVisible ? 'visible' : 'hidden' }}
            >
                |
            </span>
        </h1>
    );
};

export default TypedTitle;
