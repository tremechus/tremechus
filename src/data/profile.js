// Everything personal about the site lives here. Edit freely.
// Fields set to null or [] are simply not rendered.

export const profile = {
    handle: 'tremechus',
    name: 'Trevor Croft',

    // Which background effect to show: see src/backgrounds/index.js
    background: 'sparks',

    github: {
        user: 'tremechus',
        url: 'https://github.com/tremechus',
        joined: 2011,
        // Repos to leave off the site entirely.
        hidden: ['sqlboa', 'boaconnector_android'],
        // Fill in descriptions for repos that don't have one on GitHub.
        descriptions: {},
    },

    linkedin: {
        url: 'https://www.linkedin.com/in/tcroft-linked/',
    },

    // Professional side. TODO: fill these in.
    headline: null, // e.g. 'Principal Engineer at Example Co.'
    bio: null, // one or two sentences
    focus: [], // e.g. ['Platform engineering', 'Team leadership', 'AI tooling']

    // Career entries for the right-hand track of the timeline.
    // { year: 2019, title: 'Senior Engineer', detail: 'Example Co.' }
    career: [],
};
