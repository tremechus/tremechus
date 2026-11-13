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

    // Professional side.
    headline: 'Hands-on engineering leader',
    role: 'Head of Engineering at Reflex',
    bio:
        'I build engineering teams and the systems they run on. ' +
        'For two decades I wrote the code myself; today I direct AI agents that write it, ' +
        'and I own the architecture, the review and the result. ' +
        'At Reflex I took the platform from pre-launch to 50k+ active users. ' +
        'Before that, eleven years at Mobiquity growing from Android platform lead to VP of Engineering.',
    focus: [
        'Engineering leadership',
        'Distributed systems',
        'Cloud architecture (AWS)',
        'Payments & transactions',
        'Mobile (React Native, Android)',
        'AI-accelerated engineering',
    ],

    // Career entries for the right-hand track of the timeline.
    // { year, title, org, detail }  (org and detail are optional)
    career: [
        {
            year: 2022,
            title: 'Head of Engineering',
            org: 'Reflex, Inc. · 2022 – present',
            detail: 'Architected and built the platform from pre-launch to 50k+ active users, including the payments core.',
        },
        {
            year: 2017,
            title: 'VP & Director of Engineering',
            org: 'Mobiquity, Inc. · 2017 – 2022',
            detail: 'Led architecture for enterprise product builds and engineering teams across the US and India.',
        },
        {
            year: 2011,
            title: 'Principal Engineer, Android Platform Lead',
            org: 'Mobiquity, Inc. · 2011 – 2017',
            detail: 'Native Android platforms for high-traffic enterprise clients; set company-wide mobile standards.',
        },
        {
            year: 2010,
            title: 'Staff Software Engineer',
            org: 'vAuto · 2010 – 2011',
            detail: 'Cross-platform mobile infrastructure and native VIN scanning.',
        },
        {
            year: 1998,
            title: 'Software Developer',
            org: 'Trilogy, DMI, Voyant, Interwoven · 1998 – 2010',
            detail: 'Full-stack web and enterprise software.',
        },
    ],
};
