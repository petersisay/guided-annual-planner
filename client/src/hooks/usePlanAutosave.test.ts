import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanAutosave } from './usePlanAutosave';
import { editorDirtyTracker } from '../services/editorDirtyTracker';

describe('usePlanAutosave Hook — Dirty Tracking & Pre-Update Flush', () => {
  interface MockPlan {
    id: string;
    note: string;
  }

  const initialPlan: MockPlan = { id: 'plan-1', note: 'Initial note' };

  beforeEach(() => {
    vi.useRealTimers();
  });

  it('initializes in idle state without falsely claiming saved', () => {
    const saveFn = vi.fn();
    const { result } = renderHook(() =>
      usePlanAutosave(initialPlan, { saveFn })
    );

    expect(result.current.saveStatus).toBe('idle');
    expect(result.current.plan).toEqual(initialPlan);
    expect(result.current.isDirty).toBe(false);
  });

  it('updates saveStatus to saving and then saved only on confirmed success', async () => {
    let resolveSave: (val: MockPlan) => void = () => {};
    const savePromise = new Promise<MockPlan>((resolve) => {
      resolveSave = resolve;
    });
    const saveFn = vi.fn().mockReturnValue(savePromise);

    const { result } = renderHook(() =>
      usePlanAutosave(initialPlan, { saveFn })
    );

    act(() => {
      result.current.triggerSave({ note: 'Updated note' });
    });

    expect(result.current.saveStatus).toBe('saving');
    // Optimistic update applied
    expect(result.current.plan?.note).toBe('Updated note');

    // Confirm server response
    await act(async () => {
      resolveSave({ id: 'plan-1', note: 'Confirmed note from server' });
    });

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.plan?.note).toBe('Confirmed note from server');
    expect(result.current.isDirty).toBe(false);
  });

  it('handles save error and allows retrying the pending save', async () => {
    const saveFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network disconnected'))
      .mockResolvedValueOnce({ id: 'plan-1', note: 'Retried note' });

    const { result } = renderHook(() =>
      usePlanAutosave(initialPlan, { saveFn })
    );

    await act(async () => {
      await result.current.triggerSave({ note: 'Failed attempt' });
    });

    expect(result.current.saveStatus).toBe('error');
    expect(result.current.saveError).toBe('Network disconnected');
    expect(result.current.isDirty).toBe(true);

    // User triggers retry
    await act(async () => {
      result.current.retryLastSave();
    });

    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.plan?.note).toBe('Retried note');
    expect(result.current.isDirty).toBe(false);
  });

  it('discards older out-of-order responses to prevent overwriting newer edits', async () => {
    let resolveFirst: (val: MockPlan) => void = () => {};
    const firstPromise = new Promise<MockPlan>((resolve) => {
      resolveFirst = resolve;
    });

    let resolveSecond: (val: MockPlan) => void = () => {};
    const secondPromise = new Promise<MockPlan>((resolve) => {
      resolveSecond = resolve;
    });

    const saveFn = vi
      .fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() =>
      usePlanAutosave(initialPlan, { saveFn })
    );

    // Save 1 initiated
    act(() => {
      result.current.triggerSave({ note: 'First edit' });
    });

    // Save 2 initiated immediately after
    act(() => {
      result.current.triggerSave({ note: 'Second edit (newer)' });
    });

    // Save 2 resolves first
    await act(async () => {
      resolveSecond({ id: 'plan-1', note: 'Second edit (newer)' });
    });
    expect(result.current.plan?.note).toBe('Second edit (newer)');

    // Now older Save 1 finally resolves
    await act(async () => {
      resolveFirst({ id: 'plan-1', note: 'First edit (stale)' });
    });

    // Plan must NOT be overwritten by the older Save 1 response!
    expect(result.current.plan?.note).toBe('Second edit (newer)');
  });

  it('buffers keystrokes with debouncedSave, marks editor dirty, and flushes immediately with flushSave', async () => {
    const saveFn = vi.fn().mockImplementation(async (updates) => ({
      ...initialPlan,
      ...updates,
    }));

    const { result } = renderHook(() =>
      usePlanAutosave(initialPlan, {
        saveFn,
        entityType: 'daily',
        entityKey: '2026-10-15',
      })
    );

    // User types keystrokes
    act(() => {
      result.current.debouncedSave({ note: 'Typing character A' }, 200);
    });

    // Marked as dirty immediately
    expect(result.current.isDirty).toBe(true);
    expect(editorDirtyTracker.isAnyDirty()).toBe(true);
    // saveFn has not fired yet because of debounce timer
    expect(saveFn).not.toHaveBeenCalled();

    // Now PWA update or unmount calls flushAll()
    let flushSuccess = false;
    await act(async () => {
      const res = await editorDirtyTracker.flushAll();
      flushSuccess = res.success;
    });

    expect(flushSuccess).toBe(true);
    expect(saveFn).toHaveBeenCalledWith({ note: 'Typing character A' });
    expect(result.current.saveStatus).toBe('saved');
    expect(result.current.isDirty).toBe(false);
  });
});
