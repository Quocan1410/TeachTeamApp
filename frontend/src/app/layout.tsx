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
import SystemAnnouncementBanner from "@/shared/components/common/SystemAnnouncementBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Teaching App",
  description: "A teaching application",
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
        suppressHydrationWarning={true} // Suppress hydration warnings for browser extension modifications
      >
        {" "}
        {/* Added flex classes for sticky footer */}
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <AppInitializer />
              <AccountStatusMonitor />
              <Header />
              <SystemAnnouncementBanner />
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
