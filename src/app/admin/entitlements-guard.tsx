import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { stripeClient } from '@/lib/stripe';
import { PAGES, API_ENDPOINTS } from '@/config/routes';

type Props = { children: React.ReactNode };

// Map minimal feature requirement for /admin root; dashboard/metrics covered here
function resolveRequiredFeature(pathname: string): import('@/types/stripe').PeepersFeature | null {
  if (pathname.startsWith('/admin/metricas') || pathname.startsWith('/admin/dashboard')) return 'advanced_analytics';
  return null;
}

export async function EntitlementsGuard({ children }: Props) {
  const cookieStore = await cookies();
  const hdrs = await headers();
  const pathname = hdrs.get('x-pathname') || '/admin';

  // Super admin bypass via environment variable
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const userEmail = cookieStore.get('user_email')?.value?.toLowerCase();
  if (superAdminEmail && userEmail && userEmail === superAdminEmail) {
    return children;
  }

  // 🔧 OAuth Flow Fix: Allow temporary access during OAuth callback processing
  // Parse current URL to check for OAuth query parameters
  let isOAuthFlow = false;
  try {
    // Check if we're in the middle of OAuth flow by looking for query parameters
    // that indicate OAuth success or error
    const url = hdrs.get('x-url') || hdrs.get('referer') || '';
    isOAuthFlow = url.includes('auth_success=') || 
                  url.includes('auth_error=') || 
                  url.includes('user_id=') ||
                  pathname.includes('auth_success') || 
                  pathname.includes('auth_error');
  } catch {
    // Ignore parsing errors
  }
  
  // Require session (but allow OAuth flow to complete)
  const userId = cookieStore.get('user_id')?.value;
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!userId || !sessionToken) {
    // If OAuth flow is in progress, allow it to complete
    if (isOAuthFlow) {
      console.log('🔄 OAuth flow detected - allowing temporary access for cookie processing');
      return children;
    }
    redirect(PAGES.LOGIN);
  }

  const feature = resolveRequiredFeature(pathname);
  if (!feature) return children;

  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // Fail-open when Stripe is not configured
      console.warn('Stripe not configured - allowing admin access');
      return children;
    }

    const result = await stripeClient.checkEntitlement(userId, feature);
    if (!result.allowed) {
      redirect(API_ENDPOINTS.UPGRADE);
    }
  } catch (error) {
    // Fail-open on Stripe downtime or configuration issues
    console.warn('Entitlements check failed, allowing access:', error);
  }

  return children;
}
