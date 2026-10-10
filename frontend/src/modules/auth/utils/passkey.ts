import { AxiosError } from "axios";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { AuthResponse } from "@/shared/types/user";
import { createApiClient } from "@/shared/services/apiClient";

const authAPI = createApiClient("/auth");

function browserSupportsPasskey(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

function passkeyErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.name === "NotAllowedError") {
    return "Passkey was cancelled.";
  }
  const axiosError = error as AxiosError<AuthResponse>;
  const message = axiosError.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  return fallback;
}

export async function fetchPasskeyStatus(): Promise<boolean> {
  try {
    const response = await authAPI.get("/passkey/status");
    return response.data?.hasPasskey === true;
  } catch {
    return false;
  }
}

export async function createPasskey(): Promise<AuthResponse> {
  if (!browserSupportsPasskey()) {
    return {
      success: false,
      message: "This browser cannot use a passkey.",
    };
  }
  try {
    const optionsResponse = await authAPI.post("/passkey/register/options");
    const options = optionsResponse.data?.options;
    if (!optionsResponse.data?.success || !options) {
      return {
        success: false,
        message: "Passkey could not be started.",
      };
    }
    const attestation = await startRegistration({ optionsJSON: options });
    const verifyResponse = await authAPI.post(
      "/passkey/register/verify",
      attestation
    );
    return verifyResponse.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<AuthResponse>;
    if (axiosError.response?.data) return axiosError.response.data;
    return {
      success: false,
      message: passkeyErrorMessage(error, "Passkey could not be saved."),
    };
  }
}

export async function signInWithPasskey(): Promise<AuthResponse> {
  if (!browserSupportsPasskey()) {
    return {
      success: false,
      message: "This browser cannot use a passkey.",
    };
  }
  try {
    const optionsResponse = await authAPI.post("/passkey/login/options");
    const options = optionsResponse.data?.options;
    if (!optionsResponse.data?.success || !options) {
      return {
        success: false,
        message: "Passkey could not be started.",
      };
    }
    const assertion = await startAuthentication({ optionsJSON: options });
    const verifyResponse = await authAPI.post(
      "/passkey/login/verify",
      assertion
    );
    return verifyResponse.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<AuthResponse>;
    if (axiosError.response?.data) return axiosError.response.data;
    return {
      success: false,
      message: passkeyErrorMessage(error, "Passkey could not be verified."),
    };
  }
}
