import EbayAuthToken from "ebay-oauth-nodejs-client";
import dotenv from "dotenv";
import { IntegrationTokenModel } from "@/models/integration-token.model";

// Configure dotenv to use .env file like .env.dev or .env.prod
dotenv.config({ path: `.env.${process.env.NODE_ENV || "dev"}` });

// ============================================================================
// GLOBAL CONSTANTS AND CONFIGURATION
// ============================================================================

// eBay Environment Configuration
export const EBAY_ENV = {
  PRODUCTION: "PRODUCTION" as const,
  SANDBOX: "SANDBOX" as const,
} as const;

export type EbayEnvironment = (typeof EBAY_ENV)[keyof typeof EBAY_ENV];

// eBay API Base URLs
export const EBAY_API_URLS = {
  [EBAY_ENV.PRODUCTION]: "https://api.ebay.com",
  [EBAY_ENV.SANDBOX]: "https://api.sandbox.ebay.com",
} as const;

// eBay Auth Base URLs
export const EBAY_AUTH_URLS = {
  [EBAY_ENV.PRODUCTION]: "api.ebay.com",
  [EBAY_ENV.SANDBOX]: "api.sandbox.ebay.com",
} as const;

// All required scopes for the application
export const EBAY_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
  "https://api.ebay.com/oauth/api_scope/sell.finances",
  "https://api.ebay.com/oauth/api_scope/sell.payment.dispute",
  "https://api.ebay.com/oauth/api_scope/sell.reputation",
  "https://api.ebay.com/oauth/api_scope/commerce.notification.subscription",
  "https://api.ebay.com/oauth/api_scope/sell.stores",
  "https://api.ebay.com/oauth/scope/sell.edelivery",
  "https://api.ebay.com/oauth/api_scope/commerce.vero",
];

// Token refresh buffer time (5 minutes before expiry)
export const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EbayToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  generated_at?: number;
}

export interface EbayAuthOptions {
  prompt?: "login" | "consent";
  state?: string;
}

export interface EbayAuthTokenOptions {
  clientId: string;
  clientSecret: string;
  env?: EbayEnvironment;
  baseUrl?: string;
  redirectUri?: string;
  scope?: string[] | string;
}

export type EnvironmentType = "production" | "sandbox";
export type UseClientFlag = "true" | "false";

// ============================================================================
// GLOBAL EBAY AUTH INSTANCES
// ============================================================================

// Global eBay auth token instances
export let ebayAuthToken: EbayAuthToken | null = null;
export let ebayAuthTokenSandbox: EbayAuthToken | null = null;

// Global client token (for backward compatibility)
// export const CLIENT_TOKEN: EbayToken = {
//   access_token: process.env.EBAY_CLIENT_ACCESS_TOKEN || "",
//   refresh_token: process.env.EBAY_CLIENT_REFRESH_TOKEN || "",
//   expires_in: parseInt(process.env.EBAY_CLIENT_EXPIRES_IN || "7200"),
//   token_type: "User Access Token",
//   generated_at: 0,
// };

export const CLIENT_TOKEN = {
  access_token:
    "v^1.1#i^1#r^0#p^3#I^3#f^0#t^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",
  expires_in: 7200,
  refresh_token: "v^1.1#i^1#f^0#r^1#p^3#I^3#t^Ul4xMF81OjIwQzQwQTdEMjE3N0ZCNEUxMkRDMDExNjdBN0I0RDUzXzFfMSNFXjI2MA==",
  refresh_token_expires_in: 47304000,
  token_type: "User Access Token",
  generated_at: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get eBay environment from environment variables
 */
export const getEbayEnvironment = (): EbayEnvironment => {
  return process.env.EBAY_TOKEN_ENV === "sandbox" ? EBAY_ENV.SANDBOX : EBAY_ENV.PRODUCTION;
};

/**
 * Validate eBay credentials for a specific environment
 */
export const validateEbayCredentials = (type: EnvironmentType): boolean => {
  const requiredVars =
    type === "production"
      ? ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_REDIRECT_URI"]
      : ["EBAY_CLIENT_ID_SANDBOX", "EBAY_CLIENT_SECRET_SANDBOX", "EBAY_REDIRECT_URI_SANDBOX"];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(`❌ Missing eBay ${type} environment variables: ${missing.join(", ")}`);
    return false;
  }

  return true;
};

/**
 * Create eBay auth token instance for a specific environment
 */
