const getApiBaseUrl = (): string => {
    return (
        process.env.NEXT_PUBLIC_API_ENDPOINT ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api"
    );
};

export interface AvatarResponse {
    success: boolean;
    message: string;
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

export const uploadAdminAvatar = async (file: File): Promise<AvatarResponse> => {
    const token = localStorage.getItem("admin-token");
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${getApiBaseUrl()}/auth/avatar`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    return response.json();
};

export const deleteAdminAvatar = async (): Promise<AvatarResponse> => {
    const token = localStorage.getItem("admin-token");

    const response = await fetch(`${getApiBaseUrl()}/auth/avatar`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.json();
};
