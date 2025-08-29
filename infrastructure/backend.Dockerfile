FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/pyproject.toml ./backend/pyproject.toml
RUN python -m venv /opt/venv \
	&& /opt/venv/bin/pip install --upgrade pip \
	&& /opt/venv/bin/pip install -e ./backend

ENV PATH="/opt/venv/bin:$PATH"

COPY backend /app/backend
WORKDIR /app/backend

ENV DJANGO_SETTINGS_MODULE=shopitt.settings

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "shopitt.asgi:application"] 