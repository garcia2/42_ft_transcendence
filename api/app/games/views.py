from users.utils import generate_random_code
from users.views import get_user_from_token
from django.http import JsonResponse
from users.models import User
from datetime import date
from .models import Game
import json

def create_game(request):
	if request.method == 'POST':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

		user1_id = data.get('user1_id')
		user2_id = data.get('user2_id')

		if not user1_id or not user2_id:
			return JsonResponse({'error': 'Both user1_id and user2_id are required.'}, status=400)

		try:
			user1 = User.objects.get(id=user1_id)
			user2 = User.objects.get(id=user2_id)
		except User.DoesNotExist:
			return JsonResponse({'error': 'One or both users not found.'}, status=404)

		game = Game(user1=user1, user2=user2)
		game.code = generate_random_code()
		game.save()

		return JsonResponse({
			'id': game.id,
			'user1_id': game.user1.id,
			'user2_id': game.user2.id,
			'score1': game.score1,
			'score2': game.score2,
			'completed': game.completed,
			'completion_date': game.completion_date,
			'code': game.code
		})
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def list_games(request):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		games = Game.objects.all()
		games_list = [
			{
				'id': game.id,
				'user1_id': game.user1.id,
				'user2_id': game.user2.id,
				'score1': game.score1,
				'score2': game.score2,
				'completed': game.completed,
				'completion_date': game.completion_date
			}
			for game in games
		]
		return JsonResponse(games_list, safe=False)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def game_detail(request, game_id):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			game = Game.objects.get(id=game_id)
			return JsonResponse({
				'id': game.id,
				'user1_id': game.user1.id,
				'user2_id': game.user2.id,
				'score1': game.score1,
				'score2': game.score2,
				'completed': game.completed,
				'completion_date': None,
				'code': game.code
			})
		except Game.DoesNotExist:
			return JsonResponse({'error': 'Game not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def update_game(request, game_id):
	if request.method == 'PATCH':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

		try:
			game = Game.objects.get(id=game_id)
		except Game.DoesNotExist:
			return JsonResponse({'error': 'Game not found.'}, status=404)

		score1 = data.get('score1')
		score2 = data.get('score2')
		completed = data.get('completed')

		if score1 is not None:
			game.score1 = score1
		if score2 is not None:
			game.score2 = score2
		if completed is not None:
			game.completed = completed
			game.completion_date = date.today()

		game.save()

		return JsonResponse({
			'id': game.id,
			'user1_id': game.user1.id,
			'user2_id': game.user2.id,
			'score1': game.score1,
			'score2': game.score2,
			'completed': game.completed,
			'completion_date': game.completed
		})
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def delete_game(request, game_id):
	if request.method == 'DELETE':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			game = Game.objects.get(id=game_id)
			game.delete()
			return JsonResponse({}, status=204)
		except Game.DoesNotExist:
			return JsonResponse({'error': 'Game not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)


def user_games(request, user_id):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		games = Game.objects.filter(user1__id=user_id) | Game.objects.filter(user2__id=user_id)
		games_list = [
			{
				'id': game.id,
				'user1_id': game.user1.id,
				'user2_id': game.user2.id,
				'score1': game.score1,
				'score2': game.score2,
				'completed': game.completed,
				'completion_date': game.completion_date,
				'code': game.code
			}
			for game in games
		]
		return JsonResponse(games_list, safe=False)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)
