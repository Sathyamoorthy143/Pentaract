############################################################################################
####  SERVER
############################################################################################

# Using the `rust-musl-builder` as base image, instead of 
# the official Rust toolchain
FROM rust:alpine AS chef
USER root
RUN apk update && apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconfig
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY ./pentaract .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder 
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY ./pentaract .
RUN cargo build --release

############################################################################################
####  UI
############################################################################################

FROM node:21-slim AS ui
WORKDIR /app
COPY ./ui .
RUN npm install
ENV VITE_API_BASE /api
RUN npm run build

############################################################################################
####  RUNNING
############################################################################################

# We do not need the Rust toolchain to run the binary!
FROM scratch AS runtime
COPY --from=builder /app/target/release/pentaract /
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=ui /app/dist /ui
ENTRYPOINT ["/pentaract"]
