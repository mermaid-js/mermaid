grammar Wardley
import "../common/common";

entry Wardley:
  NEWLINE*
  "wardleyMap"
  (
    TitleAndAccessibilities
    | components+=WardleyComponent
    | anchors+=WardleyAnchor
    | edges+=WardleyEdge
    | flowEdges+=WardleyFlowEdge
    | constraintEdges+=WardleyConstraintEdge
    | evolves+=WardleyEvolve
    | pipelines+=WardleyPipeline
    | notes+=WardleyNote
    | annotations+=WardleyAnnotation
    | areas+=WardleyArea
    | submaps+=WardleySubmap
    | accelerators+=WardleyAccelerator
    | xAxis=WardleyXAxis
    | yAxis=WardleyYAxis
    | NEWLINE
  )*
;

// ── Components ───────────────────────────────────────────────────────

WardleyComponent:
  "component" id=ID label=STRING coords=Coordinates
  (componentType=("market" | "ecosystem"))?
  (sourcing=("build" | "buy" | "outsource"))?
  (inertia?="inertia")?
  ("label" labelOffset=LabelOffset)?
  EOL
;

WardleyAnchor:
  "anchor" id=ID label=STRING coords=Coordinates EOL
;

Coordinates:
  "[" x=NUMBER "," y=NUMBER "]"
;

LabelOffset:
  "[" dx=NUMBER "," dy=NUMBER "]"
;

// ── Edges ────────────────────────────────────────────────────────────

WardleyEdge:
  source=ID "->" target=ID (";" annotation=STRING)? EOL
;

WardleyFlowEdge:
  source=ID "+>" target=ID (";" annotation=STRING)? EOL
;

WardleyConstraintEdge:
  source=ID "=>" target=ID EOL
;

// ── Evolution ────────────────────────────────────────────────────────

WardleyEvolve:
  "evolve" id=ID ("->" targetLabel=ID)? value=NUMBER EOL
;

// ── Pipelines ────────────────────────────────────────────────────────

WardleyPipeline:
  "pipeline" id=ID label=STRING pipelineCoords=PipelineCoords
  "{" (NEWLINE | children+=WardleyPipelineChild)* "}" EOL
;

PipelineCoords:
  "[" y=NUMBER "," startX=NUMBER "," endX=NUMBER "]"
;

WardleyPipelineChild:
  id=ID label=STRING "[" x=NUMBER "]" EOL
;

// ── Notes & Annotations ─────────────────────────────────────────────

WardleyNote:
  "note" text=STRING coords=Coordinates EOL
;

WardleyAnnotation:
  "annotation" number=NUMBER text=STRING target=ID EOL
;

// ── Areas & Overlays ─────────────────────────────────────────────────

WardleyArea:
  areaType=("pioneers" | "settlers" | "townplanners" | "interest")
  label=STRING?
  "[" x1=NUMBER "," y1=NUMBER "," x2=NUMBER "," y2=NUMBER "]" EOL
;

// ── Submaps ──────────────────────────────────────────────────────────

WardleySubmap:
  "submap" id=ID label=STRING coords=Coordinates "ref" ref=STRING EOL
;

// ── Accelerators ─────────────────────────────────────────────────────

WardleyAccelerator:
  accelType=("accelerator" | "deaccelerator") target=ID EOL
;

// ── Custom Axis Labels ───────────────────────────────────────────────

WardleyXAxis:
  "xAxis" labels+=STRING ("," labels+=STRING)* EOL
;

WardleyYAxis:
  "yAxis" labels+=STRING ("," labels+=STRING)* EOL
;
