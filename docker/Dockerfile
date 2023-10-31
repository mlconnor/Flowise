FROM node:18-alpine

USER root

RUN apk add --no-cache git
RUN apk add --no-cache python3 py3-pip make g++
# needed for pdfjs-dist
RUN apk add --no-cache build-base cairo-dev pango-dev

# issue breaking build - https://github.com/FlowiseAI/Flowise/pull/183
RUN apk add --update libc6-compat

# Install Chromium
RUN apk add --no-cache chromium

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# You can install a specific version like: flowise@1.0.0
#RUN npm install -g flowise

RUN git clone https://github.com/mlconnor/Flowise

WORKDIR /Flowise

# let's change the settings
RUN cp /Flowise/packages/server/.env.example /Flowise/packages/server/.env
# here we are going to establish an encryption key that is stable across builds
RUN sed -i 's/# FLOWISE_SECRETKEY_OVERWRITE=myencryptionkey/FLOWISE_SECRETKEY_OVERWRITE=stableencryptionkey/g' /Flowise/packages/server/.env

RUN yarn install

RUN NODE_OPTIONS="--max-old-space-size=8192" yarn build

CMD ["yarn", "start"]
