import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, getDefaultRouteForRole, useAuth, type UserRole } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';

// Public pages
import { HomePage } from './pages/public/HomePage.tsx';
import { AboutPage } from './pages/public/AboutPage.tsx';
import { FeaturesPage } from './pages/public/FeaturesPage.tsx';
import { PricingPage } from './pages/public/PricingPage.tsx';
import { UniversitiesPage } from './pages/public/UniversitiesPage.tsx';
import { HowItWorksPage } from './pages/public/HowItWorksPage.tsx';
import { ContactPage } from './pages/public/ContactPage.tsx';
import { LoginPage } from './pages/public/LoginPage.tsx';
import { RegisterPage } from './pages/public/RegisterPage.tsx';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage.tsx';
import { PrivacyPage } from './pages/public/PrivacyPage.tsx';
import { TermsPage } from './pages/public/TermsPage.tsx';

// Student & Shared pages
import { OnboardingPage } from './pages/student/OnboardingPage.tsx';
import { StudentDashboard } from './pages/student/StudentDashboard.tsx';
import { PYQLibraryPage } from './pages/student/PYQLibraryPage.tsx';
import { QuestionBankPage } from './pages/student/QuestionBankPage.tsx';
import { MockTestsPage } from './pages/student/MockTestsPage.tsx';
import { MockTestRunnerPage } from './pages/student/MockTestRunnerPage.tsx';
import { VerifiedSolutionsPage } from './pages/student/VerifiedSolutionsPage.tsx';
import { TrendAnalysisPage } from './pages/student/TrendAnalysisPage.tsx';
import { PackagesBillingPage } from './pages/student/PackagesBillingPage.tsx';
import { ProfileSettingsPage } from './pages/student/ProfileSettingsPage.tsx';

// Role dashboards
import { ContributorDashboard } from './pages/contributor/ContributorDashboard.tsx';
import { CampusLeadDashboard } from './pages/campusLead/CampusLeadDashboard.tsx';
import { ReviewerDashboard } from './pages/reviewer/ReviewerDashboard.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function RequireAuth({
  roles,
  children,
}: {
  roles?: UserRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm text-slate-500">
        Loading workspace...
      </div>
    );
  }
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
          <Routes>
            {/* Public Website */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/universities" element={<UniversitiesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Onboarding & Settings */}
            <Route
              path="/onboarding"
              element={
                <RequireAuth>
                  <OnboardingPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <ProfileSettingsPage />
                </RequireAuth>
              }
            />

            {/* Student Portal */}
            <Route
              path="/student/dashboard"
              element={
                <RequireAuth roles={['student', 'admin']}>
                  <StudentDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/student/pyqs"
              element={
                <RequireAuth>
                  <PYQLibraryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/questions"
              element={
                <RequireAuth>
                  <QuestionBankPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/tests"
              element={
                <RequireAuth>
                  <MockTestsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/tests/run/:testId"
              element={
                <RequireAuth>
                  <MockTestRunnerPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/tests/attempt/:attemptId"
              element={
                <RequireAuth>
                  <MockTestRunnerPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/solutions"
              element={
                <RequireAuth>
                  <VerifiedSolutionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/trends"
              element={
                <RequireAuth>
                  <TrendAnalysisPage />
                </RequireAuth>
              }
            />
            <Route
              path="/student/packages"
              element={
                <RequireAuth>
                  <PackagesBillingPage />
                </RequireAuth>
              }
            />

            {/* Role-Specific Workspaces */}
            <Route
              path="/contributor"
              element={
                <RequireAuth roles={['contributor', 'campus_lead', 'admin']}>
                  <ContributorDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/campus-lead"
              element={
                <RequireAuth roles={['campus_lead', 'admin']}>
                  <CampusLeadDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/reviewer"
              element={
                <RequireAuth roles={['reviewer', 'admin']}>
                  <ReviewerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth roles={['admin']}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
