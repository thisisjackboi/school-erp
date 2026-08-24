"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { GlobalSearch } from "@/components/enterprise/global-search";
import { RoleSwitcher } from "@/components/enterprise/role-switcher";
import { Avatar } from "@/components/ui/avatar";
import { useRole } from "@/lib/permissions";
import {
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { roleDetails } = useRole();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between z-20 sticky top-0 shadow-xs">
      {/* Left section: Global Search & Session Badge */}
      <div className="flex items-center space-x-4">
        <GlobalSearch />
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>Session: 2026-2027</span>
        </div>
      </div>

      {/* Right section: Role Switcher, Theme Toggle, Notifications, Profile */}
      <div className="flex items-center space-x-3">
        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg border border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg border border-border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                <div className="flex items-start space-x-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Term 1 Exam Schedule Released</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Academic Coordinator published exam timetable.</p>
                    <span className="text-[10px] text-slate-400">10 mins ago</span>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <Bell className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">New Admission Inquiry</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Inquiry received for Grade 6 Admission.</p>
                    <span className="text-[10px] text-slate-400">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar fallback={roleDetails.name.substring(0, 2).toUpperCase()} size="sm" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-border mb-1">
                <p className="font-bold text-slate-900 dark:text-slate-100">{roleDetails.name} Account</p>
                <p className="text-[10px] text-muted-foreground">user@{roleDetails.id}.school.edu</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <User className="h-3.5 w-3.5" />
                <span>My Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center space-x-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>School Settings</span>
              </Link>
              <div className="border-t border-border my-1" />
              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center space-x-2 p-2 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-950 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Switch Account</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
