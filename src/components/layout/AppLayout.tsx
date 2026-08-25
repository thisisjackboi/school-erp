import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Top Header */}
        <TopNavbar />

        {/* Dynamic Page Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Breadcrumb />
          <div className="mt-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
