export interface InterruptRequest {
  userId: string;
  origin: string;
  details: string;
  success?: boolean;
  timestamp?: string;
}
