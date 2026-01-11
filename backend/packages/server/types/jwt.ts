export interface JWTPayload {
  userName: string;
  aud?: string; // audience (user ID)
  iss?: string; // issuer
  exp?: number; // expiration time
}

export interface TokenVerificationResult {
  userId: string;
  userName: string;
}
