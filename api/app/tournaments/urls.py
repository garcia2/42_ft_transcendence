from django.urls import path
from .views import (
    create_tournament,
    list_tournaments,
    tournament_detail,
    update_tournament,
    delete_tournament,
    create_tournament_games,
    participate_tournament,
    cancel_participation,
    list_tournament_games,
    list_tournament_participants,
    list_user_tournament_participations,
    list_user_created_tournaments,
	list_tournament_gamess,
)

urlpatterns = [
    path('create/', create_tournament, name='create_tournament'),
    path('tournaments/', list_tournaments, name='list_tournaments'),
    path('tournaments/<int:id>/', tournament_detail, name='tournament_detail'),
    path('tournaments/update/<int:id>/', update_tournament, name='update_tournament'),
    path('tournaments/delete/<int:id>/', delete_tournament, name='delete_tournament'),
    path('tournaments/<int:id>/create_games/', create_tournament_games, name='create_tournament_games'),
    path('tournaments/<int:id>/participate/', participate_tournament, name='participate_tournament'),
    path('tournaments/<int:id>/cancel_participation/', cancel_participation, name='cancel_participation'),
    path('tournaments/<int:id>/games/', list_tournament_games, name='list_tournament_games'),
    path('tournaments/<int:id>/users/', list_tournament_participants, name='list_tournament_participants'),
    path('tournaments/participate/', list_user_tournament_participations, name='list_user_tournament_participations'),
    path('tournaments/admin/', list_user_created_tournaments, name='list_user_created_tournaments'),
	path('tournament_games/', list_tournament_gamess, name='list_tournament_gamess'),
]
