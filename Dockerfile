### BUILD STEP ###

FROM node:latest AS builder

WORKDIR /impala

COPY ./ ./

RUN yarn && yarn build

### EXECUTION STEP ###

FROM nginxinc/nginx-unprivileged:1.27-alpine

# Non root user
ENV NGINX_USER_ID=101
ENV NGINX_GROUP_ID=101
ENV NGINX_USER=nginx
ENV NGINX_GROUP=nginx

USER $NGINX_USER_ID

# Add build to nginx root webapp
COPY --from=builder --chown=$NGINX_USER:$NGINX_GROUP /impala/build /usr/share/nginx/html

# Copy nginx configuration
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=$NGINX_USER:$NGINX_GROUP /impala/nginx.conf /etc/nginx/conf.d/nginx.conf

# Strart nginx server
CMD ["nginx", "-g", "daemon off;"]
