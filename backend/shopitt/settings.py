import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
	"django.contrib.admin",
	"django.contrib.auth",
	"django.contrib.contenttypes",
	"django.contrib.sessions",
	"django.contrib.messages",
	"django.contrib.staticfiles",
	"rest_framework",
	"channels",
	"core",
]

MIDDLEWARE = [
	"django.middleware.security.SecurityMiddleware",
	"django.contrib.sessions.middleware.SessionMiddleware",
	"django.middleware.common.CommonMiddleware",
	"django.middleware.csrf.CsrfViewMiddleware",
	"django.contrib.auth.middleware.AuthenticationMiddleware",
	"django.contrib.messages.middleware.MessageMiddleware",
	"django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "shopitt.urls"

TEMPLATES = [
	{
		"BACKEND": "django.template.backends.django.DjangoTemplates",
		"DIRS": [],
		"APP_DIRS": True,
		"OPTIONS": {
			"context_processors": [
				"django.template.context_processors.debug",
				"django.template.context_processors.request",
				"django.contrib.auth.context_processors.auth",
				"django.contrib.messages.context_processors.messages",
			],
		},
	},
]

WSGI_APPLICATION = "shopitt.wsgi.application"
ASGI_APPLICATION = "shopitt.asgi.application"

# Database
USE_SQLITE = os.environ.get("DJANGO_USE_SQLITE", "0") == "1" or os.environ.get("DJANGO_DB") == "sqlite"
if USE_SQLITE:
	DATABASES = {
		"default": {
			"ENGINE": "django.db.backends.sqlite3",
			"NAME": BASE_DIR / "db.sqlite3",
		}
	}
else:
	DATABASES = {
		"default": {
			"ENGINE": "django.db.backends.postgresql",
			"NAME": os.environ.get("POSTGRES_DB", "shopitt"),
			"USER": os.environ.get("POSTGRES_USER", "shopitt"),
			"PASSWORD": os.environ.get("POSTGRES_PASSWORD", "shopitt"),
			"HOST": os.environ.get("POSTGRES_HOST", "db"),
			"PORT": os.environ.get("POSTGRES_PORT", "5432"),
		}
	}

CHANNEL_LAYERS = {
	"default": {
		"BACKEND": "channels_redis.core.RedisChannelLayer",
		"CONFIG": {"hosts": [os.environ.get("REDIS_URL", "redis://redis:6379/0")]},
	}
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField" 