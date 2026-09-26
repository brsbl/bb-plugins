import { POPPY_HILL_SOURCE } from "./builtins.js";

export interface LocalMoment {
  date: string;
  hour: number;
  label: string;
}

export function localMoment(timeZone: string, at: Date): LocalMoment {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    label,
  };
}

export function dailyCron(hour: number): string {
  return `0 ${hour} * * *`;
}

export function cronHour(cron: string | undefined): number | null {
  const match = /^0 (\d{1,2}) \* \* \*$/.exec(cron ?? "");
  return match ? Number(match[1]) : null;
}

export function parseDailyOptions(options: readonly string[]): { hour?: number; timeZone?: string } {
  const parsed: { hour?: number; timeZone?: string } = {};
  for (const option of options) {
    if (/^\d{1,2}$/.test(option)) {
      parsed.hour = Number(option);
    } else {
      parsed.timeZone = option;
    }
  }
  return parsed;
}

export const DAILY_CONCEPTS = [
  "bioluminescent tide pool at night, agents as glowing jellyfish",
  "aurora over a frozen lake, agents as drifting lanterns on the ice",
  "koi pond from above, agents as koi that leave wakes",
  "rain running down a window with city bokeh behind it, agents as passing headlights",
  "ink blooming in water, agents as drops that keep feeding new blooms",
  "murmuration of starlings at dusk, agents as the birds leading the flock",
  "slow meteor shower over a desert, agents as comets with tails",
  "paper-cut mountain ranges in parallax, agents as hot-air balloons",
  "lava lamp, agents as rising wax blobs",
  "wheat field swaying in wind, agents as gusts moving through it",
  "coral reef caustics, agents as small bright fish",
  "neon fog over a night city, agents as moving signs",
  "snow falling under streetlights, agents as the lamps",
  "deep-space nebula with slow gas currents, agents as newborn stars",
  "cloud chamber with particle trails, agents as the particle sources",
  "sun through slowly turning window blinds, agents as floating dust motes",
  "ocean swell from above with foam lines, agents as small boats",
  "moss and ferns on a forest floor with drifting pollen, agents as fireflies",
  "stained glass lit from behind by a moving sun, agents as brighter panes",
  "sand dunes shifting at golden hour, agents as wandering caravans",
] as const;

export function dailyConcept(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
  return DAILY_CONCEPTS[dayNumber % DAILY_CONCEPTS.length]!;
}

function conceptLines(moment: LocalMoment, request: string | undefined): string[] {
  if (!request) {
    return [
      `Paint today's Ambient scene: the living background bb shows behind its UI. It is ${moment.label} in the user's time zone.`,
      `Today's starting concept: ${dailyConcept(moment.date)}. Make it your own, and let the season and time of day color it.`,
    ];
  }
  return [
    `Paint a new Ambient scene: the living background bb shows behind its UI. It is ${moment.label} in the user's time zone.`,
    `The user asked for: ${JSON.stringify(request)}`,
    "After researching the style (step 1 below) and before writing any GLSL, expand that request into a full concept the way an art director would, keeping the user's words at its center:",
    "- The subject and setting, concretely.",
    "- The art style, from your style sheet.",
    "- A four-color palette sampled from your references that makes it vivid against bb's UI.",
    "- The motion: what moves, and how wind, water, or light behaves.",
    "- What working agents become (bright, characterful elements), what waiting agents do, and what ripples become: finished turns, and something red for errors.",
    "- An evocative name under 40 characters.",
    "Say the style sheet and the expanded concept in a few lines, then paint it.",
  ];
}

