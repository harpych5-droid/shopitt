"""
URL configuration for shopitt_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/users/', include('apps.users.urls')),
    path('api/creators/', include('apps.creators.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/drops/', include('apps.drops.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/tastegraph/', include('apps.tastegraph.urls')),
    path('api/bag/', include('apps.bag.urls')),  # Floating bag endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
