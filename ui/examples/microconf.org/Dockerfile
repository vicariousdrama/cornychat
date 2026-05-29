FROM node:latest AS build
WORKDIR /build

COPY package.json package.json
# COPY yarn.lock yarn.lock
RUN npm install --global yarn@1.22.22
RUN yarn

COPY public/ public
COPY src/ src
COPY vite.config.js vite.config.js
COPY index.html index.html
RUN yarn build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/ /usr/share/nginx/html
