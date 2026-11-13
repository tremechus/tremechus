import React from 'react';
import Constellation from './components/Constellation';
import TypedTitle from './components/TypedTitle';
import TerminalPanel from './components/TerminalPanel';
import ProfilePanel from './components/ProfilePanel';
import Timeline from './components/Timeline';
import { useGitHubRepos } from './hooks/useGitHubRepos';
import { profile } from './data/profile';
import './styles/App.css';

function App() {
    const { repos, live } = useGitHubRepos();

    return (
        <>
            <Constellation />
            <main className="page">
                <header className="hero">
                    <TypedTitle text={profile.handle} className="hero-title" />
                    <p className="hero-sub">
                        <span className="sub-personal">personal</span>
                        <span className="sub-link" aria-hidden="true" />
                        <span className="sub-professional">professional</span>
                    </p>
                </header>

                <div className="panels">
                    <TerminalPanel repos={repos} live={live} />
                    <div className="seam" aria-hidden="true" />
                    <ProfilePanel />
                </div>

                <Timeline repos={repos} />
            </main>
            <footer className="site-footer">
                © {new Date().getFullYear()} {profile.name} ·{' '}
                <a href={`${profile.github.url}/tremechus`} target="_blank" rel="noopener noreferrer">
                    source
                </a>
            </footer>
        </>
    );
}

export default App;
