# Use an official Node.js runtime as a parent image
FROM node:16.13.0

# Set the working directory in the container
WORKDIR /app

# Copy only the package.json and package-lock.json files to the container
COPY package*.json ./

# Install production dependencies using npm ci
RUN npm ci --only=development

# Copy the rest of the application code to the container
COPY . .

# Expose the port that your Node.js application listens on
EXPOSE 2000

# Define the command to run your Node.js application
CMD [ "npm", "start" ]
