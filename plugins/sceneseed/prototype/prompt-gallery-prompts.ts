export type PromptGalleryCategory =
  | "Plugin prototype"
  | "Product UI / screen"
  | "Early product idea";

export type PromptGalleryTint = "blue" | "green" | "orange" | "red" | null;

type GalleryLayout =
  | "sidebar"
  | "overlay"
  | "command"
  | "settings"
  | "inspector"
  | "timeline"
  | "dashboard"
  | "editor"
  | "empty"
  | "modal"
  | "diff"
  | "mobile"
  | "tablet"
  | "loading"
  | "commerce"
  | "calendar"
  | "player"
  | "offline"
  | "map"
  | "kanban"
  | "onboarding"
  | "error"
  | "search-empty"
  | "watch"
  | "tv"
  | "ar"
  | "split"
  | "network"
  | "planner"
  | "receipt"
  | "scanner"
  | "tracker"
  | "garden"
  | "routine"
  | "inventory";

type GalleryMotif =
  | "release"
  | "tokens"
  | "accessibility"
  | "incident"
  | "calendar"
  | "database"
  | "feedback"
  | "replay"
  | "citation"
  | "security"
  | "audio"
  | "price"
  | "dedupe"
  | "terminal"
  | "support"
  | "permissions"
  | "version"
  | "transfer"
  | "tables"
  | "video"
  | "analytics"
  | "package"
  | "appointment"
  | "music"
  | "home"
  | "travel"
  | "selection"
  | "onboarding"
  | "validation"
  | "search"
  | "fitness"
  | "profiles"
  | "furniture"
  | "email"
  | "tools"
  | "standup"
  | "food"
  | "care"
  | "climate"
  | "repair"
  | "learning"
  | "scope"
  | "coworking"
  | "garden"
  | "pickup"
  | "medication"
  | "events"
  | "sponsorship"
  | "estate"
  | "parts";

export interface PromptGalleryPrompt {
  readonly id: string;
  readonly title: string;
  readonly category: PromptGalleryCategory;
  readonly prompt: string;
  readonly layout: GalleryLayout;
  readonly motif: GalleryMotif;
  readonly tint: PromptGalleryTint;
}

