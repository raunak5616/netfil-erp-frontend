import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

before(() => {
    if (!globalThis.localStorage) {
        const store = new Map();
        globalThis.localStorage = {
            getItem: (k) => store.get(k) ?? null,
            setItem: (k, v) => store.set(k, String(v)),
            removeItem: (k) => store.delete(k),
            clear: () => store.clear()
        };
    }
});

describe("UI Redux Slice Tests", async () => {
    const { uiSlice, toggleSidebar, setSidebarCollapsed, setMobileSidebarOpen, showNotification, clearNotification } = await import("../../src/features/ui/uiSlice.js");
    const reducer = uiSlice.reducer;

    test("Initial state should be defined", () => {
        const state = reducer(undefined, { type: "@@INIT" });
        assert.ok(state);
        assert.equal(typeof state.sidebarCollapsed, "boolean");
        assert.equal(typeof state.mobileSidebarOpen, "boolean");
        assert.equal(state.notification, null);
    });

    test("toggleSidebar: should toggle collapsed state and update localStorage", () => {
        const state1 = reducer({ sidebarCollapsed: false }, toggleSidebar());
        assert.equal(state1.sidebarCollapsed, true);
        assert.equal(globalThis.localStorage.getItem("netfil_sidebar_collapsed"), "true");

        const state2 = reducer({ sidebarCollapsed: true }, toggleSidebar());
        assert.equal(state2.sidebarCollapsed, false);
        assert.equal(globalThis.localStorage.getItem("netfil_sidebar_collapsed"), "false");
    });

    test("setSidebarCollapsed: should set collapsed state explicitly", () => {
        const state = reducer({ sidebarCollapsed: false }, setSidebarCollapsed(true));
        assert.equal(state.sidebarCollapsed, true);
    });

    test("setMobileSidebarOpen: should control mobile drawer", () => {
        const state = reducer({ mobileSidebarOpen: false }, setMobileSidebarOpen(true));
        assert.equal(state.mobileSidebarOpen, true);
    });

    test("showNotification and clearNotification: should manage alert banner", () => {
        const notif = { type: "success", message: "Quotation created successfully" };
        const stateWithNotif = reducer({ notification: null }, showNotification(notif));
        assert.ok(stateWithNotif.notification);
        assert.equal(stateWithNotif.notification.type, "success");
        assert.equal(stateWithNotif.notification.message, "Quotation created successfully");

        const clearedState = reducer(stateWithNotif, clearNotification());
        assert.equal(clearedState.notification, null);
    });
});
