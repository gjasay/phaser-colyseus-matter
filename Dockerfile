FROM alpine:3.21
ARG VITE_GAME_SERVER

WORKDIR /app

RUN apk update && apk add --no-cache bash curl libstdc++

SHELL ["/bin/bash", "-c"]

RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"

COPY . .

RUN bun i && bun run build

CMD ["bun", "run", "production"]
