import { statSync, PathLike } from 'fs';
import * as path from 'path';

/**
 * Check if a file exists.
 * @param path Path to file
 */
export function fileExists(path: PathLike): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * The root of the workspace
 * lifted from https://github.com/nrwl/nx/blob/9f83207b5de4c322813d4bb34d95395442634a43/packages/nx/src/utils/workspace-root.ts
 * because importing this lib into a runtime app causes some webpack terser problems
 */
export const workspaceRoot = workspaceRootInner(process.cwd(), process.cwd());

export function workspaceRootInner(
  dir: string,
  candidateRoot: string | null
): string {
  if (process.env.NX_WORKSPACE_ROOT_PATH)
    return process.env.NX_WORKSPACE_ROOT_PATH;
  if (path.dirname(dir) === dir) return candidateRoot;
  if (fileExists(path.join(dir, 'nx.json'))) {
    return dir;
  } else if (fileExists(path.join(dir, 'node_modules', 'nx', 'package.json'))) {
    return workspaceRootInner(path.dirname(dir), dir);
  } else {
    return workspaceRootInner(path.dirname(dir), candidateRoot);
  }
}

/**
 * gets a schema directory path to the src graphql for local
 * or the dist graphql directory if deployed
 *
 * local: ~/libs/backend/entrypoint-modules/{entrypoint_name}/src/graphql
 * deployed: ~/graphql/{entrypoint_name}
 *
 * where ~ is the workspaceRoot for local and app/dist for deployed
 *
 * @param entrypointName project name/directory name for this entrypoint module
 */
export const getSchemaRoot = (entrypointName: string) =>
  workspaceRoot === '/app/dist'
    ? // this is the root for deployments
      `${workspaceRoot}/graphql/${entrypointName}`
    : `${workspaceRoot}/packages/${entrypointName}/src/graphql`;

/**
 * gets a local schema path for non-entrypoint apps (Java or Benthos etc)
 *
 * local: ~/apps/services/{appName}/graphql
 *
 * where ~ is the workspaceRoot for local
 *
 * @param appName project name/directory name for this non-entrypoint app
 */
export const getAppSchemaRoot = (appName: string) =>
  `${workspaceRoot}/apps/services/${appName}/graphql`;

export const getEntrypointsConfigFile = () =>
  `${workspaceRoot}/.entrypoints.json`;
