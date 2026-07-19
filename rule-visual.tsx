import type { DoctrineRule } from "./server";

type VisualConcept =
  | "toolbar"
  | "layout"
  | "component"
  | "navigation"
  | "content"
  | "state"
  | "flow"
  | "tokens"
  | "evidence"
  | "context"
  | "hierarchy";

type VisualSpec = {
  concept: VisualConcept;
  avoid: string;
  prefer: string;
};

const visualSpecs = {
  ddr_001: { concept: "toolbar", avoid: "Labeled utilities", prefer: "Compact tools" },
  ddr_002: { concept: "layout", avoid: "Chrome-led", prefer: "Content-led" },
  ddr_003: { concept: "component", avoid: "New primitive", prefer: "Existing family" },
  ddr_004: { concept: "component", avoid: "Generic mock", prefer: "Product anatomy" },
  ddr_005: { concept: "layout", avoid: "Empty shell", prefer: "Collapse or guide" },
  ddr_006: { concept: "content", avoid: "Opaque artifact", prefer: "Editable source" },
  ddr_007: { concept: "tokens", avoid: "Random color", prefer: "Semantic color" },
  ddr_008: { concept: "layout", avoid: "Hover shifts row", prefer: "Space stays fixed" },
  ddr_009: { concept: "layout", avoid: "Fixed or unbound", prefer: "Grow to a max" },
  ddr_010: { concept: "layout", avoid: "Duplicate seams", prefer: "Structural edge" },
  ddr_011: { concept: "navigation", avoid: "Hover opens", prefer: "Click opens" },
  ddr_012: { concept: "flow", avoid: "Detached result", prefer: "Live source" },
  ddr_013: { concept: "component", avoid: "Parallel systems", prefer: "Shared spine" },
  ddr_014: { concept: "hierarchy", avoid: "Mixed facets", prefer: "One dimension" },
  ddr_015: { concept: "hierarchy", avoid: "Equal weight", prefer: "Role hierarchy" },
  ddr_016: { concept: "state", avoid: "Whole card hover", prefer: "Local hover" },
  ddr_017: { concept: "state", avoid: "False pressed state", prefer: "Real behavior" },
  ddr_018: { concept: "state", avoid: "Repeated status", prefer: "Owning control" },
  ddr_019: { concept: "state", avoid: "Overloaded handle", prefer: "One gesture" },
  ddr_020: { concept: "toolbar", avoid: "Ambiguous icon", prefer: "Meaning preserved" },
  ddr_021: { concept: "content", avoid: "Internal terms", prefer: "User capability" },
  ddr_022: { concept: "content", avoid: "Idealized copy", prefer: "Actual gesture" },
  ddr_023: { concept: "hierarchy", avoid: "Mixed jobs", prefer: "Job-based groups" },
  ddr_024: { concept: "content", avoid: "Repeated metadata", prefer: "Decision signal" },
  ddr_025: { concept: "flow", avoid: "Move to composer", prefer: "Edit in place" },
  ddr_026: { concept: "state", avoid: "Focus noise", prefer: "Real anchor" },
  ddr_027: { concept: "tokens", avoid: "Ad hoc values", prefer: "Token ladder" },
  ddr_028: { concept: "toolbar", avoid: "Invisible target", prefer: "Cue and tooltip" },
  ddr_029: { concept: "context", avoid: "Different models", prefer: "Shared context" },
  ddr_030: { concept: "context", avoid: "Composer disappears", prefer: "Dock stays present" },
  ddr_031: { concept: "evidence", avoid: "Read source only", prefer: "Inspect render" },
  ddr_032: { concept: "evidence", avoid: "Fake or stale", prefer: "Current and real" },
  ddr_033: { concept: "component", avoid: "Bespoke scene", prefer: "Reusable anatomy" },
} satisfies Record<string, VisualSpec>;

function Bars({ count = 3 }: { count?: number }) {
  return (
    <span className="dd-concept__bars">
      {Array.from({ length: count }, (_, index) => <i key={index} />)}
    </span>
  );
}

function ConceptScene({
  concept,
  preferred,
}: {
  concept: VisualConcept;
  preferred: boolean;
}) {
  const state = preferred ? "preferred" : "avoid";
  return (
    <span className={`dd-concept dd-concept--${concept} dd-concept--${state}`}>
      {concept === "toolbar" ? (
        <span className="dd-concept__toolbar">
          <Bars count={2} />
          <i />
          <i />
          {preferred ? <i /> : <b />}
        </span>
      ) : null}
      {concept === "layout" ? (
        <span className="dd-concept__layout">
          <i />
          <span><Bars count={preferred ? 2 : 4} /></span>
          {preferred ? null : <b />}
        </span>
      ) : null}
      {concept === "component" ? (
        <span className="dd-concept__components">
          <i /><i /><i />
        </span>
      ) : null}
      {concept === "navigation" ? (
        <span className="dd-concept__navigation">
          <i />
          <b>{preferred ? "click" : "hover"}</b>
          <span><Bars count={2} /></span>
        </span>
      ) : null}
      {concept === "content" ? (
        <span className="dd-concept__content">
          <strong>{preferred ? "User" : "Impl"}</strong>
          <Bars count={preferred ? 2 : 4} />
        </span>
      ) : null}
      {concept === "state" ? (
        <span className="dd-concept__state">
          <Bars count={2} />
          <i />
          {preferred ? null : <><i /><b /></>}
        </span>
      ) : null}
      {concept === "flow" ? (
        <span className="dd-concept__flow">
          <i />
          <b>→</b>
          <i className={preferred ? "dd-concept__target" : ""} />
          {preferred ? null : <i />}
        </span>
      ) : null}
      {concept === "tokens" ? (
        <span className="dd-concept__tokens">
          <i /><i /><i /><i />
        </span>
      ) : null}
      {concept === "evidence" ? (
        <span className="dd-concept__evidence">
          <span><Bars count={3} /></span>
          <b>→</b>
          <span className={preferred ? "dd-concept__render" : ""} />
        </span>
      ) : null}
      {concept === "context" ? (
        <span className="dd-concept__context">
          <span><i /><i /></span>
          <b><Bars count={1} /><i /></b>
        </span>
      ) : null}
      {concept === "hierarchy" ? (
        <span className="dd-concept__hierarchy">
          <i /><i /><i />
        </span>
      ) : null}
    </span>
  );
}

export function RuleVisual({
  rule,
  inspector = false,
}: {
  rule: DoctrineRule;
  inspector?: boolean;
}) {
  const spec = visualSpecs[rule.id as keyof typeof visualSpecs] ?? {
    concept: "hierarchy" as const,
    avoid: "Unclear decision",
    prefer: "Explicit judgment",
  };

  return (
    <figure
      className={`dd-visual${inspector ? " dd-visual--inspector" : ""}`}
      aria-label={`${rule.title}: avoid ${spec.avoid}; prefer ${spec.prefer}`}
    >
      <div className="dd-visual__stage" aria-hidden="true">
        <div className="dd-visual__topline">
          <span className="dd-visual__eyebrow">Design decision</span>
        </div>
        <div className="dd-visual__decisions">
          <div className="dd-decision dd-decision--avoid">
            <span className="dd-decision__label">Avoid</span>
            <ConceptScene concept={spec.concept} preferred={false} />
            <strong>{spec.avoid}</strong>
          </div>
          <div className="dd-decision dd-decision--prefer">
            <span className="dd-decision__label">Prefer</span>
            <ConceptScene concept={spec.concept} preferred />
            <strong>{spec.prefer}</strong>
          </div>
        </div>
      </div>
    </figure>
  );
}
