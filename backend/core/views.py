from django.http import JsonResponse


def hello(_request):
	return JsonResponse({"message": "Hello API from DRF/Channels-ready backend"}) 