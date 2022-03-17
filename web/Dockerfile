FROM node:16-alpine
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12

# Assumes your function is named "app.js", and there is a package.json file in the app directory 
COPY package.json ./

# Install NPM dependencies for function
RUN yarn install
COPY ./dist/ ./

CMD ["node", "main.js"]