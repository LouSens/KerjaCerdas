/**
 * KerjaCerdas — single source of truth for view <-> URL routing.
 *
 * Previously this table was hand-copied in four places (App.jsx's
 * VIEW_TO_PATH/PATH_TO_VIEW, useStore.js's own VIEW_TO_PATH, useStore.js's
 * ALLOWED_VIEWS, and the view ids referenced by Sidebar.jsx's nav groups),
 * with nothing to keep them in sync — e.g. `/harga` used to be a real
 * <Route> entry that only ever redirected home, because 'pricing' was
 * special-cased in navigate() before anything consulted the map. Every
 * consumer now imports from this one module instead.
 */

// View id -> URL path. 'pricing' is intentionally NOT a route: it's an
// anchor-scroll on the home page (see useStore.js's navigate()), not a
// distinct page, so it has no entry here. App.jsx still keeps a `/harga`
// redirect-to-home Route for anyone with an old/shared link to that URL.
export const VIEW_TO_PATH = {
    'home':                  '/',
    'about':                 '/tentang',
    'privacy':               '/privasi',
    'seeker-dashboard':      '/dashboard',
    'seeker-match':          '/lowongan',
    'seeker-skill-gap':      '/skill-gap',
    'seeker-saved':          '/tersimpan',
    'seeker-verification':   '/verifikasi',
    'seeker-profile':        '/profil',
    'seeker-search':         '/cari',
    'seeker-applications':   '/lamaran',
    'seeker-advisor':        '/advisor',
    'seeker-onboarding':     '/onboarding',
    'employer-dashboard':    '/employer/dashboard',
    'employer-jobs':         '/employer/lowongan',
    'employer-post-job':     '/employer/pasang',
    'employer-candidates':   '/employer/kandidat',
    'employer-verification': '/employer/verifikasi',
    'employer-upload':       '/employer/upload',
    'employer-profile':      '/employer/profil',
}

// Derived, never hand-written, so it can't drift from VIEW_TO_PATH.
export const PATH_TO_VIEW = Object.fromEntries(
    Object.entries(VIEW_TO_PATH).map(([view, path]) => [path, view])
)

// Views reachable without auth. 'home' and 'pricing' are handled by their
// own early-return branches in navigate() before this set is ever checked,
// so they're deliberately left out rather than listed as if they mattered here.
export const PUBLIC_VIEWS = new Set(['about', 'privacy'])

// Views each authenticated role may navigate to.
export const ALLOWED_VIEWS = {
    seeker: new Set([
        'seeker-dashboard', 'seeker-match', 'seeker-skill-gap',
        'seeker-verification', 'seeker-saved', 'seeker-profile',
        'seeker-search', 'seeker-applications', 'seeker-advisor',
        'seeker-onboarding',
    ]),
    employer: new Set([
        'employer-dashboard', 'employer-jobs', 'employer-candidates',
        'employer-post-job', 'employer-verification', 'employer-upload', 'employer-profile',
    ]),
}
