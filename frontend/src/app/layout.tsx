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
        <div id="app-route-pending" hidden>
          <div />
          <p id="app-route-pending-label">Loading…</p>
        </div>
        <style>{`
          #app-route-pending[hidden] { display: none !important; }
          #app-route-pending {
            position: fixed;
            z-index: 80;
            top: 0.75rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: min(18rem, calc(100vw - 2rem));
            overflow: hidden;
            border-radius: 999px;
            background: #111827;
            color: #fff;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
          }
          #app-route-pending > div {
            height: 3px;
            background: linear-gradient(90deg, transparent, #fb923c, transparent);
            background-size: 200% 100%;
            animation: app-route-pending 1s linear infinite;
          }
          #app-route-pending p {
            margin: 0;
            padding: 0.45rem 0.9rem 0.55rem;
            font-size: 0.875rem;
            font-weight: 600;
            text-align: center;
          }
          @keyframes app-route-pending {
            from { background-position: 100% 0; }
            to { background-position: -100% 0; }
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
