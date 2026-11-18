import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Compass } from 'lucide-react';
import { isValidUrl } from '../utils/links';

export function ContextField({ context, compact = false }) {
  const [copied, setCopied] = useState(false);

  if (!context || (!context.text && !context.link)) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!context.link) return;
    navigator.clipboard.writeText(context.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isLink = isValidUrl(context.link);

  return (
    <div className={`note-context-box ${compact ? 'compact' : ''}`}>
      <div className="note-context-header">
        <Compass size={12} className="note-context-icon" />
        <span className="note-context-label">Context</span>
      </div>

      {context.text && (
        <p className="note-context-text">{context.text}</p>
      )}

      {context.link && (
        <div className="note-context-link-row">
          {isLink ? (
            <a
              href={context.link}
              target="_blank"
              rel="noopener noreferrer"
              className="note-context-anchor"
              onClick={(e) => e.stopPropagation()}
              title={`Open ${context.link}`}
            >
              <span className="link-truncate">{context.link.replace(/^https?:\/\//, '')}</span>
              <ExternalLink size={11} />
            </a>
          ) : (
            <div className="note-context-ref">
              <span className="ref-text">{context.link}</span>
              <button
                type="button"
                className="ref-copy-btn"
                onClick={handleCopy}
                title="Copy context reference"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
