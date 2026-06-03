export type ProcessProgressEvent = {
  step: "parse" | "extract" | "normalize" | "llm" | "validate" | "score" | "report";
  index: number;
  total: number;
  message: string;
};

export type ProgressCallback = (event: ProcessProgressEvent) => void;

export const PROCESS_STEPS: ProcessProgressEvent["step"][] = [
  "parse",
  "extract",
  "normalize",
  "llm",
  "validate",
  "score",
  "report",
];

export function stepIndex(step: ProcessProgressEvent["step"]): number {
  return PROCESS_STEPS.indexOf(step);
}

export function emitProgress(onProgress: ProgressCallback | undefined, event: ProcessProgressEvent) {
  onProgress?.(event);
}
