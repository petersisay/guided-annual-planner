/**
 * Editor Dirty State Tracker & Pre-Update Flush Manager
 *
 * Tracks uncommitted keystrokes, active in-flight saves, and unresolved conflicts
 * across all active planner spread views.
 */

export interface ActiveEditor {
  id: string;
  isDirty: () => boolean;
  hasConflict: () => boolean;
  flush: () => Promise<boolean>;
}

export type FlushFailureReason = 'conflict' | 'save_failed' | 'network_unavailable';

class EditorDirtyTracker {
  private editors = new Map<string, ActiveEditor>();

  /**
   * Registers an active planner editor / autosave instance.
   * Returns an unregister cleanup function.
   */
  public register(editor: ActiveEditor): () => void {
    this.editors.set(editor.id, editor);
    return () => {
      this.editors.delete(editor.id);
    };
  }

  /**
   * Returns true if any registered editor currently has uncommitted in-memory
   * changes or an in-flight network save.
   */
  public isAnyDirty(): boolean {
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
  public hasUnresolvedConflicts(): boolean {
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
  public async flushAll(): Promise<{ success: boolean; reason?: FlushFailureReason }> {
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
  public getRegisteredCount(): number {
    return this.editors.size;
  }
}

export const editorDirtyTracker = new EditorDirtyTracker();
