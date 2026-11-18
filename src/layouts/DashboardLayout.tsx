import {
  BarChart3,
  BookOpen,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileText,
  FolderUp,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/common/MotionPrimitives.tsx';
import { NotificationBell } from '../components/common/NotificationBell.tsx';
import { ThemeToggle } from '../components/common/ThemeToggle.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const studentNav: NavItem[] = [
    { to: '/student/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/student/pyqs', label: 'PYQ Library', icon: <FileText className="w-4 h-4" /> },
    { to: '/student/questions', label: 'Question Bank', icon: <BookOpen className="w-4 h-4" /> },
    { to: '/student/tests', label: 'Mock Tests', icon: <ClipboardList className="w-4 h-4" /> },
    { to: '/student/solutions', label: 'Verified Solutions', icon: <CheckSquare className="w-4 h-4" /> },
    { to: '/student/trends', label: 'Trend Analysis', icon: <TrendingUp className="w-4 h-4" /> },
    { to: '/student/packages', label: 'Packages & Billing', icon: <CreditCard className="w-4 h-4" /> },
    { to: '/settings', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const contributorNav: NavItem[] = [
    { to: '/contributor', label: 'Contributor Portal', icon: <FolderUp className="w-4 h-4" /> },
    { to: '/student/pyqs', label: 'Browse PYQs', icon: <FileText className="w-4 h-4" /> },
    { to: '/settings', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const campusLeadNav: NavItem[] = [
    { to: '/campus-lead', label: 'Campus Lead Console', icon: <Users className="w-4 h-4" /> },
    { to: '/contributor', label: 'My Submissions', icon: <FolderUp className="w-4 h-4" /> },
    { to: '/settings', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const reviewerNav: NavItem[] = [
    { to: '/reviewer', label: 'Reviewer Queue', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/student/solutions', label: 'Solutions Catalogue', icon: <CheckSquare className="w-4 h-4" /> },
    { to: '/settings', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const adminNav: NavItem[] = [
    { to: '/admin', label: 'Admin Console', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/reviewer', label: 'Review Queue', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/student/pyqs', label: 'Public PYQ View', icon: <FileText className="w-4 h-4" /> },
    { to: '/settings', label: 'Account Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  let navItems = studentNav;
  if (user?.role === 'contributor') navItems = contributorNav;
  else if (user?.role === 'campus_lead') navItems = campusLeadNav;
  else if (user?.role === 'reviewer') navItems = reviewerNav;
  else if (user?.role === 'admin') navItems = adminNav;

  const roleLabels: Record<string, string> = {
    student: 'Student Workspace',
    contributor: 'Campus Contributor',
    campus_lead: 'Campus Lead',
    reviewer: 'Academic Reviewer',
    admin: 'Platform Administrator',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderSidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          UNIHUB
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {roleLabels[user?.role || 'student']}
          {user?.academicProfile?.universityCode ? ` · ${user.academicProfile.universityCode}` : ''}
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId={isMobile ? 'sidebar-active-pill-mobile' : 'sidebar-active-pill-desktop'}
                  transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-slate-900 dark:bg-cyan-600 -z-0"
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
        {renderSidebarContent(false)}
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 z-10 shadow-xl"
            >
              {renderSidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
            <Link
              to="/settings"
              className="hidden sm:inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
            >
              Account
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <PageTransition key={location.pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