export function dailyPrompt(moment: LocalMoment, timeZone: string, request?: string): string {
  return [
    ...conceptLines(moment, request),
    `The user's time zone is ${timeZone}.`,
    "Paint for how bb frames the scene:",
    "- bb's sidebar, a wide centered thread column, and the composer cover most of the middle of the window with frosted glass that blurs and tints what is behind it. The scene reads clearly only in the open areas: the side margins, the gaps between panels, and the strips along the top and bottom. action=look reports where they are in the user's current window, but the layout changes: the sidebar collapses, windows resize, and side panels open.",
    "- Fill the frame edge to edge and never center a lone subject. Put the recognizable parts (horizon, silhouettes, characters, the brightest accents) where they are seen: along the edges, low in the frame, and repeated across the width. Under the glass only big shapes and color fields survive the blur, so give the middle large, soft masses of color, not fine detail.",
    "- Work at a readable scale: key shapes should be 5 to 30% of the window's height. Texture (brushstrokes, grain, dots) is a surface on top of those shapes, never the whole idea.",
    "- Build depth with at least three layers (far, middle, near), each with its own value and its own speed of motion, like parallax.",
    "- Give it strong value structure and saturated color: clear lights and darks, all four palette colors visible, not one flat mid-tone or a single hue.",
    "Paint in two passes, the way the built-in Poppy Hill in the Wind does. It is the quality bar, and its full source is at the end of this brief:",
    "- A subject function paints the scene plainly: forms, light, and depth in continuous color, with no style yet. Poppy Hill's base() draws the sky, clouds, hills, grass, and poppies.",
    "- A style pass re-renders the subject in the medium by resampling it, so the style shapes every pixel. Poppy Hill's dabLayer() cuts the window into jittered, oriented brush dabs; each dab takes one color from the subject, dab direction follows the form (level in the sky, upright and wind-bent in the grass), and two offset dab layers overlap with bristle streaks.",
    "- Never draw flat smoothstep shapes and lay sine stripes or noise on top as texture. That reads as clip art however many layers it has.",
    "- The style pass calls the subject once or twice per pixel, so keep the subject cheap.",
    "Style passes that work:",
    "- Painterly (impressionism, Van Gogh, oil, gouache): dab resampling like Poppy Hill. Set each dab's angle from the form or a flow field (for Van Gogh, the tangent of the swirling sky), make dabs larger and longer for bolder styles, shift each dab's color slightly toward a neighboring palette color for broken color, and shade dab edges for impasto.",
    "- Pointillism: a staggered dot grid; each dot takes the subject's color at its center, snapped to pure palette colors with occasional complementary dots.",
    "- Watercolor: warp the subject lookup with fbm so colors bleed, darken edges where the subject's color changes, add pigment granulation and paper grain, and leave light areas as bare paper.",
    "- Claymation and soft 3D: model the subject as SDF shapes with height, light it from normals (key light, soft fill, rim, contact shadows, ambient occlusion), perturb the normals with thumbprint noise, soften the far layer like shallow depth of field, and step time at 12 frames per second for stop motion.",
    "- Woodcut, linocut, ukiyo-e: posterize the subject into three or four flat inks with bold outlines, then carve lines whose direction follows the forms and whose spacing follows value; ukiyo-e adds soft bokashi gradients.",
    "- Pixel art: sample the subject on a coarse grid, snap to the palette, and use ordered dithering.",
    "It should feel alive, not like a still gradient:",
    "- Continuous, visible motion at the default speed: things drift, flow, orbit, or fall. Layer at least two motions at different speeds.",
    "- Agents (u_agents) are characters in the concept, not generic dots: give working agents movement or trails and let waiting agents pulse or call out.",
    "- Ripples (u_ripples) are events in the concept, like splashes, bursts, or gusts. Errors (kind 1) read red or alarming.",
    "- The cursor (u_pointer) disturbs the scene nearby.",
    "- Stay readable behind text: the motion can be lively, but keep value contrast gentle where panels usually sit. Never fade, blank, lighten, or tint a region to match a panel's current position; fix readability in the composition itself.",
    "Steps:",
    "1. Research the style before designing anything. Search the web for the artwork, artist, or medium and how it is made, then download one or two reference images into your working directory and open them. Write a short style sheet: the three to five traits that make the style recognizable at a glance (mark shape and size, stroke direction, edges, lighting, texture, color relationships), each paired with the shader technique that will produce it. If you cannot search or view images, work from what you know and say so.",
    "2. Call the ambient tool with action=get to read the shader contract and the current scene, and action=library to see recent scenes; make something clearly different from them.",
    "3. Write the scene with action=set. Name it evocatively in under 40 characters, and expose 3 to 6 params someone would enjoy tuning (for example speed of a motion, density, glow, trail length).",
    "4. If set reports a compile error or that the scene is too heavy, fix the GLSL and set it again.",
    "5. Call action=look with ripple=done. Its first image is the scene behind bb's real UI as the user sees it, with text drawn as bars; judge that image, not the raw scene. Write a short, honest critique that answers each question:",
    "   - Could someone name the concept from the open areas alone within two seconds?",
    "   - Put it next to your reference images: would someone who knows the style name it? What are the three biggest differences from the references and from Poppy Hill's finish?",
    "   - Are there three layers of depth, clear lights and darks, and all four palette colors?",
    "   - Is the text readable? The report counts words the scene made harder to read and outlines them in red.",
    "   - Does the report flag anything (too faint, nearly still, too heavy, hidden subject, hard to read)?",
    "   Then fix the weakest answer with action=set and look again. A report that flags nothing only rules out technical failures; it does not mean the scene is good. Revise at least twice after the first look unless every answer is a clear yes, and stop after six looks.",
    "6. Call action=save so the scene lands in the library.",
    "If set says no bb window verified the scene, stop and say so instead of saving.",
    "Finish with one sentence describing the scene, and one sentence on what you would still improve.",
    "",
    "Poppy Hill in the Wind, the quality bar. Study how base() and dabLayer() work together; do not reuse its subject:",
    POPPY_HILL_SOURCE,
  ].join("\n");
}
