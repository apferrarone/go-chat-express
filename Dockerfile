FROM node:8-alpine

# Install global dependencies
RUN npm install -g pm2

# Copy package.json, change working directory
# Use wildcard so both package.json AND package-lock.json are copied
RUN mkdir -p /go-chat-api
COPY package*.json /go-chat-api/
WORKDIR /go-chat-api

# Install app dependencies before copying
RUN npm install --only=production && \
    npm cache clean --force

# Bundle app source and build assets
COPY . /go-chat-api

# Open the server port
EXPOSE 3001

# Run the server under pm2
CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