export const PROMPT_GALLERY_PROMPTS: readonly PromptGalleryPrompt[] = [
  {
    id: "01-release-notes-sidebar",
    title: "Release notes sidebar",
    category: "Plugin prototype",
    prompt: "Prototype a compact bb sidebar plugin that watches one GitHub repository and turns merged pull requests into editable release notes. Show the populated desktop state with grouped changes, author avatars, a tone selector, and a primary Copy draft action. Keep it utilitarian and monochrome.",
    layout: "sidebar",
    motif: "release",
    tint: null,
  },
  {
    id: "02-token-drift-inspector",
    title: "Token drift inspector",
    category: "Plugin prototype",
    prompt: "Design a Figma plugin panel for finding design-token drift between selected layers and the team library. Use a dense inspector layout with three severity groups, before/after swatches, bulk selection, and a sticky Fix 12 values button. Aim for polished high-fidelity desktop UI.",
    layout: "inspector",
    motif: "tokens",
    tint: "blue",
  },
  {
    id: "03-accessibility-annotation-overlay",
    title: "Accessibility annotation overlay",
    category: "Plugin prototype",
    prompt: "Sketch a browser plugin that overlays numbered accessibility issues directly on a checkout page. Show contrast, missing-label, and keyboard-order pins plus a small floating issue tray. The underlying page should remain visible and the overlay must feel lightweight rather than modal.",
    layout: "overlay",
    motif: "accessibility",
    tint: "orange",
  },
  {
    id: "04-incident-command-palette",
    title: "Incident command palette",
    category: "Plugin prototype",
    prompt: "Prototype a Slack incident-response plugin opened as a command palette. Include a natural-language search field, recent incidents, suggested actions, keyboard shortcuts, and one destructive Escalate action separated from routine commands. Dark terminal-inspired styling, but still readable.",
    layout: "command",
    motif: "incident",
    tint: "red",
  },
  {
    id: "05-focus-time-settings",
    title: "Focus-time settings",
    category: "Plugin prototype",
    prompt: "Create the settings screen for a calendar plugin that automatically protects focus time. Show working-hour constraints, minimum block length, preferred mornings, excluded calendars, and a preview of next week's proposed blocks. Use friendly consumer SaaS styling and clear toggle states.",
    layout: "settings",
    motif: "calendar",
    tint: "green",
  },
  {
    id: "06-query-explainer",
    title: "Query explainer",
    category: "Plugin prototype",
    prompt: "Design an inline database IDE plugin that explains a slow SQL query beside the editor. Show the query plan as a short vertical flow, highlight the expensive join, estimate savings, and offer an Apply index suggestion button. Keep the information hierarchy technical and compact.",
    layout: "inspector",
    motif: "database",
    tint: "blue",
  },
  {
    id: "07-screenshot-feedback-pins",
    title: "Screenshot feedback pins",
    category: "Plugin prototype",
    prompt: "Prototype a screenshot-feedback plugin where reviewers pin comments onto a captured product screen. Show three resolved pins, one active comment thread, assignee and priority controls, and a Share review button. Use low-fidelity hand-drawn wireframe styling.",
    layout: "overlay",
    motif: "feedback",
    tint: "orange",
  },
  {
    id: "08-api-replay-timeline",
    title: "API replay timeline",
    category: "Plugin prototype",
    prompt: "Create a developer-tools plugin for replaying an API request step by step. Show request, authentication, redirects, response, and retry events on a horizontal timeline with one failed stage expanded. Add compact Replay from here and Copy curl controls.",
    layout: "timeline",
    motif: "replay",
    tint: "red",
  },
  {
    id: "09-citation-checker",
    title: "Citation checker",
    category: "Plugin prototype",
    prompt: "Design a Markdown editor sidebar plugin that checks citations against linked sources. Show verified, ambiguous, and missing-source groups, a selected sentence with matching evidence, and a Fix citation action. The screen should feel editorial, calm, and optimized for long-form writing.",
    layout: "sidebar",
    motif: "citation",
    tint: "green",
  },
  {
    id: "10-password-health-dashboard",
    title: "Password health dashboard",
    category: "Plugin prototype",
    prompt: "Prototype a password-manager health plugin dashboard with overall risk score, reused passwords, stale credentials, passkey readiness, and a recent breach warning. Avoid fear-heavy visuals; use a reassuring card layout with progressive disclosure and accessible color contrast.",
    layout: "dashboard",
    motif: "security",
    tint: "green",
  },
  {
    id: "11-transcript-highlights",
    title: "Transcript highlights",
    category: "Plugin prototype",
    prompt: "Create an audio-editing plugin that turns a transcript into highlight clips. Show the waveform, timestamped transcript lines, two selected quotes, speaker filters, and a Create 30-second clip action. Desktop split-pane layout with medium fidelity.",
    layout: "editor",
    motif: "audio",
    tint: "blue",
  },
  {
    id: "12-price-history-overlay",
    title: "Price history overlay",
    category: "Plugin prototype",
    prompt: "Sketch a shopping-browser plugin overlay on a product page that shows ninety-day price history, the typical range, a genuine-discount verdict, and an alert threshold. Keep it narrow enough not to cover the buy controls and show the current-price spike state.",
    layout: "overlay",
    motif: "price",
    tint: "orange",
  },
  {
    id: "13-asset-deduplicator-empty",
    title: "Asset deduplicator empty state",
    category: "Plugin prototype",
    prompt: "Design the empty state for a design-asset deduplication plugin after a successful scan finds no duplicates. Remove marketing language; show a simple success illustration, scanned-library summary, last scan time, and one Scan another folder action.",
    layout: "empty",
    motif: "dedupe",
    tint: "green",
  },
  {
    id: "14-environment-switcher",
    title: "Environment switcher",
    category: "Plugin prototype",
    prompt: "Prototype a local-development environment switcher that lives in a compact system tray popover. Show three projects, branch and port status, one sleeping environment, resource usage, and quick Start, Open, and Stop actions. Dense macOS-style utility UI.",
    layout: "command",
    motif: "terminal",
    tint: null,
  },
  {
    id: "15-support-macro-suggester",
    title: "Support macro suggester",
    category: "Plugin prototype",
    prompt: "Create a customer-support plugin beside a live ticket that suggests response macros based on sentiment and account context. Show confidence, editable variables, policy warnings, and a Preview reply state. Human-in-the-loop controls should be obvious.",
    layout: "sidebar",
    motif: "support",
    tint: "blue",
  },
  {
    id: "16-command-permissions-modal",
    title: "Command permissions modal",
    category: "Plugin prototype",
    prompt: "Design a confirmation modal for a CLI-launcher plugin before it runs a command that writes files and calls the network. Show the exact command, affected workspace, two requested permissions, remember-choice checkbox, Cancel, and Run once. High-trust developer styling.",
    layout: "modal",
    motif: "permissions",
    tint: "orange",
  },
  {
    id: "17-prompt-version-diff",
    title: "Prompt version diff",
    category: "Plugin prototype",
    prompt: "Prototype an AI prompt-versioning plugin with a side-by-side semantic diff, test-set score changes, model and temperature metadata, reviewer comments, and Promote version action. Show one regression warning and keep the comparison scannable on a laptop screen.",
    layout: "diff",
    motif: "version",
    tint: "red",
  },
  {
    id: "18-bank-transfer-confirmation",
    title: "Bank transfer confirmation",
    category: "Product UI / screen",
    prompt: "Design a mobile banking transfer-confirmation screen for sending $840 to a new recipient. Show recipient verification, arrival date, fee breakdown, fraud reminder, and a press-and-hold confirmation control. Calm, high-trust visual style with large touch targets.",
    layout: "mobile",
    motif: "transfer",
    tint: "green",
  },
  {
    id: "19-restaurant-table-plan",
    title: "Restaurant table plan",
    category: "Product UI / screen",
    prompt: "Prototype a tablet floor-plan screen for a busy restaurant host. Show occupied, reserved, cleaning, and available tables, a waiting-party queue, drag-to-assign interaction, and a selected party needing wheelchair access. Landscape tablet layout optimized for quick scanning.",
    layout: "tablet",
    motif: "tables",
    tint: "orange",
  },
  {
    id: "20-video-export-queue",
    title: "Video export queue",
    category: "Product UI / screen",
    prompt: "Create a desktop video editor's export-queue screen with one active 4K render, two queued social cuts, progress and time remaining, GPU usage, pause controls, and one failed export with a retry explanation. Dark creative-tool styling.",
    layout: "editor",
    motif: "video",
    tint: "blue",
  },
  {
    id: "21-analytics-loading-state",
    title: "Analytics loading state",
    category: "Product UI / screen",
    prompt: "Design the loading state for a web analytics dashboard while a large date range is being calculated. Keep the navigation and filters usable, use subdued skeletons for four metric cards and one chart, explain the delay, and avoid fake data flashing before results arrive.",
    layout: "loading",
    motif: "analytics",
    tint: null,
  },
  {
    id: "22-low-stock-product-page",
    title: "Low-stock product page",
    category: "Product UI / screen",
    prompt: "Prototype a responsive e-commerce product detail screen for a handmade lamp with only two left. Show image gallery, material variants, delivery estimate, transparent low-stock messaging, reviews, and Add to cart without using manipulative countdown timers. Warm editorial style.",
    layout: "commerce",
    motif: "package",
    tint: "orange",
  },
  {
    id: "23-appointment-reschedule",
    title: "Appointment reschedule",
    category: "Product UI / screen",
    prompt: "Create a healthcare appointment-rescheduling screen showing the current specialist visit, a two-week calendar, three accessible time slots, travel distance, insurance status, and a warning that changing loses the original slot. Mobile web, reassuring and plain-language.",
    layout: "calendar",
    motif: "appointment",
    tint: "green",
  },
  {
    id: "24-collaborative-music-queue",
    title: "Collaborative music queue",
    category: "Product UI / screen",
    prompt: "Design a collaborative music queue for a living-room party. Show who added each song, emoji voting, a protected host section, duplicate-song feedback, and the now-playing card. Playful color, but controls must remain usable from across the room.",
    layout: "player",
    motif: "music",
    tint: "blue",
  },
  {
    id: "25-thermostat-offline",
    title: "Thermostat offline",
    category: "Product UI / screen",
    prompt: "Prototype the offline state of a smart-home thermostat screen. Preserve the last known temperature and schedule, clearly separate unavailable remote actions, show troubleshooting steps, and allow a local-only fallback. Avoid an alarming full-screen error treatment.",
    layout: "offline",
    motif: "home",
    tint: "red",
  },
  {
    id: "26-travel-itinerary-map",
    title: "Travel itinerary map",
    category: "Product UI / screen",
    prompt: "Create a desktop travel itinerary with a map-and-list split view for a three-day Lisbon trip. Show timed stops, walking routes, reservation status, weather disruption, and an unscheduled saved place that can be dragged into the plan. Airy cartographic style.",
    layout: "map",
    motif: "travel",
    tint: "blue",
  },
  {
    id: "27-kanban-bulk-selection",
    title: "Kanban bulk selection",
    category: "Product UI / screen",
    prompt: "Design a kanban board in bulk-selection mode with seven cards selected across three columns. Replace normal card actions with a sticky bulk toolbar for assignee, due date, move, archive, and clear selection. Show one locked card that cannot be moved.",
    layout: "kanban",
    motif: "selection",
    tint: "orange",
  },
  {
    id: "28-permissions-onboarding",
    title: "Permissions onboarding",
    category: "Product UI / screen",
    prompt: "Prototype a three-step mobile onboarding screen asking for notifications, calendar access, and location only when each benefit becomes relevant. Show step two with calendar permission declined, a clear Not now path, and no guilt-inducing copy. Friendly illustrated fidelity.",
    layout: "onboarding",
    motif: "onboarding",
    tint: "green",
  },
  {
    id: "29-address-validation-error",
    title: "Address validation error",
    category: "Product UI / screen",
    prompt: "Create a checkout shipping-address form after validation finds an apartment number mismatch. Preserve every entered value, compare the typed and suggested addresses, explain the delivery risk, and offer Use mine or Use suggested. Desktop web with accessible error placement.",
    layout: "error",
    motif: "validation",
    tint: "red",
  },
  {
    id: "30-search-no-results",
    title: "Search no results",
    category: "Product UI / screen",
    prompt: "Design a no-results state for searching a large team knowledge base for an uncommon acronym. Keep the query and filters visible, suggest close matches and people to ask, expose a Clear filters action, and avoid generic empty-state marketing copy.",
    layout: "search-empty",
    motif: "search",
    tint: null,
  },
  {
    id: "31-workout-pause-watch",
    title: "Workout pause watch",
    category: "Product UI / screen",
    prompt: "Prototype a smartwatch workout screen paused during a rainy run. Show elapsed time, heart rate, GPS quality, water-lock status, and large Resume and End controls that work with wet fingers. High contrast, glanceable, no scrolling.",
    layout: "watch",
    motif: "fitness",
    tint: "red",
  },
  {
    id: "32-tv-profile-picker",
    title: "TV profile picker",
    category: "Product UI / screen",
    prompt: "Design a television streaming profile picker for five household members, including one child profile and one temporary guest. Show the focused remote-control state, content-rating cue, Manage profiles secondary action, and safe overscan spacing on a 16:9 screen.",
    layout: "tv",
    motif: "profiles",
    tint: "blue",
  },
  {
    id: "33-ar-furniture-placement",
    title: "AR furniture placement",
    category: "Product UI / screen",
    prompt: "Prototype a mobile AR furniture-placement screen after a sofa has been anchored. Show rotate and scale gestures, wall clearance warning, dimension toggle, change fabric, undo, and Add to room. Keep controls around the edges so the object stays visible.",
    layout: "ar",
    motif: "furniture",
    tint: "orange",
  },
  {
    id: "34-email-triage-split-pane",
    title: "Email triage split pane",
    category: "Product UI / screen",
    prompt: "Create a desktop email triage screen with inbox list, selected message, AI summary, reply draft, and keyboard-first archive, snooze, and assign actions. Show an urgent customer escalation and a privacy warning before inserting account data.",
    layout: "split",
    motif: "email",
    tint: "red",
  },
  {
    id: "35-neighborhood-tool-library",
    title: "Neighborhood tool library",
    category: "Early product idea",
    prompt: "Sketch an early product concept for neighbors lending rarely used tools. Show nearby inventory, trust signals, pickup windows, a drill detail card, and a simple request flow. Prioritize community safety and availability over social-feed features; mobile-first medium fidelity.",
    layout: "network",
    motif: "tools",
    tint: "green",
  },
  {
    id: "36-async-standup-room",
    title: "Async standup room",
    category: "Early product idea",
    prompt: "Prototype an async standup room for a remote product team across five time zones. Combine short video or text updates, blockers, reactions, and a synthesized handoff timeline. Show two people who have not checked in without making the screen feel punitive.",
    layout: "timeline",
    motif: "standup",
    tint: "blue",
  },
  {
    id: "37-leftovers-meal-planner",
    title: "Leftovers meal planner",
    category: "Early product idea",
    prompt: "Design an early mobile concept that turns photographed leftovers into a three-day meal plan. Show detected ingredients with confidence, dietary exclusions, two recipe cards, expiry urgency, and a way to correct recognition before generating the plan. Friendly scrapbook visual style.",
    layout: "planner",
    motif: "food",
    tint: "orange",
  },
  {
    id: "38-family-care-coordinator",
    title: "Family care coordinator",
    category: "Early product idea",
    prompt: "Prototype a private family coordination app for supporting an older parent. Show today's medication, transport, meal, and check-in tasks, who owns each item, one missed task, and a calm escalation path. Large type, clear privacy boundaries, no infantilizing language.",
    layout: "planner",
    motif: "care",
    tint: "green",
  },
  {
    id: "39-carbon-receipt",
    title: "Carbon receipt",
    category: "Early product idea",
    prompt: "Sketch a digital receipt that estimates the carbon impact of a grocery basket. Group impact by food, packaging, and transport, communicate uncertainty, compare one practical swap, and let the user hide the score. Receipt-like mobile layout, neutral rather than moralizing.",
    layout: "receipt",
    motif: "climate",
    tint: "green",
  },
  {
    id: "40-repairability-scanner",
    title: "Repairability scanner",
    category: "Early product idea",
    prompt: "Prototype a phone camera experience that scans an appliance label and estimates repairability. Show recognized model, confidence, common faults, parts availability, local repair options, and a clear unsupported-model state. Rugged utility styling suitable for a workshop.",
    layout: "scanner",
    motif: "repair",
    tint: "orange",
  },
  {
    id: "41-commute-micro-learning",
    title: "Commute micro-learning",
    category: "Early product idea",
    prompt: "Design a micro-learning product for a twelve-minute train commute. Show one adaptive lesson, download status, progress across the week, audio/text mode, a confidence check, and graceful handling when the trip ends early. Mobile, distraction-light, low-data mode.",
    layout: "mobile",
    motif: "learning",
    tint: "blue",
  },
  {
    id: "42-scope-creep-tracker",
    title: "Scope-creep tracker",
    category: "Early product idea",
    prompt: "Prototype a freelancer dashboard that spots scope creep by comparing a signed proposal with incoming requests. Show three detected changes, estimated extra effort, client-friendly clarification language, and an approval trail. Serious but non-confrontational desktop UI.",
    layout: "tracker",
    motif: "scope",
    tint: "red",
  },
  {
    id: "43-quiet-coworking-match",
    title: "Quiet coworking match",
    category: "Early product idea",
    prompt: "Sketch a service that matches remote workers for silent two-hour coworking sessions. Show availability overlap, focus preferences, camera comfort, lightweight reputation, and a matched-session lobby. Avoid dating-app patterns; calm, minimal, privacy-forward design.",
    layout: "network",
    motif: "coworking",
    tint: "blue",
  },
  {
    id: "44-community-garden-planner",
    title: "Community garden planner",
    category: "Early product idea",
    prompt: "Design a shared community-garden planner with plot map, seasonal crop rotation, watering rota, shared tool status, and a conflict where two members selected the same bed. Tablet-friendly illustrated interface that remains usable outdoors in bright light.",
    layout: "garden",
    motif: "garden",
    tint: "green",
  },
  {
    id: "45-school-pickup-coordinator",
    title: "School pickup coordinator",
    category: "Early product idea",
    prompt: "Prototype a school pickup coordination screen for three families sharing rides. Show verified guardians, today's route, child handoff confirmations, late-driver alert, and an emergency fallback. Mobile-first, high trust, with actions usable one-handed.",
    layout: "map",
    motif: "pickup",
    tint: "orange",
  },
  {
    id: "46-pet-medication-routine",
    title: "Pet medication routine",
    category: "Early product idea",
    prompt: "Create an early product screen for coordinating a pet's medication between household members. Show dose schedule, remaining supply, photo confirmation, side-effect notes, vet instructions, and one missed dose awaiting guidance. Warm but clinically clear mobile design.",
    layout: "routine",
    motif: "medication",
    tint: "green",
  },
  {
    id: "47-local-event-buddy",
    title: "Local event buddy",
    category: "Early product idea",
    prompt: "Sketch a local-events product that helps someone attend alone without forced networking. Show an event detail, optional low-pressure buddy matching, arrival window, conversation preferences, safety check-in, and a Browse without matching path. Inclusive consumer styling.",
    layout: "network",
    motif: "events",
    tint: "blue",
  },
  {
    id: "48-sponsorship-pipeline",
    title: "Sponsorship pipeline",
    category: "Early product idea",
    prompt: "Prototype a lightweight sponsorship pipeline for a small creator. Show prospect, negotiating, contracted, and delivered stages; expected revenue; deliverables; usage-rights warning; and one overdue invoice. Desktop kanban with spreadsheet-level clarity.",
    layout: "kanban",
    motif: "sponsorship",
    tint: "orange",
  },
  {
    id: "49-digital-estate-plan",
    title: "Digital estate plan",
    category: "Early product idea",
    prompt: "Design an early digital-estate planning dashboard for organizing accounts, devices, documents, and instructions for trusted contacts. Show completion progress, encrypted items, review dates, and what each contact can access. Quiet, high-trust, non-morbid visual language.",
    layout: "dashboard",
    motif: "estate",
    tint: "blue",
  },
  {
    id: "50-hobby-parts-inventory",
    title: "Hobby parts inventory",
    category: "Early product idea",
    prompt: "Prototype a visual parts inventory for someone building small electronics projects. Show labeled bins, quantities, reserved parts, low-stock chips, project allocations, barcode scan, and a Find on shelf interaction. Desktop plus phone companion concept, playful workshop style.",
    layout: "inventory",
    motif: "parts",
    tint: "orange",
  },
] as const;

