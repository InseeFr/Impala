FROM node:20 as build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build


FROM nginx
RUN rm etc/nginx/conf.d/default.conf
COPY conf/nginx.conf etc/nginx/conf.d/
COPY --from=build /app/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
