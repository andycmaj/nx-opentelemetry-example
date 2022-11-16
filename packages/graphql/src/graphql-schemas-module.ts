import { DynamicModule } from '@nestjs/common';
import { SubschemaProvider } from './subschema-provider';

export const SCHEMA_PROVIDERS_TOKEN = 'SCHEMA_PROVIDERS';

/**
 * Registers a set of SubschemaProviders in DI using
 * a DI TOKEN
 */
export class GraphqlSchemasModule {
  static register(providers: SubschemaProvider[]): DynamicModule {
    return {
      module: GraphqlSchemasModule,
      providers: [
        {
          provide: SCHEMA_PROVIDERS_TOKEN,
          useValue: providers,
        },
      ],
      exports: [SCHEMA_PROVIDERS_TOKEN],
    };
  }
}
