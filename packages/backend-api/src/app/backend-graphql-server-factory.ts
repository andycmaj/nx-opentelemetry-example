import { ApolloDriverConfig } from '@nestjs/apollo';
import { Inject, Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import {
  GatewayMetadata,
  getContextBuilder,
  SCHEMA_PROVIDERS_TOKEN,
  SubschemaProvider,
} from '@otel-nx/graphql';
import { flatten } from 'lodash';

@Injectable()
export class BackendGraphqlServerFactory implements GqlOptionsFactory {
  constructor(
    @Inject(SCHEMA_PROVIDERS_TOKEN)
    private readonly schemaProviders: SubschemaProvider[]
  ) {}

  async createGqlOptions(): Promise<ApolloDriverConfig> {
    const typePaths = await Promise.all(
      this.schemaProviders.map((provider) => provider.getSchemaFilePaths())
    );

    return {
      debug: false,
      introspection: true, // All stitched services must have introspection enabled
      typePaths: flatten(typePaths),
      installSubscriptionHandlers: false,
      persistedQueries: false,
      context: getContextBuilder<GatewayMetadata>((req) => {
        if ((req.headers['x-api-admin-token'] as string) === 'mysecretkey') {
          return Promise.resolve({ isBackendRequest: true });
        }

        const userId: string = req.headers['x-user-id'] as string;
        if (!userId) {
          throw new Error('Unable to get userId from x-user-id header');
        }

        return Promise.resolve({ userId, isBackendRequest: false });
      }),
      playground: {
        settings: {
          'schema.polling.enable': true,
          'schema.polling.interval': 60000,
        },
      },
    };
  }
}