export const createEbayAuthToken = (type: EnvironmentType): EbayAuthToken | null => {
  if (!validateEbayCredentials(type)) {
    return null;
  }

  try {
    if (type === "production") {
      return new EbayAuthToken({
        clientId: process.env.EBAY_CLIENT_ID!,
        clientSecret: process.env.EBAY_CLIENT_SECRET!,
        redirectUri: process.env.EBAY_REDIRECT_URI!,
        baseUrl: EBAY_AUTH_URLS[EBAY_ENV.PRODUCTION],
        env: EBAY_ENV.PRODUCTION,
      });
    } else {
      return new EbayAuthToken({
        clientId: process.env.EBAY_CLIENT_ID_SANDBOX!,
        clientSecret: process.env.EBAY_CLIENT_SECRET_SANDBOX!,
        redirectUri: process.env.EBAY_REDIRECT_URI_SANDBOX!,
        baseUrl: EBAY_AUTH_URLS[EBAY_ENV.SANDBOX],
        env: EBAY_ENV.SANDBOX,
      });
    }
  } catch (error) {
    console.error(`❌ Failed to create eBay auth token for ${type}:`, error);
    return null;
  }
};

/**
 * Initialize global eBay auth instances
 */
export const initializeEbayAuthInstances = (): void => {
  try {
    ebayAuthToken = createEbayAuthToken("production");
    ebayAuthTokenSandbox = createEbayAuthToken("sandbox");

    if (ebayAuthToken) {
      console.log("✅ eBay production auth instance initialized");
    }
    if (ebayAuthTokenSandbox) {
      console.log("✅ eBay sandbox auth instance initialized");
    }
  } catch (error) {
    console.error("❌ Failed to initialize eBay auth instances:", error);
  }
};

/**
 * Get the appropriate auth instance based on environment
 */
export const getAuthInstance = (type: EnvironmentType): EbayAuthToken | null => {
  return type === "production" ? ebayAuthToken : ebayAuthTokenSandbox;
};

/**
 * Get environment type from string
 */
export const getEnvironmentType = (env?: string): EnvironmentType => {
  return env === "sandbox" ? "sandbox" : "production";
};

// ============================================================================
// TOKEN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get application auth token and store in DB
 */
export const getApplicationAuthToken = async (
  type: EnvironmentType = "production",
  useClient: UseClientFlag = "false"
): Promise<EbayToken | null> => {
  try {
    console.log(`🔐 Getting eBay application token for ${type}...`);

    if (!validateEbayCredentials(type)) {
      console.error(`❌ Invalid eBay ${type} credentials. Please check your environment variables.`);
      return null;
    }

    const authInstance = getAuthInstance(type);
    if (!authInstance) {
      console.error(`❌ eBay ${type} auth token instance not initialized`);
      return null;
    }

    const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
    const token = await authInstance.getApplicationToken(env);

    if (!token) {
      console.error(`❌ Failed to get new eBay ${type} access token. Please verify your credentials.`);
      return null;
    }

    const parsedToken: EbayToken = JSON.parse(token);

    if (useClient === "true") {
      return { ...parsedToken, generated_at: Date.now() };
    }

    // Store in DB
    await IntegrationTokenModel.updateOne(
      { provider: "ebay", environment: env, useClient: false },
      { $set: { ...parsedToken, generated_at: Date.now() } },
      { upsert: true }
    );

    console.log(`✅ eBay application token stored in DB for ${type}`);
    return parsedToken;
  } catch (error) {
    console.error(`❌ Failed to get eBay application token for ${type}:`, error);
    return null;
  }
};

/**
 * Get stored eBay access token from DB or refresh if needed
 */
export const getStoredEbayAccessToken = async (client: UseClientFlag = "false") => {
  try {
    if (client === "true") {
      return await handleClientToken();
    }

    const type = getEnvironmentType(process.env.EBAY_TOKEN_ENV);
    const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;

    // Get token from DB
    const tokenDoc = await IntegrationTokenModel.findOne({
      provider: "ebay",
      environment: env,
      useClient: false,
    }).lean();

    if (!tokenDoc) {
      console.log(`❌ No eBay application token found in DB for ${env}. Getting application token...`);
      return await getNewApplicationToken(type);
    }

    return await validateAndRefreshToken(tokenDoc, type, env);
  } catch (error) {
    console.error("❌ Unexpected error reading token:", error);
    return null;
  }
};

/**
 * Handle client token logic
 */
