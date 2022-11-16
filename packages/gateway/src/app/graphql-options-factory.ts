import { ApolloDriverConfig } from '@nestjs/apollo';
import { Inject, Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { stitchSchemas } from '@graphql-tools/stitch';
import { GraphQLSchema } from 'graphql';
import {
  GatewayMetadata,
  getContextBuilder,
  SCHEMA_PROVIDERS_TOKEN,
  SubschemaProvider,
  workspaceRoot,
} from '@otel-nx/graphql';

@Injectable()
export class GatewayOptionsFactory implements GqlOptionsFactory {
  constructor(
    @Inject(SCHEMA_PROVIDERS_TOKEN)
    private readonly schemaProviders: SubschemaProvider[]
  ) {}

  async createGqlOptions(): Promise<ApolloDriverConfig> {
    return {
      debug: true,
      playground: true,
      introspection: true,
      installSubscriptionHandlers: true,
      typePaths: [`${workspaceRoot}/packages/gateway/src/graphql/*.graphql`],
      context: getContextBuilder<GatewayMetadata>(async (req) => {
        if ((req.headers['x-api-admin-token'] as string) === 'mysecretkey') {
          return { isBackendRequest: true };
        }

        // const token = await this.authenticator.verify(req);
        return { userId: '', isBackendRequest: false };
      }),
      transformSchema: async (schema: GraphQLSchema) => {
        let subSchemas;
        try {
          console.log('======', this.schemaProviders);
          const schemas = await Promise.all(
            this.schemaProviders.map((provider) => provider.getRemoteSchema())
          );

          // Schemas that failed to fetch will return null
          subSchemas = schemas.filter((schema) => schema !== null);

          console.log('======', subSchemas);
        } catch (e) {
          console.error(`Exception(s) fetching schemas from providers: `, e);
          throw e;
        }

        try {
          return stitchSchemas({
            subschemas: [
              ...subSchemas,
              {
                // 2. Incorporate a locally-executable subschema.
                // No need for a remote executor!
                // Note that that the gateway still proxies through
                // to this same underlying executable schema instance.
                schema,
              },
            ],
          });
        } catch (e) {
          console.error(`Exception stitching schemas: `, e);
          throw e;
        }
      },
    };
  }
}
