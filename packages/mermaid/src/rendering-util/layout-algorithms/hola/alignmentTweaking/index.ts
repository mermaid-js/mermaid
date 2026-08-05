/* eslint-disable @typescript-eslint/no-unused-vars */
import type { LayoutData } from '../../../types.js';
import { AlignmentDetector } from './alignmentDetector.js';
import { AlignmentEnforcer } from './alignmentEnforcer.js';
import { NeighborStressOptimizer } from './neighborStressOptimizer.js';
import { LayoutRotation } from './layoutRotation.js';
import { FinalCleanup } from './finalCleanup.js';
import {
  NEIGHBOR_STRESS_MAX_ITERATIONS,
  NEIGHBOR_STRESS_TOLERANCE,
  TWEAK_ALIGNMENT_ALIGNMENT_THRESHOLD,
} from '../Constants.js';

/**
 * Step 4a: Alignment Tweaking
 * Detects and enforces exact alignment for nearly aligned nodes
 *
 * @param layoutData - The layout data after Step 3 (tree layout and placement)
 * @param alignmentThreshold - Maximum pixel difference to consider nodes "nearly aligned" (default: 5)
 * @returns Layout data with alignment tweaks applied
 */
function alignmentTweaking(layoutData: LayoutData, alignmentThreshold = 5): LayoutData {
  if (!layoutData.nodes || layoutData.nodes.length < 2) {
    return layoutData;
  }

  const detector = new AlignmentDetector(layoutData.nodes, alignmentThreshold);
  const horizontalAlignments = detector.findHorizontalAlignments();
  const verticalAlignments = detector.findVerticalAlignments();

  if (horizontalAlignments.length === 0 && verticalAlignments.length === 0) {
    return layoutData;
  }

  const enforcer = new AlignmentEnforcer(layoutData.nodes, layoutData.edges || []);

  const horizontalApplied = enforcer.enforceAlignments(horizontalAlignments);

  const verticalApplied = enforcer.enforceAlignments(verticalAlignments);

  const totalApplied = horizontalApplied + verticalApplied;

  return {
    ...layoutData,
    nodes: layoutData.nodes,
    edges: layoutData.edges,
  };
}

/**
 * Step 4b: Even Distribution via Neighbor Stress
 * Refines node spacing by optimizing only immediate neighbor distances
 *
 * @param layoutData - The layout data after Step 4a (alignment tweaking)
 * @param maxIterations - Maximum iterations for neighbor stress optimization (default: 50)
 * @param tolerance - Convergence threshold for stress change (default: 1e-4)
 * @returns Layout data with even node distribution
 */
function _evenDistribution(
  layoutData: LayoutData,
  maxIterations = NEIGHBOR_STRESS_MAX_ITERATIONS,
  tolerance = NEIGHBOR_STRESS_TOLERANCE
): LayoutData {
  if (!layoutData.nodes || layoutData.nodes.length < 2) {
    return layoutData;
  }

  if (!layoutData.edges || layoutData.edges.length === 0) {
    return layoutData;
  }

  const initialOptimizer = new NeighborStressOptimizer(layoutData.nodes, layoutData.edges);
  const initialStats = initialOptimizer.getNeighborDistanceStats();

  const optimizer = new NeighborStressOptimizer(layoutData.nodes, layoutData.edges);
  const optimizedNodes = optimizer.optimize(maxIterations, tolerance);

  const finalOptimizer = new NeighborStressOptimizer(optimizedNodes, layoutData.edges);
  const finalStats = finalOptimizer.getNeighborDistanceStats();

  const stdDevImprovement = ((initialStats.stdDev - finalStats.stdDev) / initialStats.stdDev) * 100;

  return {
    ...layoutData,
    nodes: optimizedNodes,
    edges: layoutData.edges,
  };
}

/**
 * Step 4c: Orientational Adjustment (Layout Rotation)
 * Rotates layout to landscape if portrait, optimizing for display aspect ratio
 *
 * @param layoutData - The layout data after Step 4b (even distribution)
 * @param applyFinalRelaxation - Whether to apply final neighbor stress after rotation (default: true)
 * @param alignmentThreshold - Alignment threshold for post-rotation alignment (default: 5)
 * @returns Layout data with orientation adjusted
 */
function orientationalAdjustment(
  layoutData: LayoutData,
  applyFinalRelaxation = true,
  alignmentThreshold = 5
): LayoutData {
  if (!layoutData.nodes || layoutData.nodes.length === 0) {
    return layoutData;
  }

  const rotator = new LayoutRotation(layoutData.nodes, layoutData.edges || [], layoutData);

  const wasRotated = rotator.rotate();

  if (!wasRotated) {
    return layoutData;
  }

  return {
    ...layoutData,
    nodes: layoutData.nodes,
    edges: layoutData.edges,
  };
}

/**
 * Step 4d: Final Cleanup and Routing
 * Removes dummy nodes and performs final orthogonal edge routing
 *
 * @param layoutData - The layout data after Step 4c (orientational adjustment)
 * @returns Layout data with dummy nodes removed and edges routed
 */
function finalCleanupAndRouting(layoutData: LayoutData): LayoutData {
  if (!layoutData.nodes || layoutData.nodes.length === 0) {
    return layoutData;
  }

  const cleanup = new FinalCleanup(layoutData.nodes, layoutData.edges || []);

  const { nodes: cleanedNodes, edges: routedEdges } = cleanup.cleanup();

  return {
    ...layoutData,
    nodes: cleanedNodes,
    edges: routedEdges,
  };
}

/**
 * Step 4: Complete Refinement Pipeline
 * Combines all refinement sub-steps: alignment (4a), distribution (4b), rotation (4c), cleanup (4d)
 *
 * @param layoutData - The layout data after Step 3 (tree layout and placement)
 * @param options - Configuration options for refinement steps
 * @returns Layout data with complete refinement applied
 */
export function tweakAlignment(
  layoutData: LayoutData,
  options: {
    alignmentThreshold?: number;
    neighborStressIterations?: number;
    neighborStressTolerance?: number;
    enableRotation?: boolean;
    applyFinalRelaxation?: boolean;
    enableFinalCleanup?: boolean;
  } = {}
): LayoutData {
  const {
    alignmentThreshold = TWEAK_ALIGNMENT_ALIGNMENT_THRESHOLD,
    neighborStressIterations = NEIGHBOR_STRESS_MAX_ITERATIONS,
    neighborStressTolerance = NEIGHBOR_STRESS_TOLERANCE,
    enableRotation = true,
    applyFinalRelaxation = true,
    enableFinalCleanup = true,
  } = options;

  const afterAlignment = alignmentTweaking(layoutData, alignmentThreshold);

  const afterDistribution = _evenDistribution(
    afterAlignment,
    neighborStressIterations,
    neighborStressTolerance
  );

  const afterRotation = enableRotation
    ? orientationalAdjustment(afterDistribution, applyFinalRelaxation, alignmentThreshold)
    : afterDistribution;

  const finalLayout = enableFinalCleanup ? finalCleanupAndRouting(afterRotation) : afterRotation;

  return finalLayout;
}
