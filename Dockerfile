# Multi-stage Dockerfile for Collab Compiler Backend on Render

# Stage 1: Build JAR using Maven & Java 21
FROM maven:3.9.12-eclipse-temurin-21 AS builder

WORKDIR /app

# Configure Maven mirror (Google Maven Central mirror) to avoid HTTP 429 rate-limits on shared Render build IPs
RUN mkdir -p /root/.m2 && printf '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0">\n\
  <mirrors>\n\
    <mirror>\n\
      <id>google-maven-central</id>\n\
      <name>GCS Maven Central mirror</name>\n\
      <url>https://maven-central.storage-download.googleapis.com/maven2</url>\n\
      <mirrorOf>central</mirrorOf>\n\
    </mirror>\n\
  </mirrors>\n\
</settings>\n' > /root/.m2/settings.xml

# Copy pom.xml and source code
COPY Compiler/pom.xml ./pom.xml
COPY Compiler/src ./src

# Create application.properties if missing
RUN if [ ! -f src/main/resources/application.properties ]; then \
    cp src/main/resources/application.properties.example \
    src/main/resources/application.properties; \
    fi

# Package the application with reduced thread concurrency and HTTP retries
RUN mvn -B -Dmaven.artifact.threads=2 -Daether.transport.http.retryHandler.count=5 clean package -DskipTests

# Stage 2: Runtime environment with Java 21
FROM eclipse-temurin:21-jre-jammy

ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 20 LTS (Ubuntu Jammy default is v12, which is incompatible with tsx >= 18) and compilers
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    python3 \
    nodejs \
    golang-go \
    rustc \
    php-cli \
    ruby \
    bash \
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