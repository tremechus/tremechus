import Constellation from './Constellation';
import Sparks from './Sparks';

/**
 * Available backgrounds. Each is a self-contained component that owns its own
 * canvas, styling and lifecycle, so they can be swapped freely.
 *
 * Pick the default in src/data/profile.js (`background`), or override per
 * visit with a query string: ?bg=sparks, ?bg=constellation, ?bg=none
 */
export const backgrounds = {
    sparks: Sparks,
    constellation: Constellation,
    none: () => null,
};
