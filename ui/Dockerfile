FROM node:alpine AS builder
ARG BUILD_DATE=0

COPY yarn.lock package.json ./

RUN yarn
COPY . .
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" ./pages/About.jsx
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" ./views/EnterRoom.jsx
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" ./lib/signalws.js
RUN yarn build

FROM node:alpine
ARG BUILD_DATE=0
ENV JAM_CONFIG_DIR=/jam-config

RUN mkdir /app
WORKDIR /app

COPY public ./public/
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" ./public/builddate.js
COPY server ./server/
COPY server-package.json package.json
COPY --from=builder /public/js ./public/js/
COPY --from=builder /public/css/tailwind.css ./public/css
RUN yarn

CMD ["node", "server/bin/www.js"]

EXPOSE 3000
