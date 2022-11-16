# run dev mode

### set `ENVIRONMENT`
... so that we use `require()` based bootstrap in dev mode

```
export ENVIRONMENT=local
```

### backend api

```
OTEL_SERVICE_NAME=backend PORT=3334 pnpm nx run backend-api:serve
```

### gateway

```
OTEL_SERVICE_NAME=gateway pnpm nx run gateway:serve
```

# Production builds

### set `ENVIRONMENT=prod`
... so that we DON'T use `require()`-based bootstrap.

```
export ENVIRONMENT=prod
```

### build all

```
pnpm nx build backend-api
pnpm nx build gateway
```

### rimraf root node_modules

... to ensure we aren't accidentally using dev-time node modules.

```
rm -rf node_modules
```

### run backend-api

```
cd dist/packages
cp ./backend-api/package.json .
npm install
OTEL_SERVICE_NAME=backend PORT=3334 node --require ./tracing/src/index.js backend-api/main.js
```

### run gateway

```
cd dist/packages
cp ./gateway/package.json .
npm install
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
