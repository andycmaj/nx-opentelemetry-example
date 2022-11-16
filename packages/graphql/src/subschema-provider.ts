import { SubschemaConfig } from '@graphql-tools/delegate';
import { introspectSchema } from '@graphql-tools/wrap';
import { readFileSync } from 'fs';
import { makeExecutableSchema } from '@graphql-tools/schema';
import {
  EntrypointModuleConfig,
  EntrypointsConfig,
  getEntrypointsConfig,
} from './entrypoints';
import polly from 'polly-js';
import {
  makeRemoteExecutorForIntrospection,
  makeRemoteExecutorForGatewayRequests,
} from './remote-executors';
import { flatten } from 'lodash';

/**
 * defines a graphql schema provider for a stitched backend module.
 * needs to provide a way to statically get a schema from an SDL file,
 * for local development workflows, as well as provide a remote
 * executor for getting a live schema from a running graphql server,
 * for live, deployed environments.
 */
export abstract class SubschemaProvider {
  private readonly entrypoint: EntrypointModuleConfig;

  constructor(readonly name: string) {
    const entrypointConfig: EntrypointsConfig = getEntrypointsConfig();
    this.entrypoint = entrypointConfig[name];
  }

  /**
   * return an array of workspace- or cwd-relative paths to schema files
   * provided by your entrypoint
   *
   * see `getSchemaRoot` to find runtime/dist-agnostic relative paths
   */
  abstract getSchemaFilePaths(): Promise<string[]>;

  /**
   * return a statically-generated schema from the schema file
   * referenced by `this.getSchemaFilePath()`
   */
  async getStaticSchema(): Promise<SubschemaConfig> {
    const schemaFiles = flatten(await this.getSchemaFilePaths()).map(
      (filePath) => readFileSync(filePath).toString()
    );

    return {
      schema: makeExecutableSchema({
        typeDefs: schemaFiles,
      }),
    };
  }

  getGraphqlHost(): string {
    if (process.env.ENVIRONMENT === 'local') {
      return `http://localhost:${this.entrypoint.port ?? 80}`;
    } else {
      // Kubernetes service with same name as this entrypoint module
      return `http://${this.name}`;
    }
  }

  /**
   * return a dynamically-generated schema that is the result of
   * doing remote introspection against a live graphql server's
   * introspect endpoint
   */
  async getRemoteSchema(): Promise<SubschemaConfig> {
    const schemaUrl = `${this.getGraphqlHost()}/graphql`;

    // TODO: service-to-service auth
    const adminContext = {
      authHeader: 'myadminsecretkey',
    };

    // some amount of resilience/tolerance when we try to get schemas from backends
    const introspectionExecutor = makeRemoteExecutorForIntrospection(schemaUrl);
    const introspectSchemaWithRetry = () =>
      polly()
        .handle(
          (err) => err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET'
        )
        // retry delays in ms
        .waitAndRetry([1000, 5000, 10000, 30000, 60000])
        .executeForPromise((info) => {
          console.log(
            `connecting to backend ${this.name}... tries: ${info.count}`
          );
          return introspectSchema(introspectionExecutor, adminContext);
        });

    try {
      const schema = await introspectSchemaWithRetry();
      console.log(`successfully connected to backend ${this.name}!`);
      return {
        // 1. Introspect a remote schema. Simple, but there are caveats:
        // - Remote server must enable introspection.
        // - Custom directives are not included in introspection.
        schema,
        executor: makeRemoteExecutorForGatewayRequests(schemaUrl),
      };
    } catch (e) {
      console.error(`exception connecting to backend ${this.name}`, e);
      if (process.env.FEATUREFLAG_ALLOW_FAILED_SCHEMA_FETCH !== 'true') {
        throw e;
      }
      return null;
    }
  }
}
