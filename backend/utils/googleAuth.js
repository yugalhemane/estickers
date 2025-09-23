// Google OAuth is optional - will be imported only when needed
let OAuth2Client;
let client;

// Ensure fetch exists in Node (<18 doesn't have global fetch)
const ensureFetch = async () => {
  if (typeof fetch === "undefined") {
    const { default: nodeFetch } = await import("node-fetch");
    // Attach to global for downstream usage
    globalThis.fetch = nodeFetch;
  }
};

// Function to initialize Google OAuth client
const initGoogleAuth = async () => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error("Google OAuth not configured");
    }

    const { OAuth2Client: GoogleOAuth2Client } = await import(
      "google-auth-library"
    );
    OAuth2Client = GoogleOAuth2Client;
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    return true;
  } catch (error) {
    console.warn("Google OAuth not available:", error.message);
    return false;
  }
};

/**
 * Verify Google OAuth token and extract user information
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} Verified user data from Google
 */
export const verifyGoogleToken = async (idToken) => {
  try {
    // Initialize Google Auth if not already done
    const isInitialized = await initGoogleAuth();
    if (!isInitialized) {
      throw new Error("Google OAuth not configured or available");
    }

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid Google token payload");
    }

    // Extract verified user data
    const userData = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      profilePicture: payload.picture,
      emailVerified: payload.email_verified,
    };

    // Verify email is verified by Google
    if (!userData.emailVerified) {
      throw new Error("Google email not verified");
    }

    return userData;
  } catch (error) {
    console.error("Google token verification failed:", error.message);
    throw new Error("Invalid Google authentication token");
  }
};

/**
 * Alternative method: Verify using Google's userinfo endpoint
 * @param {string} accessToken - Google access token
 * @returns {Object} User data from Google
 */
export const verifyGoogleAccessToken = async (accessToken) => {
  try {
    await ensureFetch();
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch user info from Google (HTTP ${response.status}) ${errorText}`
      );
    }

    const userData = await response.json();

    if (!userData.verified_email) {
      throw new Error("Google email not verified");
    }

    return {
      googleId: userData.id,
      email: userData.email,
      name: userData.name,
      profilePicture: userData.picture,
      emailVerified: userData.verified_email,
    };
  } catch (error) {
    console.error("Google access token verification failed:", error.message);
    throw new Error(error.message || "Invalid Google access token");
  }
};
