export class HealthResponseDto {
  ready!: boolean;
  mode!: 'disabled' | 'configured';
  apiBaseUrl!: string;
  rpApiPrefix!: string;
  frontendBaseUrl!: string;
  requestTimeoutMs!: number;
  collectIntervalMs!: number;
  qrRefreshIntervalMs!: number;
  orderTtlSeconds!: number;
  mtls!: {
    certificateLoaded: boolean;
    caLoaded: boolean;
  };
  orderStore!: {
    activeOrders: number;
  };
}
