import { getSchemaRoot, SubschemaProvider } from '@otel-nx/graphql';

export class BackendApiSubschemaProvider extends SubschemaProvider {
  constructor() {
    super('backend-api');
  }

  getSchemaFilePaths() {
    return Promise.resolve([`${getSchemaRoot('backend-api')}/schema.graphql`]);
  }
}
