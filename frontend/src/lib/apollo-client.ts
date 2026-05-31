import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

// HTTP link to admin backend
const httpUrl =
  process.env.NEXT_PUBLIC_ADMIN_GRAPHQL_ENDPOINT ||
  "http://localhost:4002/graphql";
const wsUrl =
  process.env.NEXT_PUBLIC_ADMIN_WS_ENDPOINT || "ws://localhost:4002/graphql";

const httpLink = createHttpLink({
  uri: httpUrl,
  credentials: "include",
});

// Create WebSocket client with improved error handling and resilience
const wsClient = createClient({
  url: wsUrl,
  lazy: true, // Connect lazily to avoid immediate failures on page load
  keepAlive: 30000,
  retryAttempts: 5, // Limit retries to avoid infinite loops
  retryWait: async (attempt) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  },
  shouldRetry: (errOrCloseEvent) => {
    // Only retry if it's a connection error, not auth/permission errors
    if (
      typeof errOrCloseEvent === "object" &&
      errOrCloseEvent &&
      "code" in errOrCloseEvent
    ) {
      const code = errOrCloseEvent.code as number;
      // Don't retry on authentication/authorization errors (4000-4999 range)
      return code < 4000 || code >= 5000;
    }
    return true;
  },
  connectionParams: () => {
    if (typeof window === "undefined") {
      return {};
    }
    const adminToken = sessionStorage.getItem("admin-token");
    return adminToken ? { authorization: `Bearer ${adminToken}` } : {};
  },
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(wsClient);

// Split link - use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    const isSubscription =
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription";
    return isSubscription;
  },
  wsLink,
  httpLink
);

export const adminClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      // Ensure subscription updates don't cache unnecessarily
      CandidateBlockedEvent: {
        keyFields: false, // Don't cache individual events
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  connectToDevTools: process.env.NODE_ENV === "development",
});

export default adminClient;
