import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlSchemasModule, SubschemaProvider } from '@otel-nx/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayOptionsFactory } from './graphql-options-factory';

import { BackendApiSubschemaProvider } from '@otel-nx/subschema-providers';
import { GraphQLLogger } from './graphql-logger-plugin';

const schemaProviders: SubschemaProvider[] = [
  new BackendApiSubschemaProvider(),
];

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [GraphqlSchemasModule.register(schemaProviders)],
      useClass: GatewayOptionsFactory,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, GraphQLLogger],
})
export class AppModule {}
