# Impala

Impala is a module of Insee's Statistical Metadata Repository (RMéS). It exposes linked metadata on web pages and through a SPARQL editor based on [Yasgui](https://triply.cc/docs/yasgui-api).

## Getting Started

### Development

The application is written in TypeScript (`src/*.ts`, `src/*.tsx`); the Node
scripts (`create-zip.ts`, `tests/docker/sparql-mock.ts`) are run directly by
Node, which strips the type annotations at load time (Node >= 22.18).

* Type check the whole project (tsc)

```shell
pnpm typecheck
```

* Run Linting (oxlint)

```shell
pnpm lint
```

* Auto-fix linting issues

```shell
pnpm lint:fix
```

### Configuration

The SPARQL endpoint used by the editor and the `DESCRIBE` prefix applied to
`id.insee.fr` links are read from Vite environment variables at build time:

| Variable                     | Declared in `.env`                           |
| ---------------------------- | -------------------------------------------- |
| `VITE_SPARQL_ENDPOINT`       | `http://rdf.insee.fr/sparql`                 |
| `VITE_SPARQL_PREFIX`         | `https://rdf.insee.fr/sparql?query=DESCRIBE` |
| `VITE_INSEE_SPARQL_ENDPOINT` | `http://rdf.insee.fr/sparql`                 |

`VITE_INSEE_SPARQL_ENDPOINT` is a comparison value, not a target: `id.insee.fr`
links are rewritten to a `DESCRIBE` query only when `VITE_SPARQL_ENDPOINT`
points somewhere else. Leave it alone.

Override the others in a `.env.local` file or on the command line, then rebuild:

```shell
VITE_SPARQL_ENDPOINT=http://example.org/sparql pnpm build
```

### Testing

* Run Unit Tests (Vitest)

```shell
pnpm test
```

* Run UI Tests (Playwright)

```shell
npx playwright test
```

* Run Rewrite Rules Tests (Playwright, against the Docker image)

```shell
pnpm test:docker
```

These tests build the Docker image, start it next to a fake SPARQL endpoint
(`tests/docker/compose.yaml`) and check every rewrite rule of
`nginx.conf.template`: status codes, `Location` headers and which requests are
proxied. No network access to the production endpoint is needed.

### Docker

The image serves the application with nginx. All the routing (SPARQL proxying,
dereferencing, headers) lives in `nginx.conf.template`, installed as an nginx
template so that the SPARQL endpoint it proxies to can be changed without
rebuilding the image:

```shell
docker run -p 8080:8080 -e RDF4J_API_URI=https://api-rmes-cache.insee.fr/sparql inseefr/impala
```
