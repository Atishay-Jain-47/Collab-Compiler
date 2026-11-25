# Multi-stage Dockerfile for Collab Compiler Backend on Render

# Stage 1: Build JAR using Maven & Java 21
FROM maven:3.9.12-eclipse-temurin-21 AS builder

WORKDIR /app

# Download and cache dependencies
COPY Compiler/pom.xml ./pom.xml
RUN mvn -B dependency:go-offline

# Copy source code
COPY Compiler/src ./src

# Create application.properties if missing
RUN if [ ! -f src/main/resources/application.properties ]; then \
    cp src/main/resources/application.properties.example \
    src/main/resources/application.properties; \
    fi

# Package the application
RUN mvn -B clean package -DskipTests

# Stage 2: Runtime environment with Java 21
FROM eclipse-temurin:21-jre-jammy

ENV DEBIAN_FRONTEND=noninteractive

# Install compilers and language runtimes
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

# Render assigns port dynamically
ENV PORT=8082
EXPOSE 8082

# Start Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]