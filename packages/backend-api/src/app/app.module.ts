import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlSchemasModule } from '@otel-nx/graphql';
import { BackendGraphqlServerFactory } from './backend-graphql-server-factory';

import { BackendApiSubschemaProvider } from '@otel-nx/subschema-providers';
import { UsersResolver } from './resolver';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [
        GraphqlSchemasModule.register([new BackendApiSubschemaProvider()]),
      ],
      useClass: BackendGraphqlServerFactory,
    }),
  ],
  controllers: [],
  providers: [UsersResolver],
})
export class AppModule {}
