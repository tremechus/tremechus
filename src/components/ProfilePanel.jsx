import React from 'react';
import { profile } from '../data/profile';

export const LinkedInIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

const initials = name =>
    name
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const ProfilePanel = () => (
    <section id="professional" className="panel panel-professional" aria-labelledby="professional-title">
        <header className="panel-header">
            <p className="panel-kicker">professional</p>
            <h2 id="professional-title">Business &amp; Connect</h2>
        </header>

        <div className="profile-card">
            <div className="profile-identity">
                <div className="profile-avatar" aria-hidden="true">
                    {initials(profile.name)}
                </div>
                <div>
                    <p className="profile-name">{profile.name}</p>
                    {profile.headline && <p className="profile-headline">{profile.headline}</p>}
                    {profile.role && <p className="profile-role">{profile.role}</p>}
                </div>
            </div>

            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            {profile.focus.length > 0 && (
                <ul className="profile-focus" aria-label="Focus areas">
                    {profile.focus.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            )}

            <p className="profile-note">Experience, roles and recommendations live on LinkedIn.</p>
        </div>

        <a className="panel-cta cta-professional" href={profile.linkedin.url} target="_blank" rel="noopener noreferrer">
            <LinkedInIcon /> Connect on LinkedIn
            <span aria-hidden="true">→</span>
        </a>
    </section>
);

export default ProfilePanel;
