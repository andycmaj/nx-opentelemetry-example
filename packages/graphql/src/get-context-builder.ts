import { ExpressContext } from 'apollo-server-express';
import { getOperationAST, OperationDefinitionNode } from 'graphql';
import { gql } from 'apollo-server-express';

function isIntrospectionQuery(operation: OperationDefinitionNode) {
  return (
    operation.name?.value === 'IntrospectionQuery' &&
    operation.selectionSet.selections.every((selection) => {
      const fieldName = (selection as any).name.value as string; // e.g., `someField` or `__schema`
      return fieldName.startsWith('__');
    })
  );
}

export const getContextBuilder =
  <T>(builder: (req: ExpressContext['req']) => Promise<T>) =>
  ({ req }: ExpressContext): Promise<T> => {
    const { query } = req.body ?? {};

    const document = query && gql(query);
    const operation = document && getOperationAST(document);
    const isIntrospection = isIntrospectionQuery(
      operation as OperationDefinitionNode
    );
    if (isIntrospection) {
      // no user context needed for introspection
      return;
    }

    return builder(req);
  };
