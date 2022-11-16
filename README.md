# run dev mode

### backend api

```
OTEL_SERVICE_NAME=backend PORT=3334 pnpm nx run backend-api:serve
```

### gateway

```
OTEL_SERVICE_NAME=gateway pnpm nx run gateway:serve
```

# Production builds

### build all

```
pnpm nx build backend-api
pnpm nx build gateway
```

### run backend-api

```
cd dist/packages
OTEL_SERVICE_NAME=backend PORT=3334 node --require ./tracing/src/index.js backend-api/main.js
```

### run gateway

```
cd dist/packages
OTEL_SERVICE_NAME=gateway node --require ./tracing/src/index.js gateway/main.js
```

# testing in http://localhost:3333/graphql

### graphql

```graphql
{
  users {
    id
    name
  }
}
```

### headers

```json
{
  "x-api-admin-token": "mysecretkey"
}
```
