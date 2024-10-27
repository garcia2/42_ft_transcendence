from django.contrib import admin
from django.conf import settings
from django.urls import path, include
from django.conf.urls.static import static

urlpatterns = [
    path('api/users/', include('users.urls')),
    path('api/invites/', include('invites.urls')),
    path('api/games/', include('games.urls')),
    path('api/tournaments/', include('tournaments.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
