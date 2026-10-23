import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '@/components/RequireAuth';
import { DashboardPage } from '@/pages/DashboardPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RecurringPaymentsPage } from '@/pages/RecurringPaymentsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { useAuthStore } from '@/store/auth';

export function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  return (
    <BrowserRouter>
      <SessionRestorer onRestore={restoreSession} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/calendar"
          element={
            <RequireAuth>
              <CalendarPage />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <AnalyticsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/recurring"
          element={
            <RequireAuth role="admin">
              <RecurringPaymentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth role="admin">
              <UsersPage />
            </RequireAuth>
          }
        />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** Restores the persisted session once, before protected routes render. */
function SessionRestorer({ onRestore }: { onRestore: () => Promise<void> }) {
  const isInitializing = useAuthStore((state) => state.isInitializing);

  useEffect(() => {
    if (isInitializing) {
      void onRestore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
