FROM node:alpine
ARG BUILD_DATE=0
ENV JAM_CONFIG_DIR=/jam-config
RUN mkdir /pantry
WORKDIR /pantry
COPY yarn.lock package.json /pantry/
RUN yarn
COPY . /pantry
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" /pantry/services/ws.js
# 20250210-hackfix-for-relay-reconnect-error     30a290c 2024-02-02
RUN sed -i "s/this\.connect();/this\.connect()\.catch(() => this\.#reconnect());/g" /pantry/node_modules/nostr-relaypool/relay.ts
# 20251107-hackfix-for-relay-send-error
#RUN sed -i "s/this\.ws\?\.send(msg);/try{this\.ws\?\.send(msg);}catch(err){console\.log('error sending to relay. dropping')}/g" /pantry/node_modules/nostr-relaypool/relay.ts
RUN sed -i "s/this.ws?.send(msg);/try{this.ws?.send(msg);}catch(err){console.log('error sending to relay. dropping')}/g" /pantry/node_modules/nostr-relaypool/relay.ts

# 20250605-hackfix-for-order-of-onerror-params   7df2acd 2024-02-02
#RUN sed -i "s/relayPool\.onerror((err, relayUrl) => {/relayPool\.onerror((relayUrl, err) => {/g" /pantry/node_modules/nostr-relaypool/relay-pool.worker.ts
EXPOSE 3001
CMD ["node", "./bin/www"]
