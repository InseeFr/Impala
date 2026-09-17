### BUILD STEP ###

FROM node:latest AS builder

WORKDIR /impala

COPY ./ ./

# pnpm est epingle sur une majeure : sans cela le build d'image suit la derniere
# version publiee et peut casser sans qu'aucun fichier du depot n'ait bouge.
# pnpm 11 verifie l'integralite du lockfile contre les politiques de
# pnpm-workspace.yaml, ce que pnpm 10 ne fait pas.
RUN npm i -g npm pnpm@11
RUN pnpm install --config.dangerouslyAllowAllBuilds=true && pnpm build

### EXECUTION STEP ###

FROM nginxinc/nginx-unprivileged:stable-alpine

# SPARQL endpoint, overridable at runtime (docker run -e RDF4J_API_URI=...)
# Endpoint SPARQL, surchargeable au demarrage du conteneur
ENV RDF4J_API_URI=https://api-rmes-cache.insee.fr/sparql

# Non root user (deja provisionne par l'image nginx-unprivileged)
ENV NGINX_USER_ID=101
ENV NGINX_GROUP_ID=101
ENV NGINX_USER=nginx
ENV NGINX_GROUP=nginx

# Rewrite rules. Installed as a template: the nginx entrypoint substitutes
# ${RDF4J_API_URI} at startup, then writes the result to conf.d/default.conf.
# Regles de reecriture, avec substitution de ${RDF4J_API_URI} au demarrage
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Add build to nginx root webapp
COPY --from=builder --chown=$NGINX_USER:$NGINX_GROUP /impala/build/ /usr/share/nginx/html/

USER $NGINX_USER_ID

EXPOSE 8080
