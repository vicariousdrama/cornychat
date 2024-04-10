FROM node:alpine
ARG BUILD_DATE=0
ENV JAM_CONFIG_DIR=/jam-config
RUN mkdir /pantry
WORKDIR /pantry
COPY yarn.lock package.json /pantry/
RUN yarn
COPY . /pantry
RUN sed -i "s/BUILD_DATE/${BUILD_DATE}/g" /pantry/services/ws.js
EXPOSE 3001
CMD node ./bin/www