type Point = readonly [number, number];

interface StrokeOptions {
  readonly closed?: boolean;
  readonly layering?: number;
  readonly opacity?: number;
  readonly width?: number;
  readonly pressure?: number | readonly number[];
  readonly smoothing?: number;
  readonly shape?: "round" | "tapered" | "flat";
}

interface StrokeSpec {
  readonly points: readonly Point[];
  readonly options?: StrokeOptions;
}

const detail: StrokeOptions = {
  layering: 1,
  opacity: 0.72,
  width: 0.08,
  smoothing: 0,
};

const quiet: StrokeOptions = {
  layering: 1,
  opacity: 0.6,
  width: 0.065,
  smoothing: 0,
};

function stroke(points: readonly Point[], options?: StrokeOptions): StrokeSpec {
  return { points, options };
}

function line(x1: number, y1: number, x2: number, y2: number, options = detail): StrokeSpec {
  return stroke([[x1, y1], [x2, y2]], options);
}

function rect(x: number, y: number, width: number, height: number, options: StrokeOptions = detail): StrokeSpec {
  return stroke(
    [[x, y], [x + width, y], [x + width, y + height], [x, y + height]],
    { ...options, closed: true },
  );
}

function circle(cx: number, cy: number, radius: number, options: StrokeOptions = detail): StrokeSpec {
  return stroke(
    Array.from({ length: 8 }, (_, index) => {
      const angle = (index / 8) * Math.PI * 2;
      return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius] as Point;
    }),
    { ...options, closed: true },
  );
}

