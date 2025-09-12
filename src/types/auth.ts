interface TokenData {
  token: string;
  user_id: string;
  expires_at: string;
}

export interface CacheUser {
  access_token: TokenData;
}