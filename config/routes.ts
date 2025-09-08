type RouteConfig = {
  path: string;
  pattern?: RegExp;
  requiresAuth?: boolean;
  requiresCsrf?: boolean;
};

// Configure routes with explicit protection requirements
const ROUTE_CONFIG: RouteConfig[] = [
  // Fully exempt routes
  {
    path: '/_next',
    pattern: /^\/_next/,
    requiresAuth: false,
    requiresCsrf: false,
  },
  {
    path: '/static',
    pattern: /^\/static/,
    requiresAuth: false,
    requiresCsrf: false,
  },
  {
    path: '/images',
    pattern: /^\/images/,
    requiresAuth: false,
    requiresCsrf: false,
  },
  // PostHog analytics proxy (exempt)
  {
    path: '/ingest',
    pattern: /^\/ingest/,
    requiresAuth: false,
    requiresCsrf: false,
  },
  // sentry
  {
    path: '/monitoring',
    requiresAuth: false,
    requiresCsrf: false,
  },
  { path: '/favicon.ico', requiresAuth: false, requiresCsrf: false },
  { path: '/opengraph-image', requiresAuth: false, requiresCsrf: false },
  { path: '/twitter-image', requiresAuth: false, requiresCsrf: false },
  { path: '/api/audio', requiresAuth: false, requiresCsrf: false },
  // Public API routes (catch-all for /api/auth/*, no CSRF)
  {
    path: '/api/auth',
    pattern: /^\/api\/auth(\/|$)/,
    requiresAuth: false,
    requiresCsrf: false,
  },
  { path: '/api/cookies', requiresAuth: false, requiresCsrf: false },
  { path: '/api/ip', requiresAuth: false, requiresCsrf: false },

  // Public pages
  { path: '/login', requiresAuth: false, requiresCsrf: false },
  { path: '/register', requiresAuth: false, requiresCsrf: false },
  { path: '/docs', requiresAuth: false, requiresCsrf: false },
  { path: '/privacy', requiresAuth: false, requiresCsrf: false },
  { path: '/tos', requiresAuth: false, requiresCsrf: false },
  { path: '/refunds', requiresAuth: false, requiresCsrf: false },
  { path: '/', requiresAuth: false, requiresCsrf: false },
];

export const getRouteConfig = (pathname: string): RouteConfig => {
  const route = ROUTE_CONFIG.find((route) =>
    route.pattern ? route.pattern.test(pathname) : pathname === route.path
  );
  return (
    route || {
      path: pathname,
      requiresAuth: true,
      requiresCsrf: true,
    }
  );
};

// todo: modify this correctly

// const handleSessionAuth = async (request: NextRequest) => {
//   const sessionCookie = (await getSessionCookie(request, {
//     cookieName: 'session_token',
//     cookiePrefix: 'ctxai-auth',
//     path: '/',
//   })) as string | undefined;

//   if (!sessionCookie) {
//     return redirectToLogin(request);
//   }

//   return NextResponse.next();
// };

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const routeConfig = getRouteConfig(pathname);
//   const origin = request.headers.get('origin');
//   const headers = corsHeaders(origin);

//   // Handle preflight requests
//   if (request.method === 'OPTIONS') {
//     const preflightResponse = NextResponse.next();
//     if (headers) {
//       Object.entries(headers).forEach(([key, value]) => {
//         preflightResponse.headers.set(key, value);
//       });
//     }
//     return preflightResponse;
//   }

//   const response = NextResponse.next();

//   // Add CORS headers
//   if (headers) {
//     Object.entries(headers).forEach(([key, value]) => {
//       response.headers.set(key, value);
//     });
//   }

//   // Generate CSRF token for any GET request if it doesn't exist
//   if (request.method === 'GET') {
//     const existingToken = request.cookies.get('ctxai-csrf')?.value;
//     if (!existingToken) {
//       const csrfToken = generateCsrfToken();
//       response.cookies.set('ctxai-csrf', csrfToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         path: '/',
//       });
//     }
//   }

//   // Check auth if required
//   if (routeConfig.requiresAuth) {
//     const authResponse = await handleSessionAuth(request);
//     if (authResponse.status !== 200) {
//       return authResponse;
//     }
//   }

//   // Check CSRF if required
//   if (
//     routeConfig.requiresCsrf &&
//     !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
//   ) {
//     // Skip CSRF for Server Actions (they have their own protection)
//     const isServerAction = request.headers.get('Next-Action') !== null;
//     if (!isServerAction) {
//       const csrfToken = request.headers.get('X-CSRF-Token');
//       const storedToken = request.cookies.get('ctxai-csrf')?.value;

//       if (!validateCsrfToken(csrfToken, storedToken)) {
//         console.error('Invalid CSRF token:', csrfToken);
//         console.error('Stored CSRF token:', storedToken);
//         return NextResponse.json(
//           { error: 'Invalid CSRF token' },
//           { status: 403 },
//         );
//       }
//     }
//   }

//   return response;
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except:
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - icon.svg (icon file)
//      * - apple-icon.png (apple touch icon)
//      * - public folder
//      */
//     '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };
