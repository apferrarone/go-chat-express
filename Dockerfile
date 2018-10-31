FROM node:8

# Install global dependencies
RUN npm install -g pm2

# Copy package.json, change working directory
RUN mkdir -p /go-chat-api
COPY ./package.json /go-chat-api/
WORKDIR /go-chat-api

# Install app dependencies
RUN npm install --production

# Bundle app source and build assets
COPY . /go-chat-api

# Open the server port
EXPOSE 3001

# Run the server under pm2
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
