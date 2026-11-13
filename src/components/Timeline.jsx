import React, { useMemo } from 'react';
import { profile } from '../data/profile';

/**
 * Two tracks, one spine: GitHub history on the left, career on the right,
 * grouped by year. The GitHub track is derived from repo creation dates;
 * the career track comes from profile.career.
 */
const Timeline = ({ repos }) => {
    const years = useMemo(() => {
        const byYear = new Map();
        const add = (year, side, item) => {
            if (!byYear.has(year)) byYear.set(year, { year, personal: [], professional: [] });
            byYear.get(year)[side].push(item);
        };

        add(profile.github.joined, 'personal', { title: 'Joined GitHub', detail: `@${profile.github.user}` });
        for (const repo of repos) {
            add(new Date(repo.created).getFullYear(), 'personal', {
                title: repo.name,
                detail: repo.description,
                url: repo.url,
            });
        }
        for (const entry of profile.career) add(entry.year, 'professional', entry);

        return [...byYear.values()].sort((a, b) => b.year - a.year);
    }, [repos]);

    return (
        <section className="timeline-section" aria-labelledby="timeline-title">
            <header className="timeline-header">
                <h2 id="timeline-title">Timeline</h2>
                <p className="timeline-legend">
                    <span className="legend-personal">personal</span>
                    <span className="legend-professional">professional</span>
                </p>
            </header>

            <ol className="timeline">
                {years.map(({ year, personal, professional }) => (
                    <li key={year} className="timeline-year">
                        <div className="track track-personal">
                            {personal.map(item => (
                                <TimelineItem key={`${item.title}-${item.org || ''}`} item={item} />
                            ))}
                        </div>
                        <div className="spine">
                            <span className="year">{year}</span>
                        </div>
                        <div className="track track-professional">
                            {professional.map(item => (
                                <TimelineItem key={`${item.title}-${item.org || ''}`} item={item} />
                            ))}
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
};

const TimelineItem = ({ item }) => {
    const body = (
        <>
            <span className="item-title">{item.title}</span>
            {item.org && <span className="item-org">{item.org}</span>}
            {item.detail && <span className="item-detail">{item.detail}</span>}
        </>
    );
    return item.url ? (
        <a className="timeline-item" href={item.url} target="_blank" rel="noopener noreferrer">
            {body}
        </a>
    ) : (
        <div className="timeline-item">{body}</div>
    );
};

export default Timeline;
