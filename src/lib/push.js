// Web Push (VAPID) — browser side.
//
// One subscription per browser profile. iOS is the sharp edge: Safari only
// grants push to a site that has been ADDED TO THE HOME SCREEN, so on iPhone
// this silently no-ops until that is done. `pushSupport()` reports that
// precisely rather than letting the UI claim push is "on" when it is not.

import { supabase } from "./supabase.js";

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

const urlBase64ToUint8Array = (base64) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches
  || window.navigator.standalone === true;

/** What this browser can actually do, and why not, in plain words. */
export function pushSupport() {
  if (!("serviceWorker" in navigator)) return { ok: false, reason: "This browser has no service worker support." };
  if (!("PushManager" in window)) {
    if (isIos() && !isStandalone()) {
      return { ok: false, needsHomeScreen: true, reason: "On iPhone, add this site to your Home Screen first (Share → Add to Home Screen), then open it from there. Safari will not allow push otherwise." };
    }
    return { ok: false, reason: "This browser has no Push API." };
  }
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: "VITE_VAPID_PUBLIC_KEY is not set in this deployment." };
  if (isIos() && !isStandalone()) {
    return { ok: false, needsHomeScreen: true, reason: "Open this from the Home Screen icon — iOS blocks push in a normal Safari tab." };
  }
  return { ok: true, permission: Notification.permission };
}

export async function registerServiceWorker() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** Ask permission, subscribe, and persist the endpoint. Idempotent. */
export async function subscribeToPush({ label = "" } = {}) {
  const support = pushSupport();
  if (!support.ok) throw new Error(support.reason);

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(`Notification permission was ${permission}.`);

  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const row = {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    label: label || (isIos() ? "iPhone" : navigator.platform || "Browser"),
    user_agent: navigator.userAgent.slice(0, 400),
    failure_count: 0,
  };
  // onConflict on the unique endpoint: re-subscribing the same device
  // refreshes the row rather than creating a duplicate that double-pushes.
  const { error } = await supabase.from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
  if (error) throw error;
  return row;
}

export async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return false;
  const endpoint = sub.toJSON().endpoint;
  await sub.unsubscribe();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return true;
}

export async function currentSubscription() {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  const sub = await reg.pushManager.getSubscription();
  return sub ? sub.toJSON() : null;
}
