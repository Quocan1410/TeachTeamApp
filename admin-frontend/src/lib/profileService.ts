const getApiBaseUrl = (): string => {
    return (
        process.env.NEXT_PUBLIC_API_ENDPOINT ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api"
    );
};

export interface ProfileUpdatePayload {
    firstName: string;
    lastName: string;
}

export interface ProfileResponse {
    success: boolean;
    message: string;
    errors?: Record<string, string>;
    data?: {
        user: {
            id: number;
            email: string;
            firstName: string;
            lastName: string;
            userType: string;
            avatarUrl?: string | null;
            fullName?: string;
        };
    };
}

export const updateAdminProfile = async (
    payload: ProfileUpdatePayload
): Promise<ProfileResponse> => {
    const token = localStorage.getItem("admin-token");

    const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    return response.json();
};
