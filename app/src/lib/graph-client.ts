import { Client } from "@microsoft/microsoft-graph-client";

/**
 * Create an authenticated Microsoft Graph client.
 */
export function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
