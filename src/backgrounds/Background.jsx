import React from 'react';
import { backgrounds } from './index';

const fromQuery = () => new URLSearchParams(window.location.search).get('bg');

/** Renders the chosen background, letting ?bg=<name> override the default. */
const Background = ({ name }) => {
    const choice = fromQuery();
    const Component = backgrounds[choice] || backgrounds[name] || backgrounds.none;
    return <Component />;
};

export default Background;
