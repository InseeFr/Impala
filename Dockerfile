# Étape de construction
FROM node:latest as builder

WORKDIR /impala

COPY ./ ./

RUN npm install --force

RUN npm run build

# Étape d'exécution
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Non root user
ENV NGINX_USER_ID=101
ENV NGINX_GROUP_ID=101
ENV NGINX_USER=nginx
ENV NGINX_GROUP=nginx

USER $NGINX_USER_ID

# Ajout du build au dossier root de nginx
COPY --from=builder --chown=$NGINX_USER:$NGINX_GROUP /impala/build /usr/share/nginx/html

# Copie de la configuration nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=$NGINX_USER:$NGINX_GROUP /impala/config/nginx.conf /etc/nginx/conf.d/nginx.conf


CMD ["nginx", "-g", "daemon off;"]
