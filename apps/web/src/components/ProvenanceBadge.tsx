import type { DataProvenance } from "../api/client";

const LABELS: Record<DataProvenance, string> = {
  real: "Observed",
  derived: "Derived",
  modeled: "Modeled",
  synthetic: "Demo / synthetic",
  unavailable: "Unavailable",
};

interface ProvenanceBadgeProps {
  provenance: DataProvenance;
}

export function ProvenanceBadge({ provenance }: ProvenanceBadgeProps) {
  return <span className={`provenance-badge provenance-${provenance}`}>{LABELS[provenance]}</span>;
}
