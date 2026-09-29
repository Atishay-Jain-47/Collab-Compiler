# Multi-language sandboxed runner image for CollabIDE
FROM debian:bookworm-slim

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential compilers and runtimes: GCC, G++, Python 3, Node.js, npm, OpenJDK, Golang, Rust, PHP, Ruby
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    python3 \
    nodejs \
    npm \
    openjdk-17-jdk-headless \
    golang-go \
    rustc \
    php-cli \
    ruby \
    ca-certificates \
    && npm install -g tsx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root runner user with restricted privileges
RUN groupadd -g 1001 runner && \
    useradd -u 1001 -g runner -m -s /bin/bash runner

# Set up working directory
WORKDIR /workspace
RUN chown -R runner:runner /workspace

# Switch to unprivileged user
USER runner

CMD ["/bin/bash"]