function zigzag(x: number, y: number, width: number, height: number, options = detail): StrokeSpec {
  return stroke(
    Array.from({ length: 6 }, (_, index) => [
      x + (width * index) / 5,
      y + (index % 2 === 0 ? 0 : height),
    ] as Point),
    options,
  );
}

function browserFrame(): StrokeSpec[] {
  return [
    rect(-6.7, -3.7, 13.4, 7.4, { layering: 2, opacity: 0.9, width: 0.1, smoothing: 0 }),
    line(-6.7, 2.75, 6.7, 2.75, quiet),
    ...[-6.15, -5.75, -5.35].map((x) => circle(x, 3.2, 0.11, quiet)),
  ];
}

function phoneFrame(): StrokeSpec[] {
  return [
    rect(-2.45, -3.8, 4.9, 7.6, { layering: 2, opacity: 0.9, width: 0.11, smoothing: 0 }),
    line(-0.55, 3.48, 0.55, 3.48, quiet),
    line(-0.42, -3.48, 0.42, -3.48, quiet),
  ];
}

function cards(columns: number, rows: number, x: number, y: number, width: number, height: number): StrokeSpec[] {
  const output: StrokeSpec[] = [];
  const gap = 0.25;
  const cardWidth = (width - gap * (columns - 1)) / columns;
  const cardHeight = (height - gap * (rows - 1)) / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      output.push(rect(x + column * (cardWidth + gap), y - row * (cardHeight + gap) - cardHeight, cardWidth, cardHeight, quiet));
    }
  }
  return output;
}

