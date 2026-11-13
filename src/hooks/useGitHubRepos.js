import { useEffect, useState } from 'react';
import snapshot from '../data/repos.snapshot.json';
import { profile } from '../data/profile';

const CACHE_KEY = `gh-repos:${profile.github.user}`;
const CACHE_TTL_MS = 60 * 60 * 1000;

function prepare(repos) {
    const { hidden, descriptions } = profile.github;
    return repos
        .filter(r => !r.fork && !hidden.includes(r.name))
        .map(r => ({
            name: r.name,
            description: r.description || descriptions[r.name] || null,
            language: r.language,
            url: r.html_url,
            created: r.created_at,
            pushed: r.pushed_at,
            stars: r.stargazers_count,
        }))
        .sort((a, b) => b.pushed.localeCompare(a.pushed));
}

function readCache() {
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.repos;
    } catch {
        // ignore unavailable or corrupt storage
    }
    return null;
}

/**
 * Public repos for the configured GitHub user. Renders immediately from the
 * bundled snapshot, then swaps in live data (unauthenticated API, cached for
 * an hour per session so we stay well under the rate limit).
 */
export function useGitHubRepos() {
    const [repos, setRepos] = useState(() => prepare(readCache() || snapshot));
    const [live, setLive] = useState(() => readCache() !== null);

    useEffect(() => {
        if (readCache()) return undefined;
        const controller = new AbortController();
        fetch(`https://api.github.com/users/${profile.github.user}/repos?per_page=100&sort=pushed`, {
            signal: controller.signal,
            headers: { Accept: 'application/vnd.github+json' },
        })
            .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
            .then(data => {
                try {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos: data }));
                } catch {
                    // storage full or disabled; fine
                }
                setRepos(prepare(data));
                setLive(true);
            })
            .catch(() => {
                // keep the snapshot
            });
        return () => controller.abort();
    }, []);

    return { repos, live };
}
