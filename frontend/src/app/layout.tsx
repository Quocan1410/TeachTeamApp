import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/shared/styles/globals.css";
import Header from "@/shared/components/layout/header/header";
import Footer from "@/shared/components/layout/footer/footer";
import { AuthProvider } from "@/modules/auth/contexts/AuthContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import { NotificationProvider } from "@/shared/contexts/NotificationContext";
import GlobalWelcomeBanner from "@/shared/components/welcome/GlobalWelcomeBanner";
import AppInitializer from "@/shared/components/app-initialization/AppInitializer";
import AccountStatusMonitor from "@/shared/components/common/AccountStatusMonitor";
import RoutePending from "@/shared/components/route-pending/RoutePending";
import { ROUTE_PENDING_BOOT } from "@/shared/components/route-pending/routePendingBoot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Teaching App",
  description: "A teaching application",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} flex flex-col min-h-screen`}
        suppressHydrationWarning={true}
      >
        <div id="app-top-progress">
          <span />
        </div>
        <style>{`
          #app-top-progress[hidden] { display: none !important; }
          #app-top-progress {
            position: fixed;
            z-index: 80;
            top: 0;
            left: 0;
            right: 0;
            height: 0.1875rem;
            overflow: hidden;
            pointer-events: none;
            background: transparent;
          }
          #app-top-progress > span {
            display: block;
            height: 100%;
            width: 100%;
            transform-origin: left center;
            transform: scaleX(0.08);
            background: #f6610a;
            transition: transform 180ms ease-out;
            animation: app-top-progress 12s cubic-bezier(0.05, 0.7, 0.2, 1) forwards;
          }
          @keyframes app-top-progress {
            from { transform: scaleX(0.04); }
            to { transform: scaleX(0.9); }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: ROUTE_PENDING_BOOT }} />
        <RoutePending />
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <AppInitializer />
              <AccountStatusMonitor />
              <Header />
              <GlobalWelcomeBanner />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
