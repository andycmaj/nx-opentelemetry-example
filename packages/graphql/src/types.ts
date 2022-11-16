/**
 * metadata passed along from the API Gateway
 * to backend APIs via SubschemaProvider's
 * remote executor implementation
 */
export interface GatewayMetadata {
  /**
   * If request is coming from the UI, the Gateway will authenticate and then
   * pass along the current user's id.
   */
  userId?: string;

  // TODO: does this make sense? or should we just check something like
  // userId != null || apiToken != null
  isBackendRequest: boolean;
}
