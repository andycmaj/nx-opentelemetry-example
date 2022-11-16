import { AsyncExecutor } from '@graphql-tools/utils';
import { print } from 'graphql';
import { fetch } from 'cross-fetch';
import { BaseContext } from 'apollo-server-plugin-base';

// Builds a remote schema executor function,
// customize any way that you need (auth, headers, etc).
// Expects to receive an object with "document" and "variable" params,
// and asynchronously returns a JSON response from the remote.

/**
 * remote executor used to make introspection requests
 */
export const makeRemoteExecutorForIntrospection = (
  url: string
): AsyncExecutor => {
  const executor: AsyncExecutor = async ({ document, variables, context }) => {
    const query = typeof document === 'string' ? document : print(document);
    const fetchResult = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: service-to-service auth
        'x-valstro-api-admin-token': 'mysecretkey',
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await fetchResult.json();
    return json;
  };

  return executor;
};

/**
 * remote executor used to delegate requests to backend apis
 */
export const makeRemoteExecutorForGatewayRequests = (
  url: string
): AsyncExecutor => {
  const executor: AsyncExecutor<
    BaseContext & { user: { id: string } }
  > = async ({ document, variables, context }) => {
    const query = typeof document === 'string' ? document : print(document);
    const fetchResult = await fetch(url, {
      method: 'POST',
      headers: {
        ...(context.req?.headers ?? {}),
        'Content-Type': 'application/json',
        ...(context.userId && {
          // if no user exists, we're passing along the admin header otherwise
          'x-valstro-user-id': context.userId,
        }),
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await fetchResult.json();
    return json;
  };

  return executor;
};
