export const HOVER_CARD_CSS = String.raw`
.bb-thread-hover-card {
  position: fixed;
  z-index: 50;
  width: min(20rem, calc(100vw - 1rem));
  max-height: calc(100vh - 1rem);
  overflow: hidden;
  padding: 0.75rem;
  border: 1px solid transparent;
  border-color:
    color-mix(in srgb, var(--foreground) 4%, transparent);
  border-radius: var(--radius-lg, 0.5rem);
  background: var(--popover);
  background: color-mix(in srgb, var(--popover) 82%, transparent);
  color: var(--popover-foreground);
  box-shadow:
    0 0.75rem 2.5rem
      color-mix(in srgb, var(--foreground) 12%, transparent),
    inset 0 1px 0
      color-mix(in srgb, var(--background) 34%, transparent);
  backdrop-filter: blur(18px) saturate(1.25);
  -webkit-backdrop-filter: blur(18px) saturate(1.25);
  font-family: inherit;
  font-size: 0.75rem;
  line-height: 1.35;
  pointer-events: auto;
  user-select: text;
}

.bb-thread-hover-card.is-visible {
  animation: bb-thread-hover-card-in 120ms ease-out both;
}

.bb-thread-hover-card__header,
.bb-thread-hover-card__provider,
.bb-thread-hover-card__provider-identity,
.bb-thread-hover-card__times,
.bb-thread-hover-card__context,
.bb-thread-hover-card__project,
.bb-thread-hover-card__branch,
.bb-thread-hover-card__local,
.bb-thread-hover-card__pr,
.bb-thread-hover-card__access,
.bb-thread-hover-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
}

.bb-thread-hover-card__header {
  gap: 0.5rem;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  font-weight: 400;
}

.bb-thread-hover-card__icon {
  width: 0.875rem;
  height: 0.875rem;
  flex: none;
  color: var(--muted-foreground);
}

.bb-thread-hover-card__runtime,
.bb-thread-hover-card__loading,
.bb-thread-hover-card__meta-label {
  color: var(--muted-foreground);
}

.bb-thread-hover-card__runtime {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.1875rem;
  font-variant-numeric: tabular-nums;
}

.bb-thread-hover-card__provider {
  flex: 1 1 auto;
  gap: 0.3125rem;
  color: var(--muted-foreground);
}

.bb-thread-hover-card__provider-identity {
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-start;
  gap: 0.25rem;
  overflow: hidden;
}

.bb-thread-hover-card__reasoning {
  flex: none;
  color: color-mix(in srgb, var(--muted-foreground) 76%, transparent);
  font-size: 0.625rem;
  white-space: nowrap;
}

.bb-thread-hover-card__times {
  flex: none;
  gap: 0.375rem;
  margin-left: auto;
  white-space: nowrap;
}

.bb-thread-hover-card__time-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 74%, transparent);
}

.bb-thread-hover-card__time-icon[data-tone="working"] {
  color: color-mix(in srgb, var(--muted-foreground) 62%, transparent);
}

.bb-thread-hover-card__time-icon[data-tone="danger"] {
  color: var(--destructive);
}

.bb-thread-hover-card__time-icon[data-tone="warning"] {
  color: var(--warning-text, var(--warning));
}

.bb-thread-hover-card__time-icon[data-tone="success"] {
  color: var(--success);
}

.bb-thread-hover-card__summary,
.bb-thread-hover-card__message,
.bb-thread-hover-card__meta,
.bb-thread-hover-card__loading {
  margin: 0;
}

.bb-thread-hover-card__summary {
  position: relative;
  min-width: 0;
  margin-top: 0.625rem;
  padding-block: 0.1875rem;
}

.bb-thread-hover-card__message {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--foreground) 88%, transparent);
  font-size: 0.78125rem;
  font-weight: 350;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .bb-thread-hover-card__summary[data-working="true"]
    .bb-thread-hover-card__message {
    background: linear-gradient(
      105deg,
      color-mix(in srgb, var(--foreground) 84%, transparent) 0%,
      color-mix(in srgb, var(--foreground) 84%, transparent) 40%,
      var(--foreground) 50%,
      color-mix(in srgb, var(--foreground) 84%, transparent) 60%,
      color-mix(in srgb, var(--foreground) 84%, transparent) 100%
    );
    background-position: 130% 0;
    background-size: 220% 100%;
    background-clip: text;
    color: transparent;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: bb-thread-hover-card-message-shimmer 3.4s ease-in-out infinite;
  }

  .bb-thread-hover-card__summary[data-working="true"]
    .bb-thread-hover-card__inline-code {
    color: color-mix(in srgb, var(--foreground) 88%, transparent);
    -webkit-text-fill-color: currentColor;
  }
}

.bb-thread-hover-card__provider-icon {
  width: 0.8125rem;
  height: 0.8125rem;
  color: color-mix(in srgb, var(--muted-foreground) 82%, transparent);
  object-fit: contain;
}

.bb-thread-hover-card__provider-model {
  color: var(--muted-foreground);
  font-weight: 400;
}

.bb-thread-hover-card__provider-model.bb-thread-hover-card__truncate {
  flex: 0 1 auto;
  color: var(--muted-foreground);
}

.bb-thread-hover-card__context {
  width: 100%;
  flex-wrap: nowrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.65625rem;
  white-space: nowrap;
}

.bb-thread-hover-card__project,
.bb-thread-hover-card__branch {
  gap: 0.25rem;
  overflow: hidden;
}

.bb-thread-hover-card__project {
  max-width: 38%;
  flex: 0 1 auto;
}

.bb-thread-hover-card__context[data-has-branch="false"]
  .bb-thread-hover-card__project {
  max-width: 100%;
  flex: 1 1 auto;
}

.bb-thread-hover-card__branch {
  flex: 1 1 4rem;
  min-width: 0;
}

.bb-thread-hover-card__project-name,
.bb-thread-hover-card__branch-name,
.bb-thread-hover-card__local-path {
  min-width: 0;
  overflow: hidden;
  color: var(--muted-foreground);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-thread-hover-card__project-name,
.bb-thread-hover-card__branch-name,
.bb-thread-hover-card__local-path {
  flex: 1 1 auto;
}

.bb-thread-hover-card__local {
  width: 100%;
  flex-wrap: nowrap;
  gap: 0.375rem;
  margin-top: 0.3125rem;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  white-space: nowrap;
}

.bb-thread-hover-card__meta {
  gap: 0.375rem;
}

.bb-thread-hover-card__meta-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 78%, transparent);
}

.bb-thread-hover-card__meta-label {
  flex: none;
}

.bb-thread-hover-card__truncate {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--foreground);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-thread-hover-card__pr {
  flex: none;
  align-items: center;
  overflow: visible;
}

.bb-thread-hover-card__access {
  flex: none;
  gap: 0.1875rem;
  color: color-mix(in srgb, var(--muted-foreground) 76%, transparent);
  font-size: 0.625rem;
  white-space: nowrap;
}

.bb-thread-hover-card__permission-icon {
  width: 0.625rem;
  height: 0.625rem;
  color: currentColor;
}

.bb-thread-hover-card__access[data-permission-mode="full"] {
  color: color-mix(
    in srgb,
    var(--warning-text, var(--warning)) 78%,
    var(--muted-foreground)
  );
}

.bb-thread-hover-card__pr-link {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.1875rem;
  border-radius: 0.25rem;
  color: var(--foreground);
  outline: none;
  text-decoration: none;
}

.bb-thread-hover-card__pr-number {
  flex: none;
}

.bb-thread-hover-card__inline-code {
  padding: 0.025rem 0.175rem;
  border-radius: 0.2rem;
  background: color-mix(in srgb, var(--foreground) 5%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.bb-thread-hover-card__inline-link {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 30%, transparent);
  text-underline-offset: 0.1rem;
}

.bb-thread-hover-card__inline-strong {
  font-weight: 550;
}

.bb-thread-hover-card__inline-emphasis {
  font-style: italic;
}

.bb-thread-hover-card__inline-strike {
  color: var(--muted-foreground);
}

.bb-thread-hover-card__pr-link:hover {
  text-decoration: underline;
  text-underline-offset: 0.125rem;
}

.bb-thread-hover-card__pr-link:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.bb-thread-hover-card__pr-status {
  flex: none;
  padding: 0.03125rem 0.25rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted-foreground) 7%, transparent);
  color: var(--muted-foreground);
  font-size: 0.5625rem;
  font-weight: 500;
  line-height: 1.35;
}

.bb-thread-hover-card__pr-status[data-tone="success"] {
  border-color: color-mix(in oklab, var(--success) 18%, transparent);
  background: color-mix(in oklab, var(--success) 9%, transparent);
  color: color-mix(in oklab, var(--success) 80%, var(--foreground));
}

.bb-thread-hover-card__pr-status[data-tone="danger"] {
  border-color:
    color-mix(in oklab, var(--destructive-text, var(--destructive)) 18%, transparent);
  background:
    color-mix(in oklab, var(--destructive-text, var(--destructive)) 8%, transparent);
  color: var(--destructive-text, var(--destructive));
}

.bb-thread-hover-card__pr-status[data-tone="merged"] {
  border-color: color-mix(in oklab, var(--pr-merged) 18%, transparent);
  background: color-mix(in oklab, var(--pr-merged) 9%, transparent);
  color: var(--pr-merged);
}

.bb-thread-hover-card__link-icon {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 82%, transparent);
}

.bb-thread-hover-card__loading {
  padding: 0.125rem 0;
}

.bb-thread-hover-card__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@keyframes bb-thread-hover-card-in {
  from {
    opacity: 0;
    transform: translateX(-0.2rem) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes bb-thread-hover-card-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes bb-thread-hover-card-message-shimmer {
  0%,
  32% {
    background-position: 130% 0;
  }

  100% {
    background-position: -130% 0;
  }
}

.bb-thread-hover-card__status-icon[data-animated="true"],
.bb-thread-hover-card__time-icon[data-animated="true"] {
  animation: bb-thread-hover-card-spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .bb-thread-hover-card.is-visible,
  .bb-thread-hover-card__status-icon[data-animated="true"],
  .bb-thread-hover-card__time-icon[data-animated="true"],
  .bb-thread-hover-card__summary[data-working="true"]
    .bb-thread-hover-card__message {
    animation: none;
  }
}

@supports not (
  (backdrop-filter: blur(1px)) or
    (-webkit-backdrop-filter: blur(1px))
) {
  .bb-thread-hover-card {
    background: var(--popover);
  }
}
`;
