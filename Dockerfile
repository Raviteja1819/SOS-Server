FROM mysql:latest
COPY ./my.cnf /etc/mysql/my.cnf

# Use an official Node.js runtime as a parent image
FROM node:lts-slim

# Set the working directory in the container
WORKDIR /SOS-server/sample.js

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm rebuild bcrypt

# Copy the rest of your application code to the working directory
COPY . .

# Make the port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your application
CMD ["node", "sample.js"]

