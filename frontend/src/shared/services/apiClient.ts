import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";

export const apiClient = axios.create({
  baseURL: env.apiEndpoint,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<boolean> | null = null;

const refreshSession = async (): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${env.apiEndpoint}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return response.data?.success === true;
  } catch {
    return false;
  }
};

const shouldSkipRefresh = (url: string): boolean =>
  url.includes("/auth/refresh") ||
  url.includes("/auth/signin") ||
  url.includes("/auth/signup");

export const attachRefreshInterceptor = (client: AxiosInstance): void => {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;
      const url = original?.url || "";

      if (
        !original ||
        original._retry ||
        status !== 401 ||
        shouldSkipRefresh(url)
      ) {
        return Promise.reject(error);
      }

      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        return client(original);
      }

      return Promise.reject(error);
    }
  );
};

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

attachRefreshInterceptor(apiClient);

export const getAxiosErrorData = <T>(error: unknown): T | undefined => {
  const axiosError = error as AxiosError<T>;
  return axiosError.response?.data;
};

export const createApiClient = (pathPrefix: string): AxiosInstance => {
  const client = axios.create({
    baseURL: `${env.apiEndpoint}${pathPrefix}`,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
  attachRefreshInterceptor(client);
  return client;
};
