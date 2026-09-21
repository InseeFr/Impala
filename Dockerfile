### BUILD STEP ###

FROM node:24.21.0 AS builder

WORKDIR /impala

COPY ./ ./

# pnpm aligne sur la version de la CI, declaree dans l'action setup-front du
# commons : sans epinglage, le build d'image suivrait la derniere version
# publiee et pourrait casser sans qu'aucun fichier du depot n'ait bouge.
# `--frozen-lockfile` : l'image resout exactement ce que la CI a valide, ou elle
# echoue — plutot que de deriver en silence.
RUN npm i -g pnpm@12 \
    && pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true \
    && pnpm build

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
