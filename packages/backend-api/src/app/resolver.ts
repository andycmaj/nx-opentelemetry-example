import { Query, Resolver } from '@nestjs/graphql';

interface User {
  id: string;
  name: string;
}

@Resolver()
export class UsersResolver {
  @Query()
  async users(): Promise<User[]> {
    return [{ id: 'asdfasdf', name: 'andy' }];
  }
}
