export interface SpotifyAuthRequest {
  code: string;
}

export interface SpotifyTokenRequest {
  code: string;
}

export interface SpotifyRefreshRequest {
  refreshToken: string;
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

// export enum TokenType {
//   AUTHORIZATION = 0,
//   ACCESS = 1,
//   REFRESH = 2
// }