function baseLayout(layout: GalleryLayout): StrokeSpec[] {
  switch (layout) {
    case "sidebar":
      return [...browserFrame(), line(-2.2, -3.7, -2.2, 2.75, quiet), ...cards(1, 4, -6.15, 2.25, 3.35, 4.8), ...cards(1, 2, -1.65, 2.1, 7.7, 4.3)];
    case "overlay":
      return [...browserFrame(), ...cards(2, 2, -5.9, 2.15, 8.2, 4.6), rect(2.6, -2.75, 3.45, 4.75, { ...detail, layering: 2 }), line(3.05, 1.35, 5.55, 1.35, detail), ...cards(1, 3, 3.05, 0.95, 2.5, 2.9)];
    case "command":
      return [...browserFrame(), rect(-3.8, -2.6, 7.6, 4.9, { ...detail, layering: 2 }), rect(-3.25, 1.35, 6.5, 0.55, detail), ...[-0.2, -0.95, -1.7].map((y) => line(-2.8, y, 2.7, y, y === -0.95 ? detail : quiet))];
    case "settings":
      return [...browserFrame(), line(-3.2, -3.7, -3.2, 2.75, quiet), ...[-2.1, -1.2, -0.3, 0.6, 1.5].map((y, i) => line(-2.5, y, i % 2 ? 4.1 : 2.7, y, quiet)), ...[-1.2, 0.6, 1.5].map((y) => rect(4.55, y - 0.18, 0.9, 0.36, detail))];
    case "inspector":
      return [...browserFrame(), rect(-6.05, -3.05, 4.5, 5.2, quiet), line(2.25, -3.7, 2.25, 2.75, quiet), ...cards(1, 4, 2.75, 2.25, 3.25, 4.8), zigzag(-5.5, -1.4, 3.4, 2.8, detail)];
    case "timeline":
      return [...browserFrame(), line(-5.6, -0.4, 5.6, -0.4, detail), ...[-4.7, -2.4, 0, 2.2, 4.8].flatMap((x, i) => [circle(x, -0.4, i === 2 ? 0.24 : 0.16, detail), rect(x - 0.75, i % 2 ? -2.35 : 0.35, 1.5, 1.25, quiet)])];
    case "dashboard":
      return [...browserFrame(), line(-6.7, 1.65, 6.7, 1.65, quiet), ...cards(4, 1, -5.9, 1.25, 11.8, 1.5), rect(-5.9, -2.9, 7.1, 2.35, quiet), rect(1.55, -2.9, 4.35, 2.35, quiet), zigzag(-5.3, -2.1, 5.8, 1.2, detail)];
    case "editor":
      return [...browserFrame(), rect(-6, -0.25, 8.2, 2.45, quiet), rect(2.55, -0.25, 3.45, 2.45, quiet), line(-6, -1.15, 6, -1.15, detail), ...[-2.05, -2.65].flatMap((y) => [rect(-5.8, y, 3.5, 0.42, quiet), rect(-2.05, y, 2.2, 0.42, quiet), rect(0.4, y, 4.2, 0.42, quiet)])];
    case "empty":
      return [...browserFrame(), circle(0, 0.65, 1.05, { ...detail, layering: 2 }), line(-1.8, -1.1, 1.8, -1.1, quiet), line(-1.2, -1.65, 1.2, -1.65, quiet), rect(-0.95, -2.45, 1.9, 0.48, detail)];
    case "modal":
      return [...browserFrame(), ...cards(2, 2, -5.7, 2.1, 11.4, 4.5), rect(-3.5, -2.55, 7, 4.9, { ...detail, layering: 2 }), ...[-0.3, 0.5, 1.3].map((y) => line(-2.75, y, 2.6, y, quiet)), rect(-0.1, -1.8, 2.5, 0.55, detail)];
    case "diff":
      return [...browserFrame(), line(0, -3.7, 0, 2.75, quiet), ...[-2.45, -1.65, -0.85, -0.05, 0.75, 1.55].flatMap((y, i) => [line(-5.8, y, -1.1 + (i % 2) * 0.8, y, i === 2 ? detail : quiet), line(0.85, y, 5.6 - (i % 3) * 0.5, y, i === 3 ? detail : quiet)])];
    case "mobile":
      return [...phoneFrame(), line(-2.1, 2.65, 2.1, 2.65, quiet), ...cards(1, 3, -1.9, 2.15, 3.8, 4.4), line(-1.7, -2.95, 1.7, -2.95, quiet)];
    case "tablet":
      return [rect(-5.9, -3.7, 11.8, 7.4, { layering: 2, opacity: 0.9, width: 0.11, smoothing: 0 }), line(2.2, -3.7, 2.2, 3.7, quiet), ...cards(3, 2, -5.25, 2.95, 6.7, 5.6), ...cards(1, 4, 2.75, 2.95, 2.55, 5.6)];
    case "loading":
      return [...browserFrame(), ...cards(4, 1, -5.9, 1.7, 11.8, 1.45), rect(-5.9, -2.7, 11.8, 3.2, quiet), ...[-1.9, -1.1, -0.3].map((y, i) => line(-5.2, y, 5.2 - i * 1.2, y, quiet))];
    case "commerce":
      return [...browserFrame(), rect(-6, -2.9, 6.7, 5.2, quiet), rect(1.1, 1.55, 4.8, 0.55, detail), ...[0.7, -0.1, -0.9].map((y, i) => line(1.2, y, 5.2 - i * 0.7, y, quiet)), rect(1.2, -2.45, 4.2, 0.65, { ...detail, layering: 2 })];
    case "calendar":
      return [...phoneFrame(), ...[-1.3, -0.65, 0, 0.65, 1.3].map((x) => line(x, -0.9, x, 1.75, quiet)), ...[-0.25, 0.4, 1.05, 1.7].map((y) => line(-1.95, y, 1.95, y, quiet)), ...cards(1, 3, -1.95, -1.25, 3.9, 1.75)];
    case "player":
      return [...browserFrame(), circle(-2.75, 0.2, 1.8, { ...detail, layering: 2 }), ...[-1.2, -0.3, 0.6, 1.5].map((y, i) => line(0.1, y, 5.4 - i * 0.45, y, i === 1 ? detail : quiet)), ...[-1.1, 0, 1.1].map((x) => circle(x - 0.1, -2.4, 0.2, detail))];
    case "offline":
      return [...phoneFrame(), circle(0, 0.85, 1.15, quiet), line(-0.9, 1.75, 0.9, -0.05, detail), ...[0, -0.75, -1.5].map((y, i) => line(-1.45, y, 1.45 - i * 0.25, y, quiet)), rect(-1.35, -2.55, 2.7, 0.55, detail)];
    case "map":
      return [...browserFrame(), line(1.1, -3.7, 1.1, 2.75, quiet), zigzag(-6.1, -1.2, 6.2, 3, detail), ...[[-4.7, 1.4], [-2.1, -0.2], [-0.2, 1.1]].map(([x, y]) => circle(x!, y!, 0.2, detail)), ...cards(1, 4, 1.65, 2.2, 4.4, 4.9)];
    case "kanban":
      return [...browserFrame(), ...[-5.9, -1.85, 2.2].flatMap((x, column) => [rect(x, -2.9, 3.7, 5.15, quiet), ...cards(1, column === 1 ? 3 : 2, x + 0.35, 1.55, 3, column === 1 ? 3.7 : 2.4)])];
    case "onboarding":
      return [...phoneFrame(), ...[-0.75, 0, 0.75].map((x, i) => circle(x, 2.75, i === 1 ? 0.17 : 0.11, i === 1 ? detail : quiet)), circle(0, 1.05, 0.85, quiet), ...cards(1, 2, -1.7, 0, 3.4, 1.8), rect(-1.4, -2.7, 2.8, 0.55, detail)];
    case "error":
      return [...browserFrame(), ...[1.45, 0.35, -0.75, -1.85].map((y, i) => rect(-3.8, y, 7.6, 0.72, i === 2 ? detail : quiet)), line(2.85, -0.65, 3.35, -1.15, detail), line(3.35, -0.65, 2.85, -1.15, detail)];
    case "search-empty":
      return [...browserFrame(), rect(-4.8, 1.7, 9.6, 0.65, detail), circle(-0.2, -0.15, 1, quiet), line(0.55, -0.9, 1.35, -1.7, quiet), line(-2.1, -2.25, 2.1, -2.25, quiet)];
    case "watch":
      return [rect(-2.6, -3.15, 5.2, 6.3, { layering: 2, opacity: 0.9, width: 0.11, smoothing: 0 }), line(-1.3, 3.15, -1.3, 3.75, quiet), line(1.3, 3.15, 1.3, 3.75, quiet), line(-1.3, -3.15, -1.3, -3.75, quiet), line(1.3, -3.15, 1.3, -3.75, quiet), circle(0, 0.7, 1.05, detail), rect(-1.8, -2.25, 1.65, 0.75, detail), rect(0.15, -2.25, 1.65, 0.75, detail)];
    case "tv":
      return [rect(-6.6, -3.4, 13.2, 6.8, { layering: 2, opacity: 0.9, width: 0.11, smoothing: 0 }), ...[-3.6, -1.2, 1.2, 3.6].map((x, i) => circle(x, 0.45, i === 1 ? 0.85 : 0.68, i === 1 ? { ...detail, layering: 2 } : quiet)), line(-4.4, -1.35, 4.4, -1.35, quiet)];
    case "ar":
      return [...phoneFrame(), line(-1.9, -1.45, 1.9, -0.75, quiet), rect(-1.25, -0.7, 2.5, 1.65, { ...detail, layering: 2 }), line(-1.25, 0.95, 0, 1.55, detail), line(1.25, 0.95, 0, 1.55, detail), ...[-1.3, 0, 1.3].map((x) => circle(x, -2.7, 0.22, quiet))];
    case "split":
      return [...browserFrame(), line(-1.8, -3.7, -1.8, 2.75, quiet), line(2.15, -3.7, 2.15, 2.75, quiet), ...cards(1, 5, -6.1, 2.25, 3.75, 5.1), ...[-2.35, -1.55, -0.75, 0.05, 0.85, 1.65].map((y, i) => line(-1.25, y, 1.35 - (i % 2) * 0.5, y, quiet)), ...cards(1, 3, 2.65, 2.15, 3.35, 4.7)];
    case "network":
      return [...browserFrame(), ...[[-3.9, 1.2], [-1.3, -1.35], [1.3, 1.3], [4, -1.1]].map(([x, y], i) => circle(x!, y!, i === 1 ? 0.72 : 0.52, i === 1 ? detail : quiet)), line(-3.4, 0.85, -1.8, -0.95, quiet), line(-0.75, -0.95, 0.8, 0.9, quiet), line(1.85, 0.9, 3.5, -0.75, quiet)];
    case "planner":
      return [...phoneFrame(), ...[-1.25, -0.35, 0.55, 1.45].map((y, i) => [circle(-1.55, y, 0.13, i === 2 ? detail : quiet), line(-1.2, y, 1.55 - (i % 2) * 0.5, y, quiet)]).flat(), rect(-1.65, -2.6, 3.3, 0.55, detail)];
    case "receipt":
      return [rect(-2.65, -3.75, 5.3, 7.5, { layering: 2, opacity: 0.9, width: 0.1, smoothing: 0 }), ...[2.5, 1.65, 0.8, -0.05, -0.9, -1.75].map((y, i) => line(-1.95, y, 1.9 - (i % 3) * 0.45, y, quiet)), zigzag(-1.9, -2.8, 3.8, 0.6, detail)];
    case "scanner":
      return [...phoneFrame(), ...[-1.55, 1.55].flatMap((x) => [line(x, 1.7, x, 2.65, detail), line(x, -0.7, x, -1.65, detail)]), line(-1.55, 2.65, -0.55, 2.65, detail), line(0.55, 2.65, 1.55, 2.65, detail), line(-1.55, -1.65, -0.55, -1.65, detail), line(0.55, -1.65, 1.55, -1.65, detail), rect(-1.75, -3, 3.5, 0.55, quiet)];
    case "tracker":
      return [...browserFrame(), rect(-5.9, -2.85, 7.3, 4.85, quiet), zigzag(-5.25, -1.95, 5.8, 3, detail), ...cards(1, 4, 1.8, 1.95, 4.1, 4.75)];
    case "garden":
      return [rect(-6.2, -3.45, 8.25, 6.9, { ...detail, layering: 2 }), ...[-3.45, -0.7].map((x) => line(x, -3.15, x, 3.15, quiet)), ...[-1.1, 1.1].map((y) => line(-5.9, y, 1.75, y, quiet)), ...cards(1, 4, 2.45, 3, 3.45, 5.9)];
    case "routine":
      return [...phoneFrame(), line(-1.45, 2.15, -1.45, -1.85, quiet), ...[1.7, 0.7, -0.3, -1.3].flatMap((y, i) => [circle(-1.45, y, i === 2 ? 0.18 : 0.12, i === 2 ? detail : quiet), rect(-0.95, y - 0.35, 2.5, 0.7, quiet)]), rect(-1.45, -2.75, 2.9, 0.5, detail)];
    case "inventory":
      return [...browserFrame(), ...[-3.95, -1.2, 1.55, 4.3].map((x) => line(x, -2.75, x, 2.1, quiet)), ...[-1.1, 0.5, 2.1].map((y) => line(-6, y, 6, y, quiet)), ...[[ -4.8, 1.3 ], [ -2.1, -0.2 ], [ 0.65, 1.25 ], [ 3.35, -1.85 ]].map(([x, y]) => circle(x!, y!, 0.32, detail))];
  }
}

