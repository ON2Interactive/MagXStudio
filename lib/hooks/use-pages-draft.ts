"use client";

import { useCallback, useRef } from "react";
import type { GeneratedSiteContract, PageKey } from "@/lib/types";
import type { PagesCanvasFormat } from "@/components/generator/preview-tabs";

const DRAFT_KEY = "magx-pages-draft";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DRAFT_VERSION = 1;

export type PagesDraft = {
    version: number;
    site: GeneratedSiteContract;
    activePage: PageKey;
    canvasColor: string;
    pagesCanvasSize: PagesCanvasFormat;
    savedAt: number;
};

export function usePagesLocalDraft() {
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveDraft = useCallback(
        (payload: {
            site: GeneratedSiteContract;
            activePage: PageKey;
            canvasColor: string;
            pagesCanvasSize: PagesCanvasFormat;
        }) => {
            // Debounce: cancel any pending save and schedule a new one
            if (saveTimerRef.current !== null) {
                clearTimeout(saveTimerRef.current);
            }
            saveTimerRef.current = setTimeout(() => {
                try {
                    const draft: PagesDraft = {
                        version: DRAFT_VERSION,
                        savedAt: Date.now(),
                        ...payload,
                    };
                    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                } catch {
                    // Storage full or unavailable — fail silently
                }
                saveTimerRef.current = null;
            }, 1500);
        },
        []
    );

    const loadDraft = useCallback((): PagesDraft | null => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw) as Partial<PagesDraft>;

            // Guard: version mismatch
            if (parsed.version !== DRAFT_VERSION) {
                localStorage.removeItem(DRAFT_KEY);
                return null;
            }

            // Guard: expired TTL
            if (
                typeof parsed.savedAt !== "number" ||
                Date.now() - parsed.savedAt > DRAFT_TTL_MS
            ) {
                localStorage.removeItem(DRAFT_KEY);
                return null;
            }

            // Guard: must have valid site
            if (!parsed.site || typeof parsed.site !== "object") return null;

            return parsed as PagesDraft;
        } catch {
            return null;
        }
    }, []);

    const clearDraft = useCallback(() => {
        // Cancel any pending debounced save
        if (saveTimerRef.current !== null) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            // Silent
        }
    }, []);

    return { saveDraft, loadDraft, clearDraft };
}
