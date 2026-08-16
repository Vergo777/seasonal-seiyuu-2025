import type { ReactNode } from 'react'
import './StatusPanel.css'

interface Props {
    tone?: 'loading' | 'error' | 'empty' | 'quiet'
    eyebrow?: string
    title: string
    children?: ReactNode
    action?: ReactNode
}

function StatusPanel({ tone = 'quiet', eyebrow, title, children, action }: Props) {
    const liveProps = tone === 'error'
        ? { role: 'alert' as const }
        : tone === 'loading'
            ? { role: 'status' as const, 'aria-live': 'polite' as const }
            : {}

    return (
        <section className={`status-panel status-panel--${tone}`} {...liveProps}>
            <div className="status-mark" aria-hidden="true">
                {tone === 'loading' ? <span className="status-spinner" /> : '—'}
            </div>
            <div className="status-copy">
                {eyebrow && <p className="status-eyebrow">{eyebrow}</p>}
                <h2>{title}</h2>
                {children && <div className="status-message">{children}</div>}
                {action && <div className="status-action">{action}</div>}
            </div>
        </section>
    )
}

export default StatusPanel
