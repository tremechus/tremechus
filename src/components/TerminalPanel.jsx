import React, { useEffect, useRef, useState } from 'react';
import { profile } from '../data/profile';

const LANGUAGE_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572a5',
    Java: '#b07219',
    HTML: '#e34c26',
    CSS: '#663399',
    Go: '#00add8',
    Rust: '#dea584',
};

const LS = Symbol('ls');
const PROMPT = `${profile.handle}@github:~$`;

const formatDate = iso =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

const RepoList = ({ repos }) => (
    <ul className="repo-list">
        {repos.map(repo => (
            <li key={repo.name}>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="repo">
                    <span className="repo-name">{repo.name}/</span>
                    <span className="repo-meta">
                        {repo.language && (
                            <span className="repo-lang">
                                <span
                                    className="lang-dot"
                                    style={{ background: LANGUAGE_COLORS[repo.language] || '#8b949e' }}
                                />
                                {repo.language}
                            </span>
                        )}
                        <time dateTime={repo.pushed}>{formatDate(repo.pushed)}</time>
                    </span>
                    {repo.description && <span className="repo-desc">{repo.description}</span>}
                </a>
            </li>
        ))}
    </ul>
);

const HELP = [
    ['ls', 'list projects'],
    ['open <project>', 'open a project on GitHub'],
    ['whoami', 'who is this'],
    ['github', 'open my GitHub profile'],
    ['linkedin', 'switch to the professional side'],
    ['clear', 'clear the screen'],
];

const TerminalPanel = ({ repos, live }) => {
    // `ls` entries render from the current repo list, so they update in place
    // when live data replaces the bundled snapshot.
    const [history, setHistory] = useState([{ id: 0, command: 'ls -t projects/', ls: true }]);
    const [input, setInput] = useState('');
    const nextId = useRef(1);
    const screenRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const screen = screenRef.current;
        if (screen && history.length > 1) screen.scrollTop = screen.scrollHeight;
    }, [history]);

    const run = raw => {
        const [cmd, ...args] = raw.trim().split(/\s+/);
        const arg = args.join(' ');
        switch (cmd) {
            case '':
                return null;
            case 'help':
                return (
                    <dl className="term-help">
                        {HELP.map(([c, d]) => (
                            <React.Fragment key={c}>
                                <dt>{c}</dt>
                                <dd>{d}</dd>
                            </React.Fragment>
                        ))}
                    </dl>
                );
            case 'ls':
                return LS;
            case 'whoami':
                return `${profile.handle} — the personal side of ${profile.name}. On GitHub since ${profile.github.joined}.`;
            case 'open': {
                const repo = repos.find(r => r.name.toLowerCase() === arg.toLowerCase());
                if (!repo) return `open: no such project: ${arg || '(none)'}`;
                window.open(repo.url, '_blank', 'noopener');
                return `opening ${repo.name}…`;
            }
            case 'github':
                window.open(profile.github.url, '_blank', 'noopener');
                return `opening ${profile.github.url}…`;
            case 'linkedin':
                document.getElementById('professional')?.scrollIntoView({ behavior: 'smooth' });
                return 'see you on the other side →';
            case 'sudo':
                return 'nice try.';
            default:
                return `${cmd}: command not found. try 'help'`;
        }
    };

    const onSubmit = e => {
        e.preventDefault();
        const command = input;
        setInput('');
        if (command.trim() === 'clear') {
            setHistory([]);
            return;
        }
        const output = run(command);
        setHistory(h => [
            ...h,
            output === LS ? { id: nextId.current++, command, ls: true } : { id: nextId.current++, command, output },
        ]);
    };

    return (
        <section className="panel panel-personal" aria-labelledby="personal-title">
            <header className="panel-header">
                <p className="panel-kicker">personal</p>
                <h2 id="personal-title">Code &amp; Create</h2>
            </header>

            <div className="terminal" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
                <div className="terminal-bar" aria-hidden="true">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                    <span className="terminal-title">~/projects{live ? '' : ' (cached)'}</span>
                </div>
                <div className="terminal-screen" ref={screenRef} aria-live="polite">
                    {history.map(entry => (
                        <div key={entry.id} className="term-entry">
                            <div className="term-line">
                                <span className="prompt">{PROMPT}</span> {entry.command}
                            </div>
                            {(entry.ls || entry.output) && (
                                <div className="term-output">{entry.ls ? <RepoList repos={repos} /> : entry.output}</div>
                            )}
                        </div>
                    ))}
                    <form className="term-line term-input-line" onSubmit={onSubmit}>
                        <label htmlFor="term-input" className="prompt">
                            {PROMPT}
                        </label>
                        <input
                            id="term-input"
                            ref={inputRef}
                            className="term-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="type 'help'"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </form>
                </div>
            </div>

            <a className="panel-cta cta-personal" href={profile.github.url} target="_blank" rel="noopener noreferrer">
                <GitHubIcon /> github.com/{profile.github.user}
                <span aria-hidden="true">→</span>
            </a>
        </section>
    );
};

export const GitHubIcon = () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);

export default TerminalPanel;
