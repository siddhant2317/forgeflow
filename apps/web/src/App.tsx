import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';

const PartsListPage = lazy(() => import('./pages/parts/PartsListPage.tsx'));
const PartDetailPage = lazy(() => import('./pages/parts/PartDetailPage.tsx'));
const PartFormPage = lazy(() => import('./pages/parts/PartFormPage.tsx'));
const BOMPage = lazy(() => import('./pages/bom/BOMPage.tsx'));
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage.tsx'));
const WorkOrdersPage = lazy(() => import('./pages/workorders/WorkOrdersPage.tsx'));
const WorkOrderDetailPage = lazy(() => import('./pages/workorders/WorkOrderDetailPage.tsx'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage.tsx'));
const AboutPage = lazy(() => import('./pages/about/AboutPage.tsx'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage.tsx'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.tsx'));

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block py-3 md:py-4 border-b-2 text-sm font-medium transition-colors ${
          isActive
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-900'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function PageLoader() {
  return <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>;
}

function UserMenu() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
          {(user.name?.[0] ?? user.email[0]).toUpperCase()}
        </div>
      )}
      <span className="text-sm text-gray-700 hidden sm:block">{user.name ?? user.email}</span>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="md:hidden border-b border-gray-200 bg-white px-4 pb-3 flex flex-col gap-1">
      <NavItem to="/parts" label="Parts" onClick={onClose} />
      <NavItem to="/inventory" label="Inventory" onClick={onClose} />
      <NavItem to="/work-orders" label="Work Orders" onClick={onClose} />
      <NavItem to="/dashboard" label="Dashboard" onClick={onClose} />
      <NavItem to="/about" label="About" onClick={onClose} />
      <div className="pt-2 border-t border-gray-100 mt-1">
        <UserMenu />
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  const closeMobile = () => setMobileOpen(false);
  if (mobileOpen && location.pathname) {
    /* handled via onClick on NavItems */
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <div className="min-h-screen bg-gray-50">
              <nav className="bg-white border-b border-gray-200 px-4 md:px-6">
                <div className="flex items-center justify-between md:justify-start md:gap-8">
                  <NavLink to="/" className="text-lg font-bold text-blue-700 py-4 no-underline shrink-0">
                    ⚡ LineForge
                  </NavLink>
                  <div className="hidden md:flex items-center gap-8 flex-1">
                    <NavItem to="/parts" label="Parts" />
                    <NavItem to="/inventory" label="Inventory" />
                    <NavItem to="/work-orders" label="Work Orders" />
                    <NavItem to="/dashboard" label="Dashboard" />
                    <NavItem to="/about" label="About" />
                    <div className="ml-auto">
                      <UserMenu />
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-900"
                    aria-label="Toggle menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {mobileOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
              </nav>
              <MobileNav open={mobileOpen} onClose={closeMobile} />

              <main className="p-4 md:p-6">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/parts" replace />} />
                    <Route path="/parts" element={<PartsListPage />} />
                    <Route path="/parts/new" element={<PartFormPage />} />
                    <Route path="/parts/:id" element={<PartDetailPage />} />
                    <Route path="/parts/:id/edit" element={<PartFormPage />} />
                    <Route path="/parts/:id/bom" element={<BOMPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/work-orders" element={<WorkOrdersPage />} />
                    <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/about" element={<AboutPage />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
