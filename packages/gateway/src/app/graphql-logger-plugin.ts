import { Plugin } from '@nestjs/apollo';
import { trace } from '@opentelemetry/api';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
  GraphQLRequestContext,
} from 'apollo-server-plugin-base';

@Plugin()
export class GraphQLLogger implements ApolloServerPlugin {
  async requestDidStart(
    startCtx: GraphQLRequestContext
  ): Promise<GraphQLRequestListener> {
    return {
      async willSendResponse(): Promise<void> {
        console.log(startCtx.operationName);
        console.log('ACTIVE SPAN', trace.getActiveSpan());
      },
    };
  }
}