const handleClientToken = async () => {
  if (CLIENT_TOKEN.expires_in * 1000 + CLIENT_TOKEN.generated_at < Date.now()) {
    console.log("🔄 Client token expired, refreshing...");
    const newToken = await refreshEbayAccessTokenOriginal("production", "true");
    console.log("🔑 [CLIENT] New client token:", newToken);
    return newToken;
  } else {
    console.log("🔑 [CLIENT] Returning client token");
    return CLIENT_TOKEN;
  }
};

/**
 * Get new application token when none exists
 */
const getNewApplicationToken = async (type: EnvironmentType): Promise<string | null> => {
  if (!validateEbayCredentials(type)) {
    console.error(`❌ Invalid eBay ${type} credentials. Cannot get application token.`);
    return null;
  }

  const appToken = await getApplicationAuthToken(type);
  if (appToken?.access_token) {
    console.log("✅ Application token obtained and stored. Using it...");
    return appToken.access_token;
  } else {
    console.error("❌ Failed to get application token. Please verify your eBay credentials.");
    return null;
  }
};

/**
 * Validate and refresh token if needed
 */
const validateAndRefreshToken = async (tokenDoc: any, type: EnvironmentType, env: EbayEnvironment) => {
  const { access_token, generated_at, expires_in } = tokenDoc;

  if (!access_token || !generated_at || !expires_in || isNaN(generated_at) || isNaN(expires_in)) {
    console.error("❌ Invalid or missing token fields. Clearing invalid token and getting new one...");
    await clearInvalidToken(env);
    return await getNewApplicationToken(type);
  }

  const currentTime = Date.now();
  const expiresAt = generated_at + expires_in * 1000;
  const timeRemaining = expiresAt - currentTime;

  if (timeRemaining <= TOKEN_REFRESH_BUFFER) {
    console.warn("⚠️ Access token is expired or about to expire. Refreshing...");
    const newToken = await refreshEbayAccessToken(type, "false");
    return newToken;
  }

  // Test token validity
  if (!(await testTokenValidity(access_token, type))) {
    console.log("🔄 Token is invalid, getting new application token...");
    await clearInvalidToken(env);
    return await getNewApplicationToken(type);
  }

  const isProduction = type === "production";
  console.log(`✅ [APPLICATION TOKEN - ${isProduction ? "PRODUCTION" : "SANDBOX"}] Access token is valid.`);
  return access_token;
};

/**
 * Clear invalid token from DB
 */
const clearInvalidToken = async (env: EbayEnvironment): Promise<void> => {
  await IntegrationTokenModel.deleteOne({
    provider: "ebay",
    environment: env,
    useClient: false,
  });
};

/**
 * Test token validity with a simple API call
 */
const testTokenValidity = async (accessToken: string, type: EnvironmentType): Promise<boolean> => {
  try {
    const testUrl =
      type === "production"
        ? `${EBAY_API_URLS[EBAY_ENV.PRODUCTION]}/commerce/taxonomy/v1/category_tree/0`
        : `${EBAY_API_URLS[EBAY_ENV.SANDBOX]}/commerce/taxonomy/v1/category_tree/0`;

    const testResponse = await fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    return testResponse.status !== 401;
  } catch (error) {
    console.warn("⚠️ Could not validate token, using existing token:", error);
    return true; // Assume valid if we can't test
  }
};

/**
 * Get eBay application token (legacy function)
 */
export const getEbayApplicationToken = async (type: EnvironmentType): Promise<EbayToken | null> => {
  const authInstance = getAuthInstance(type);
  if (!authInstance) {
    console.error(`❌ eBay ${type} auth instance not initialized`);
    return null;
  }

  const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
  const token = await authInstance.getApplicationToken(env);

  if (!token) {
    console.log("Failed to get new access token");
    return null;
  }

  const parsedToken: EbayToken = JSON.parse(token);
  await IntegrationTokenModel.updateOne(
    { provider: "ebay", environment: env, useClient: false },
    { $set: { ...parsedToken, generated_at: Date.now() } },
    { upsert: true }
  );

  return parsedToken;
};

/**
 * Get normal access token (legacy function)
 */
export const getNormalAccessToken = async (): Promise<EbayToken | null> => {
  if (!ebayAuthToken) {
    console.error("❌ eBay production auth instance not initialized");
    return null;
  }

  const token = await ebayAuthToken.getApplicationToken(EBAY_ENV.PRODUCTION);
  if (!token) {
    console.log("Failed to get new access token");
    return null;
  }

  return JSON.parse(token);
};

// ============================================================================
// TOKEN REFRESH FUNCTIONS
// ============================================================================

/**
 * Refresh eBay access token
 */
