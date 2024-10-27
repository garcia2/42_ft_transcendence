from django.urls import path
from .views import (
    invite_user,
    accept_invite,
    delete_invite,
    list_invites,
    list_user_invites
)

urlpatterns = [
    path('invite/', invite_user, name='invite_user'),
    path('accept_invite/', accept_invite, name='accept_invite'),
    path('delete_invite/', delete_invite, name='delete_invite'),
    path('invites/', list_invites, name='list_invites'),
    path('invites/<int:id>/', list_user_invites, name='list_user_invites'),
]
