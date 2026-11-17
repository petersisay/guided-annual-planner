/**
 * Editor Dirty State Tracker & Pre-Update Flush Manager
 *
 * Tracks uncommitted keystrokes, active in-flight saves, and unresolved conflicts
 * across all active planner spread views.
 */

class EditorDirtyTracker {
  editors = new Map();

  /**
   * Registers an active planner editor / autosave instance.
   * Returns an unregister cleanup function.
   */
  register(editor) {
    this.editors.set(editor.id, editor);
    return () => {
      this.editors.delete(editor.id);
    };
  }

  /**
   * Returns true if any registered editor currently has uncommitted in-memory
   * changes or an in-flight network save.
   */
  isAnyDirty() {
    for (const editor of this.editors.values()) {
      if (editor.isDirty()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if any registered editor has an unresolved concurrency conflict.
   */
  hasUnresolvedConflicts() {
    for (const editor of this.editors.values()) {
      if (editor.hasConflict()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Flushes all registered editors, executing any pending debounced updates
   * and awaiting full persistence (server or verified offline cache).
   */
  async flushAll() {
    if (this.hasUnresolvedConflicts()) {
      return { success: false, reason: 'conflict' };
    }

    if (this.editors.size === 0) {
      return { success: true };
    }

    const flushPromises = Array.from(this.editors.values()).map(async (editor) => {
      try {
        return await editor.flush();
      } catch (err) {
        console.warn(`[EditorDirtyTracker] Editor ${editor.id} flush threw error:`, err);
        return false;
      }
    });

    const results = await Promise.all(flushPromises);
    const allPassed = results.every(Boolean);

    if (!allPassed) {
      return { success: false, reason: 'save_failed' };
    }

    return { success: true };
  }

  /**
   * Returns the count of registered editors (used for testing and diagnostics)
   */
  getRegisteredCount() {
    return this.editors.size;
  }
}

export const editorDirtyTracker = new EditorDirtyTracker();
