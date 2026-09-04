# Impala

Impala is a module of Insee's Statistical Metadata Repository (RMéS). It exposes linked metadata on web pages and through a SPARQL editor based on [Yasgui](https://triply.cc/docs/yasgui-api).

## Getting Started

### Development

* Run Linting (oxlint)

```shell
pnpm lint
```

* Auto-fix linting issues

```shell
pnpm lint:fix
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
