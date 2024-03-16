FROM node:alpine AS builder

COPY yarn.lock package.json ./

RUN yarn
COPY . .
ARG BUILD_DATE=0
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" ./views/About.jsx
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" ./views/EnterRoom.jsx
RUN yarn build

FROM node:alpine

ENV JAM_CONFIG_DIR=/jam-config

RUN mkdir /app
WORKDIR /app

COPY public ./public/
COPY server ./server/
COPY server-package.json package.json
COPY --from=builder /public/js ./public/js/
COPY --from=builder /public/css/tailwind.css ./public/css
RUN yarn

CMD node server/bin/www.js

EXPOSE 3000
