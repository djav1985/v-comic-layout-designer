/**
 * Editor history module — undo/redo for page state changes.
 *
 * Usage:
 *   import { history } from './history.js';
 *   history.push(snapshot);   // record a state snapshot
 *   history.undo();           // returns previous snapshot or null
 *   history.redo();           // returns next snapshot or null
 *   history.checkpoint(snap); // push without losing forward stack (for
 *                             // destructive flows like reset/import)
 *   history.canUndo();        // boolean
 *   history.canRedo();        // boolean
 *   history.size();           // number of entries in undo stack
 */

const MAX_HISTORY = 50;

function createHistory() {
  let undoStack = [];
  let redoStack = [];

  return {
    /** Record a new state snapshot, discarding any redo future. */
    push(snapshot) {
      const serialized = JSON.stringify(snapshot);
      // Avoid duplicate consecutive entries
      if (undoStack.length > 0 && undoStack[undoStack.length - 1] === serialized) {
        return;
      }
      undoStack.push(serialized);
      if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
      }
      redoStack = [];
    },

    /** Save a checkpoint without discarding redo stack (before destructive ops). */
    checkpoint(snapshot) {
      const serialized = JSON.stringify(snapshot);
      if (undoStack.length > 0 && undoStack[undoStack.length - 1] === serialized) {
        return;
      }
      undoStack.push(serialized);
      if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
      }
    },

    /**
     * Undo: pops the last entry from undoStack, pushes current onto redo.
     * Returns the parsed snapshot to restore, or null if nothing to undo.
     */
    undo(currentSnapshot) {
      if (undoStack.length === 0) return null;
      const serialized = JSON.stringify(currentSnapshot);
      redoStack.push(serialized);
      const prev = undoStack.pop();
      return JSON.parse(prev);
    },

    /**
     * Redo: pops the next entry from redoStack, pushes current onto undo.
     * Returns the parsed snapshot to restore, or null if nothing to redo.
     */
    redo(currentSnapshot) {
      if (redoStack.length === 0) return null;
      const serialized = JSON.stringify(currentSnapshot);
      undoStack.push(serialized);
      const next = redoStack.pop();
      return JSON.parse(next);
    },

    canUndo() {
      return undoStack.length > 0;
    },

    canRedo() {
      return redoStack.length > 0;
    },

    size() {
      return undoStack.length;
    },

    /** Clear all history (e.g., after a full reset). */
    clear() {
      undoStack = [];
      redoStack = [];
    },
  };
}

export const history = createHistory();