export const refreshEbayAccessToken = async (
  type: EnvironmentType,
  useClient: UseClientFlag
): Promise<EbayToken | null> => {
  try {
    const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;

    if (useClient === "true") {
      return await refreshClientToken();
    }

    // For application tokens, get a new one since they don't have refresh tokens
    console.log("🔄 Refreshing application token...");
    return await getApplicationAuthToken(type);
  } catch (error) {
    console.error("❌ Error refreshing eBay access token:", error);
    return null;
  }
};

/**
 * Refresh client token
 */
const refreshClientToken = async (): Promise<EbayToken | null> => {
  console.log("🔑 [CLIENT] Refreshing client token...");
  return await refreshEbayAccessTokenOriginal("production", "true");
};

/**
 * Original refresh function for backward compatibility
 */
export const refreshEbayAccessTokenOriginal = async (
  type: EnvironmentType,
  useClient: UseClientFlag
): Promise<EbayToken | null> => {
  try {
    let credentials: EbayToken | null = null;

    if (useClient === "true") {
      console.log("🔑 [CLIENT] Using client token");
      credentials = CLIENT_TOKEN;
    } else {
      const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
      credentials = await IntegrationTokenModel.findOne({
        provider: "ebay",
        environment: env,
        useClient: false,
      });
    }

    if (!credentials) {
      console.log("No credentials found");
      return null;
    }

    const { refresh_token } = credentials;
    if (!refresh_token) {
      console.log("No refresh token found");
      return null;
    }

    const authInstance = getAuthInstance(type);
    if (!authInstance) {
      console.error(`❌ eBay ${type} auth instance not initialized`);
      return null;
    }

    const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
    const token = await authInstance.getAccessToken(env, refresh_token, EBAY_SCOPES);

    if (!token) {
      console.log("Failed to get new access token");
      return null;
    }

    const parsedToken: EbayToken = JSON.parse(token);
    await updateToken(parsedToken, type, useClient);

    return parsedToken;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return null;
  }
};

/**
 * Update token in appropriate storage
 */
const updateToken = async (parsedToken: EbayToken, type: EnvironmentType, useClient: UseClientFlag): Promise<void> => {
  if (useClient === "true") {
    console.log("🔑 [CLIENT] Updating client token");
    Object.assign(CLIENT_TOKEN, parsedToken);
    CLIENT_TOKEN.generated_at = Date.now();
  } else {
    const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
    console.log(`🔵 [${type.toUpperCase()}] Updating token in DB`);
    await IntegrationTokenModel.updateOne(
      { provider: "ebay", environment: env, useClient: false },
      { $set: { ...parsedToken, generated_at: Date.now() } },
      { upsert: true }
    );
  }
};

// ============================================================================
// AUTHENTICATION URL FUNCTIONS
// ============================================================================

/**
 * Get eBay authorization URL
 */
export const getEbayAuthURL = (type: EnvironmentType): string => {
  const authInstance = getAuthInstance(type);
  if (!authInstance) {
    throw new Error(`eBay ${type} auth instance not initialized`);
  }

  const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
  const options: EbayAuthOptions = { prompt: "consent" };

  if (type === "production") {
    console.log("🔵 [PRODUCTION] Generating production auth URL");
  } else {
    console.log("🟣 [SANDBOX] Generating sandbox auth URL");
  }

  return authInstance.generateUserAuthorizationUrl(env, EBAY_SCOPES, options);
};

/**
 * Exchange authorization code for access token
 */
export const exchangeCodeForAccessToken = async (
  code: string,
  type: EnvironmentType,
  useClient: UseClientFlag
): Promise<EbayToken | null> => {
  try {
    const authInstance = getAuthInstance(type);
    if (!authInstance) {
      throw new Error(`eBay ${type} auth instance not initialized`);
    }

    const env = type === "production" ? EBAY_ENV.PRODUCTION : EBAY_ENV.SANDBOX;
    const token = await authInstance.exchangeCodeForAccessToken(env, code);
    const parsedToken: EbayToken = JSON.parse(token);

    // Store in DB
    await IntegrationTokenModel.updateOne(
      {
        provider: "ebay",
        environment: env,
        useClient: useClient === "true",
      },
      { $set: { ...parsedToken, generated_at: Date.now() } },
      { upsert: true }
    );

    return parsedToken;
  } catch (error) {
    console.error(`❌ Failed to exchange code for access token:`, error);
    return null;
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize eBay auth instances when module is loaded
initializeEbayAuthInstances();

// Export environment type for convenience
export const getCurrentEnvironment = (): EnvironmentType => {
  return getEnvironmentType(process.env.EBAY_TOKEN_ENV);
};
