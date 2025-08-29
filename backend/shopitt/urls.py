from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root_hello(_request):
	return JsonResponse({"message": "Hello from Django backend"})


urlpatterns = [
	path("admin/", admin.site.urls),
	path("api/", include("core.urls")),
	path("", root_hello),
] 