/**
 * Admin Home Page - v2.0
 * 
 * Main entry point for admin panel
 * Redirects to dashboard or shows dashboard directly
 */

import AdminDashboard from './dashboard/page';

export default function AdminPage() {
  return <AdminDashboard />;
}