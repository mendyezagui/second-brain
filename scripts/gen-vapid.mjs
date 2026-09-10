#!/usr/bin/env node
// Generate the VAPID keypair for Web Push. Run ONCE, then paste the values
// into Vercel env vars. Regenerating invalidates every existing subscription,
// so every device has to re-enable notifications — don't re-run casually.
import webpush from "web-push";
const { publicKey, privateKey } = webpush.generateVAPIDKeys();
console.log(`
Add these to Vercel → Settings → Environment Variables:

  VAPID_PUBLIC_KEY        ${publicKey}
  VAPID_PRIVATE_KEY       ${privateKey}
  VAPID_SUBJECT           mailto:you@yourdomain.com
  VITE_VAPID_PUBLIC_KEY   ${publicKey}     <-- same as public, exposed to the browser

VITE_VAPID_PUBLIC_KEY is inlined at build time, so redeploy after adding it.
Keep VAPID_PRIVATE_KEY server-only. Never commit either.
`);
