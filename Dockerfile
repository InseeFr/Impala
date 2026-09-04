### BUILD STEP ###

FROM node:latest AS builder

WORKDIR /impala

COPY ./ ./

RUN npm i -g npm pnpm
RUN pnpm install --config.dangerouslyAllowAllBuilds=true && pnpm build

### EXECUTION STEP ###

FROM httpd:2.4-alpine

# Non root user
ENV HTTPD_USER_ID=101
ENV HTTPD_GROUP_ID=101
ENV HTTPD_USER=impala
ENV HTTPD_GROUP=impala

RUN addgroup -g $HTTPD_GROUP_ID -S $HTTPD_GROUP \
    && adduser -u $HTTPD_USER_ID -S -G $HTTPD_GROUP $HTTPD_USER

# Copy apache configuration (loads mod_rewrite/mod_proxy/mod_headers and the rewrite rules)
# Copier la configuration Apache
COPY httpd.conf /usr/local/apache2/conf/httpd.conf

# Add build to apache root webapp
COPY --from=builder --chown=$HTTPD_USER:$HTTPD_GROUP /impala/build/ /usr/local/apache2/htdocs/

# Rewrite rules, loaded at server level (see Include in httpd.conf)
# Regles de reecriture, chargees en contexte serveur (voir Include dans httpd.conf)
COPY .htaccess /usr/local/apache2/conf/impala-rewrite.conf

USER $HTTPD_USER_ID

EXPOSE 8080

CMD ["httpd-foreground"]
