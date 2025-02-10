FROM node:alpine
ARG BUILD_DATE=0
ENV JAM_CONFIG_DIR=/jam-config
RUN mkdir /pantry
WORKDIR /pantry
COPY yarn.lock package.json /pantry/
RUN yarn
COPY . /pantry
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" /pantry/services/ws.js
# 20250210-hackfix-for-relay-reconnect-error
RUN sed -i "s/this\.connect();/this\.connect()\.catch(() => this\.#reconnect());/g" /pantry/node_modules/nostr-relaypool/relay.ts
EXPOSE 3001
CMD ["node", "./bin/www"]
