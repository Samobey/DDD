FROM node:21-alpine

WORKDIR /app

# Copy everything (not just package.json)
COPY . .

RUN npm install

EXPOSE 3000
CMD ["node", "index.js"]
