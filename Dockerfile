FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 5173
CMD ["pnpm", "start", "--host", "0.0.0.0"]
