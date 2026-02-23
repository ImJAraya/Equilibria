# Base de Dev Containers para Python
FROM mcr.microsoft.com/devcontainers/python:0-3.10

# (Opcional) si te estaba fallando por el repo de Yarn
RUN rm -f /etc/apt/sources.list.d/yarn.list || true

# Paquetes útiles (incluye cliente de postgres)
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
  && apt-get -y install --no-install-recommends postgresql-client \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*