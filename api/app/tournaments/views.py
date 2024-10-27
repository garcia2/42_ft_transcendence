from .models import Tournament, TournamentParticipant, TournamentGame
from users.utils import generate_random_code
from users.views import get_user_from_token
from django.http import JsonResponse
from users.models import User
from games.models import Game
import json

def create_tournament(request):
    if request.method == 'POST':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        organizer_id = data.get('organizer_id')
        name = data.get('name')

        if organizer_id != user.id:
            return JsonResponse({'error': 'Organizer ID must match token bearer ID.'}, status=403)

        if not name:
            return JsonResponse({'error': 'Tournament name is required.'}, status=400)

        tournament = Tournament(organizer=user, name=name)
        tournament.save()

        return JsonResponse({
            'id': tournament.id,
            'organizer_id': tournament.organizer.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'end_date': tournament.end_date,
            'status': tournament.status
        })
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_tournaments(request):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        tournaments = Tournament.objects.all()
        tournaments_list = [
            {
                'id': tournament.id,
                'organizer_id': tournament.organizer.id,
                'name': tournament.name,
                'start_date': tournament.start_date,
                'end_date': tournament.end_date,
                'status': tournament.status
            }
            for tournament in tournaments
        ]
        return JsonResponse(tournaments_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def tournament_detail(request, id):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        return JsonResponse({
            'id': tournament.id,
            'organizer_id': tournament.organizer.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'end_date': tournament.end_date,
            'status': tournament.status
        })
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def update_tournament(request, id):
    if request.method == 'PATCH':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        name = data.get('name')
        if name:
            tournament.name = name

        status = data.get('status')
        if status:
            tournament.status = status

        tournament.save()

        return JsonResponse({
            'id': tournament.id,
            'organizer_id': tournament.organizer.id,
            'name': tournament.name,
            'start_date': tournament.start_date,
            'end_date': tournament.end_date,
            'status': tournament.status
        })
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def delete_tournament(request, id):
    if request.method == 'DELETE':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        if tournament.organizer.id != user.id:
            return JsonResponse({'error': 'You can only delete your own tournaments.'}, status=403)

        tournament.delete()
        return JsonResponse({}, status=204)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def create_tournament_games(request, id):
    if request.method == 'POST':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        if tournament.organizer.id != user.id:
            return JsonResponse({'error': 'You can only create games for your own tournaments.'}, status=403)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        games = []

        for game_data in data:
            game_info = game_data.get('game')
            round = game_data.get('round')

            if not game_info or not round:
                return JsonResponse({'error': 'Invalid game data.'}, status=400)

            try:
                user1 = User.objects.get(id=game_info['user1_id'])
                user2 = User.objects.get(id=game_info['user2_id'])
            except User.DoesNotExist:
                return JsonResponse({'error': 'One or both users not found.'}, status=404)

            game = Game(user1=user1, user2=user2)
            game.code = generate_random_code()
            game.save()

            tournament_game = TournamentGame(tournament=tournament, game=game, round=round)
            tournament_game.save()
            games.append({
                'id': game.id,
                'user1_id': game.user1.id,
                'user2_id': game.user2.id,
                'score1': game.score1,
                'score2': game.score2,
                'completed': game.completed,
                'completion_date': game.completion_date,
                'code': game.code
            })

        return JsonResponse({
            'games': games
        })
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def participate_tournament(request, id):
    if request.method == 'POST':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        user_id = data.get('user_id')
        user_alias = data.get('alias')

        if user_id != user.id:
            return JsonResponse({'error': 'User ID must match token bearer ID.'}, status=403)

        if not user_alias:
            return JsonResponse({'error': 'Alias is required.'}, status=400)

        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament,
            user=user,
            user_alias=user_alias
        )

        if created:
            return JsonResponse({'detail': 'Participation added successfully.'})
        else:
            return JsonResponse({'detail': 'User is already participating in this tournament.'})
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def cancel_participation(request, id):
    if request.method == 'POST':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        user_id = data.get('user_id')
        user_alias = data.get('alias')

        if user_id != user.id:
            return JsonResponse({'error': 'User ID must match token bearer ID.'}, status=403)

        try:
            participant = TournamentParticipant.objects.get(tournament=tournament, user=user, user_alias=user_alias)
        except TournamentParticipant.DoesNotExist:
            return JsonResponse({'error': 'Participation not found.'}, status=404)

        participant.delete()

        return JsonResponse({'detail': 'Participation removed successfully.'})
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_tournament_games(request, id):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        tournament_games = TournamentGame.objects.filter(tournament=tournament)

        games_list = [
            {
                'id': tournament_game.id,
                'game_id': tournament_game.game.id,
                'round': tournament_game.round
            }
            for tournament_game in tournament_games
        ]
        return JsonResponse(games_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_tournament_participants(request, id):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            tournament = Tournament.objects.get(id=id)
        except Tournament.DoesNotExist:
            return JsonResponse({'error': 'Tournament not found.'}, status=404)

        participants = TournamentParticipant.objects.filter(tournament=tournament)

        participants_list = [
            {
                'id': participant.id,
                'user_id': participant.user.id,
                'alias': participant.user_alias
            }
            for participant in participants
        ]
        return JsonResponse(participants_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_user_tournament_participations(request):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        user_id = data.get('user_id')

        if user_id != user.id:
            return JsonResponse({'error': 'User ID must match token bearer ID.'}, status=403)

        participations = TournamentParticipant.objects.filter(user=user)

        participations_list = [
            {
                'id': participation.id,
                'tournament_id': participation.tournament.id,
                'alias': participation.user_alias
            }
            for participation in participations
        ]
        return JsonResponse(participations_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_user_created_tournaments(request):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        user_id = data.get('user_id')

        if user_id != user.id:
            return JsonResponse({'error': 'User ID must match token bearer ID.'}, status=403)

        tournaments = Tournament.objects.filter(organizer=user)

        tournaments_list = [
            {
                'id': tournament.id,
                'organizer_id': tournament.organizer.id,
                'name': tournament.name,
                'start_date': tournament.start_date,
                'end_date': tournament.end_date,
                'status': tournament.status
            }
            for tournament in tournaments
        ]
        return JsonResponse(tournaments_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def list_tournament_gamess(request):
    tournament_games = TournamentGame.objects.all().values('tournament', 'game', 'round')
    
    return JsonResponse(list(tournament_games), safe=False)