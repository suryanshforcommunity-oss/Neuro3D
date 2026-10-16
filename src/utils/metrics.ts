import { EvaluationMetrics } from '../types';

/**
 * Calculates Dice Similarity Coefficient (DSC):
 * DSC = 2 * |P ∩ G| / (|P| + |G|)
 * Returns null if both masks are empty, or 1.0 if both are empty depending on convention.
 */
export function calculateDice(
  predMask: Uint8Array | number[],
  expertMask: Uint8Array | number[],
  targetLabels: number[]
): number {
  if (predMask.length !== expertMask.length) {
    throw new Error('Mask dimensions mismatch');
  }

  const labelSet = new Set(targetLabels);
  let intersection = 0;
  let predCount = 0;
  let expertCount = 0;

  for (let i = 0; i < predMask.length; i++) {
    const isPred = labelSet.has(predMask[i]);
    const isExpert = labelSet.has(expertMask[i]);

    if (isPred) predCount++;
    if (isExpert) expertCount++;
    if (isPred && isExpert) intersection++;
  }

  const total = predCount + expertCount;
  if (total === 0) {
    return 1.0; // Both empty, perfect match
  }

  return Number(((2 * intersection) / total).toFixed(4));
}

/**
 * Calculates Sensitivity (True Positive Rate / Recall):
 * Sensitivity = |P ∩ G| / |G|
 */
export function calculateSensitivity(
  predMask: Uint8Array | number[],
  expertMask: Uint8Array | number[],
  targetLabels: number[]
): number {
  if (predMask.length !== expertMask.length) {
    throw new Error('Mask dimensions mismatch');
  }

  const labelSet = new Set(targetLabels);
  let truePositives = 0;
  let conditionPositives = 0;

  for (let i = 0; i < predMask.length; i++) {
    const isPred = labelSet.has(predMask[i]);
    const isExpert = labelSet.has(expertMask[i]);

    if (isExpert) conditionPositives++;
    if (isPred && isExpert) truePositives++;
  }

  if (conditionPositives === 0) {
    return 1.0;
  }

  return Number((truePositives / conditionPositives).toFixed(4));
}

/**
 * Calculates Specificity (True Negative Rate):
 * Specificity = |TN| / (|TN| + |FP|)
 */
export function calculateSpecificity(
  predMask: Uint8Array | number[],
  expertMask: Uint8Array | number[],
  targetLabels: number[]
): number {
  if (predMask.length !== expertMask.length) {
    throw new Error('Mask dimensions mismatch');
  }

  const labelSet = new Set(targetLabels);
  let trueNegatives = 0;
  let conditionNegatives = 0;

  for (let i = 0; i < predMask.length; i++) {
    const isPred = labelSet.has(predMask[i]);
    const isExpert = labelSet.has(expertMask[i]);

    if (!isExpert) {
      conditionNegatives++;
      if (!isPred) {
        trueNegatives++;
      }
    }
  }

  if (conditionNegatives === 0) {
    return 1.0;
  }

  return Number((trueNegatives / conditionNegatives).toFixed(4));
}

/**
 * Computes full evaluation metrics for WT, TC, and ET when expert mask is provided.
 */
export function computeBraTSEvaluationMetrics(
  predMask: Uint8Array | number[] | null,
  expertMask: Uint8Array | number[] | null
): EvaluationMetrics {
  if (!predMask || !expertMask) {
    return {
      hasExpertMask: false,
    };
  }

  // WT: NCR (1) + ED (2) + ET (4)
  const wtLabels = [1, 2, 4];
  // TC: NCR (1) + ET (4)
  const tcLabels = [1, 4];
  // ET: ET (4)
  const etLabels = [4];

  return {
    hasExpertMask: true,
    wtDice: calculateDice(predMask, expertMask, wtLabels),
    tcDice: calculateDice(predMask, expertMask, tcLabels),
    etDice: calculateDice(predMask, expertMask, etLabels),

    wtSensitivity: calculateSensitivity(predMask, expertMask, wtLabels),
    tcSensitivity: calculateSensitivity(predMask, expertMask, tcLabels),
    etSensitivity: calculateSensitivity(predMask, expertMask, etLabels),

    wtSpecificity: calculateSpecificity(predMask, expertMask, wtLabels),
    tcSpecificity: calculateSpecificity(predMask, expertMask, tcLabels),
    etSpecificity: calculateSpecificity(predMask, expertMask, etLabels),
  };
}