function motif(layout: GalleryLayout, seed: number): StrokeSpec[] {
  const shift = ((seed % 5) - 2) * 0.16;
  const cx = layout === "mobile" || layout === "planner" || layout === "routine" || layout === "scanner" ? 0 : layout === "sidebar" ? 3.4 : 0;
  const cy = layout === "command" ? 0.45 : layout === "dashboard" ? -1.7 : 0.35;
  const result: StrokeSpec[] = [];
  const variant = seed % 8;
  if (variant === 0) {
    result.push(circle(cx + shift, cy, 0.58, detail), line(cx - 0.4 + shift, cy, cx + 0.4 + shift, cy, detail), line(cx + shift, cy - 0.4, cx + shift, cy + 0.4, detail));
  } else if (variant === 1) {
    result.push(zigzag(cx - 0.85 + shift, cy - 0.45, 1.7, 1.05, detail), line(cx - 0.9 + shift, cy - 0.7, cx + 0.9 + shift, cy - 0.7, quiet));
  } else if (variant === 2) {
    result.push(rect(cx - 0.7 + shift, cy - 0.55, 1.4, 1.1, detail), circle(cx + shift, cy, 0.24, quiet));
  } else if (variant === 3) {
    result.push(circle(cx - 0.35 + shift, cy + 0.2, 0.42, detail), circle(cx + 0.35 + shift, cy + 0.2, 0.42, detail), line(cx - 0.75 + shift, cy - 0.65, cx + 0.75 + shift, cy - 0.65, quiet));
  } else if (variant === 4) {
    result.push(stroke([[cx - 0.9 + shift, cy - 0.5], [cx - 0.35 + shift, cy + 0.65], [cx + 0.2 + shift, cy - 0.05], [cx + 0.9 + shift, cy + 0.55]], detail));
  } else if (variant === 5) {
    result.push(circle(cx + shift, cy, 0.62, quiet), stroke([[cx - 0.65 + shift, cy - 0.15], [cx - 0.2 + shift, cy + 0.35], [cx + 0.15 + shift, cy - 0.3], [cx + 0.65 + shift, cy + 0.2]], detail));
  } else if (variant === 6) {
    result.push(rect(cx - 0.85 + shift, cy - 0.55, 1.7, 1.1, quiet), line(cx - 0.55 + shift, cy + 0.2, cx + 0.55 + shift, cy + 0.2, detail), line(cx - 0.25 + shift, cy - 0.25, cx + 0.55 + shift, cy - 0.25, quiet));
  } else {
    result.push(stroke([[cx - 0.8 + shift, cy], [cx - 0.35 + shift, cy + 0.55], [cx + shift, cy], [cx + 0.35 + shift, cy + 0.55], [cx + 0.8 + shift, cy]], detail), line(cx - 0.6 + shift, cy - 0.45, cx + 0.6 + shift, cy - 0.45, quiet));
  }
  return result;
}

function stableSeed(input: string): number {
  let value = 2166136261;
  for (const character of input) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function buildPromptGallerySource(entry: PromptGalleryPrompt): string {
  const seed = stableSeed(`${entry.id}:${entry.prompt}`);
  const strokes = [...baseLayout(entry.layout), ...motif(entry.layout, seed)];
  return `const root = new THREE.Group();
const brush = BRUSH.create({ seed: ${seed}, texture: "pencil", textureStrength: 0.86, shape: "tapered", width: 0.1, opacity: 0.9, pressureVariation: 0.3, jitter: 0.48, layering: 2, color: 0x202020, colorBehavior: "graphite", colorVariation: 0.12, smoothing: 0.18 });
const strokes = ${JSON.stringify(strokes)};
for (const item of strokes) root.add(brush.stroke(item.points, item.options));
return { root, name: ${JSON.stringify(entry.title)}, altText: ${JSON.stringify(`A hand-drawn ${entry.title.toLowerCase()} interface concept.`)}, camera: "front", movement: "still", shadow: "none" };`;
}
