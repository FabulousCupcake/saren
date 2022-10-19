FROM ubuntu:latest as main
WORKDIR /app
COPY . .

RUN apt update && apt install -y --no-install-recommends \
  ca-certificates curl unzip

RUN curl -fsSL https://bun.sh/install | bash && mv /root/.bun/bin/bun /bin/bun
#ENV PATH="${PATH}:/root/.bun/bin"

RUN bun install --no-save
RUN bun run start
