"use client";

import { useCallback, useRef } from "react";

const DRAFT_VERSION = 1;
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type DraftEnvelope<T> = {
    version: number;
    savedAt: number;
    data: T;
};

export type DraftResult<T> = {
    data: T;
    savedAt: number;
};

/**
 * Generic localStorage draft persistence hook.
 * Handles versioning, TTL (24h), debounced saves, and silent
 * QuotaExceededError handling.
 *
 * @param draftKey  - localStorage key (e.g. "magx-pages-draft")
 * @param debounceMs - save debounce interval (default: 1500ms)
 */
export function useWorkspaceDraft<T>(draftKey: string, debounceMs = 1500) {
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveDraft = useCallback(
        (data: T) => {
            if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                try {
                    const envelope: DraftEnvelope<T> = {
                        version: DRAFT_VERSION,
                        savedAt: Date.now(),
                        data,
                    };
                    localStorage.setItem(draftKey, JSON.stringify(envelope));
                } catch {
                    // QuotaExceededError or storage unavailable — fail silently
                }
                saveTimerRef.current = null;
            }, debounceMs);
        },
        [draftKey, debounceMs]
    );

    const loadDraft = useCallback((): DraftResult<T> | null => {
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) return null;

            const envelope = JSON.parse(raw) as Partial<DraftEnvelope<T>>;

            if (envelope.version !== DRAFT_VERSION) {
                localStorage.removeItem(draftKey);
                return null;
            }

            if (
                typeof envelope.savedAt !== "number" ||
                Date.now() - envelope.savedAt > DRAFT_TTL_MS
            ) {
                localStorage.removeItem(draftKey);
                return null;
            }

            if (!envelope.data) return null;

            return { data: envelope.data, savedAt: envelope.savedAt };
        } catch {
            return null;
        }
    }, [draftKey]);

    const clearDraft = useCallback(() => {
        if (saveTimerRef.current !== null) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        try {
            localStorage.removeItem(draftKey);
        } catch {
            // silent
        }
    }, [draftKey]);

    return { saveDraft, loadDraft, clearDraft };
}
