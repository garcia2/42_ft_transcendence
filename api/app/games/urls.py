from django.urls import path
from .views import (
    create_game,
    list_games,
    game_detail,
    update_game,
    delete_game,
    user_games
)

urlpatterns = [
    path('create/', create_game, name='create_game'),
    path('games/', list_games, name='list_games'),
    path('games/<int:game_id>/', game_detail, name='game_detail'),
    path('games/update/<int:game_id>/', update_game, name='update_game'),
    path('games/delete/<int:game_id>/', delete_game, name='delete_game'),
    path('user_games/<int:user_id>/', user_games, name='user_games'),
]
