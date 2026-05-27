"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../shared/components/common/Header/AdminHeader";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem("admin-token");
        const userData = localStorage.getItem("admin-user");

        if (!token || !userData) {
            router.push("/");
            return;
        }

        setUser(JSON.parse(userData));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-user");
        router.push("/");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">
                        Loading admin panel...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminHeader user={user} onLogout={handleLogout} />

            {/* Main content with header padding */}
            <main className="pt-20">{children}</main>
        </div>
    );
}
