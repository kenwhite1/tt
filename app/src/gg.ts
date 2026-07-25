// «game is game» hub launch-param helpers (logic-exact from GG/shared/sdk.ts).
// The shared currency G lives in the hub wallet; ALL wallet traffic (balance /
// earn / spend) is proxied by our server (see server/src/gg.ts) - the hub has
// no CORS and the client must never mint or move currency itself. What remains
// here is the pure launch-token decoding used for the i18n language hint.

// Unwrap the launch token from a Telegram start_param (base64url of a JWT), or
// null when start_param is a plain deep-link (ref code, coop_...) rather than a
// launch token.
export function decodeLaunchParam(startParam: string | undefined): string | null {
  if (!startParam) return null
  try {
    const token = atob(startParam.replace(/-/g, '+').replace(/_/g, '/'))
    return token.split('.').length === 3 ? token : null
  } catch {
    return null
  }
}

// Hub language hint from the launch token: 'ru' | 'en' | null. Reads the `lng`
// claim of the JWT payload without verifying the signature (it is only a UI
// hint, not a right to any reward). null -> not launched from the hub.
export function launchLang(startParam: string | undefined): 'ru' | 'en' | null {
  const token = decodeLaunchParam(startParam)
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.lng === 'en' ? 'en' : payload.lng === 'ru' ? 'ru' : null
  } catch {
    return null
  }
}
