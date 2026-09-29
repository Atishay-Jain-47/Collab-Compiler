# Multi-stage Dockerfile for Collab Compiler Backend on Render
# Stage 1: Build JAR using Maven & Java 21
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app
COPY Compiler/.mvn/ .mvn/
COPY Compiler/mvnw Compiler/pom.xml ./
RUN chmod +x ./mvnw
# Download dependencies
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and application.properties.example into place if application.properties is missing
COPY Compiler/src ./src
RUN if [ ! -f src/main/resources/application.properties ]; then cp src/main/resources/application.properties.example src/main/resources/application.properties; fi

# Package the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime environment with Java 21 + all compilers & language runtimes
FROM eclipse-temurin:21-jre-jammy

ENV DEBIAN_FRONTEND=noninteractive

# Install essential compilers and language runtimes: GCC, G++, Python3, Node.js, npm, Go, Rust, PHP, Ruby, Bash, curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    python3 \
    nodejs \
    npm \
    golang-go \
    rustc \
    php-cli \
    ruby \
    bash \
    ca-certificates \
    curl \
    && npm install -g tsx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create application user and directories
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /tmp/compiler && \
    chown -R appuser:appuser /app /tmp/compiler

WORKDIR /app
USER appuser

# Copy built JAR from builder stage
COPY --from=builder --chown=appuser:appuser /app/target/*.jar app.jar

# Render assigns port dynamically via $PORT
ENV PORT=8082
EXPOSE 8082

# Start Spring Boot application
ENTRYPOINT ["sh", "-c", "java -jar -Dserver.port=${PORT} app.jar"]
