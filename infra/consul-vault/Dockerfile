FROM hashicorp/vault:1.14.0

USER root

RUN apk --no-cache add ca-certificates jq zip curl \
    && update-ca-certificates \
    && rm -rf /var/cache/apk/*

COPY ./certs/* /vault/certs/

RUN cat /vault/certs/consul-ca.pem >> /etc/ssl/certs/ca-certificates.crt \
    && cat /vault/certs/vault-ca.pem >> /etc/ssl/certs/ca-certificates.crt
