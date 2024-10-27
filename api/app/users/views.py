
from django.contrib.auth.hashers import check_password, make_password
from .utils import send_email, generate_random_code, is_password_secure
from django.http import JsonResponse
from django.conf import settings
from .models import User
from django.core.files import File

import requests
import uuid
import json
import jwt
import os
import re
import time
import re

def get_user_from_token(request):
	token = request.headers.get('Authorization', '').replace('Bearer ', '')
	if not token:
		return None

	try:
		payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
		user_id = payload.get('user_id')
		return User.objects.get(id=user_id)
	except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
		return None

def register_user(request):
	if request.method == 'POST':
		nickname = request.POST.get('nickname')
		password = request.POST.get('password')
		profile_photo = request.FILES.get('profile_photo', None)

		if not nickname or not password:
			return JsonResponse({'error': 'Nickname and password are required.'}, status=400)

		if not re.match(r'^[a-zA-Z0-9]{2,32}$', nickname):
			return JsonResponse({'error': 'Nickname must be between 2 and 32 characters and can only contain letters and numbers.'}, status=400)

		if User.objects.filter(nickname=nickname).exists():
			return JsonResponse({'error': 'Nickname already exists.'}, status=400)

		secured = is_password_secure(password)
		if secured != True:
			return JsonResponse({'error': f'{secured}'}, status=400)

		user = User(
			nickname=nickname,
			password=make_password(password),
			profile_photo=profile_photo
		)
		user.save()

		return JsonResponse({
			'id': user.id,
			'nickname': user.nickname,
			'profile_photo': user.profile_photo.url if user.profile_photo else None,
			'elo': user.elo,
			'wins': user.wins,
			'losses': user.losses,
			'is_active': user.is_active
		})
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def login_user(request):
	if request.method == 'POST':
		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

		nickname = data.get('nickname')
		password = data.get('password')
		code = data.get('tfa_code')

		if not nickname or not password:
			return JsonResponse({'error': 'Nickname and password are required.'}, status=400)

		try:
			user = User.objects.get(nickname=nickname)
			if check_password(password, user.password):

				if code:
					if (code != user.tfa_code):
						return JsonResponse({'error': 'Codes missmatch.'}, status=400)
					else:
						user.tfa_code = None
						user.save()
						token = jwt.encode({'user_id': user.id}, settings.SECRET_KEY, algorithm='HS256')
						return JsonResponse({
							'user': {
								'id': user.id,
								'nickname': user.nickname,
								'profile_photo': user.profile_photo.url if user.profile_photo else None,
								'elo': user.elo,
								'wins': user.wins,
								'losses': user.losses,
								'is_active': True
							},
							'token': token
						}, status = 200)
				else:
					if user.tfa_mail:
						tfa_code = generate_random_code()
						send_email(user.tfa_mail, 'Transcendence Two-Factor Authentication code', tfa_code)
						user.tfa_code = tfa_code
						user.save()
						return JsonResponse({
							'message': 'Two-Factor Authentication code sent.',
							'tfa_required': True
						}, status=200)
					else:
						if user.tfa_code:
							user.tfa_code = None
							user.save()
						token = jwt.encode({'user_id': user.id}, settings.SECRET_KEY, algorithm='HS256')
						return JsonResponse({
							'user': {
								'id': user.id,
								'nickname': user.nickname,
								'profile_photo': user.profile_photo.url if user.profile_photo else None,
								'elo': user.elo,
								'wins': user.wins,
								'losses': user.losses,
								'is_active': True
							},
							'token': token
						}, status = 200)
			else:
				time.sleep(2)
				return JsonResponse({'error': 'Invalid credentials.'}, status=400)
		except User.DoesNotExist:
			return JsonResponse({'error': 'Invalid credentials.'}, status=400)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_users(request):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		users = User.objects.all()
		user_list = [
			{
				'id': user.id,
				'nickname': user.nickname,
				'profile_photo': user.profile_photo.url if user.profile_photo else None,
				'elo': user.elo,
				'wins': user.wins,
				'losses': user.losses,
				'is_active': user.is_active
			}
			for user in users
		]
		return JsonResponse(user_list, safe=False)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def user_detail(request, user_id):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			target_user = User.objects.get(id=user_id)
			tfa_mail = None
			if user.id == target_user.id:
				tfa_mail = user.tfa_mail
			return JsonResponse({
				'id': target_user.id,
				'nickname': target_user.nickname,
				'profile_photo': target_user.profile_photo.url if target_user.profile_photo else None,
				'elo': target_user.elo,
				'wins': target_user.wins,
				'losses': target_user.losses,
				'is_active': target_user.is_active,
				'tf_id': target_user.ft_id,
				'tfa_mail': tfa_mail

			})
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def get_user_by_nickname(request, nickname):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			target_user = User.objects.get(nickname=nickname)
			return JsonResponse({
				'id': target_user.id,
				'nickname': target_user.nickname,
				'profile_photo': target_user.profile_photo.url if target_user.profile_photo else None,
				'elo': target_user.elo,
				'wins': target_user.wins,
				'losses': target_user.losses,
				'is_active': target_user.is_active
			})
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def update_user(request, user_id):
	if request.method == 'POST':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)
		if user.id != user_id:
			return JsonResponse({'error': 'Unauthorized'}, status=401)
		try:
			target_user = User.objects.get(id=user_id)

			nickname = request.POST.get('nickname')
			profile_photo = request.FILES.get('profile_photo')
			elo = request.POST.get('elo')
			wins = request.POST.get('wins')
			losses = request.POST.get('losses')
			tfa_mail = request.POST.get('tfa_mail')
			password = request.POST.get('password')

			if nickname is not None:
				if not re.match(r'^[a-zA-Z0-9]{2,32}$', nickname):
					return JsonResponse({'error': 'Nickname must be between 2 and 32 characters and can only contain letters and numbers.'}, status=400)
				target_user.nickname = nickname
			if profile_photo is not None:
				target_user.profile_photo = profile_photo
			if elo is not None:
				target_user.elo = elo
			if wins is not None:
				target_user.wins = wins
			if losses is not None:
				target_user.losses = losses
			if tfa_mail == "":
				target_user.tfa_mail = None
			elif tfa_mail is not None:
				target_user.tfa_mail = tfa_mail
			if password is not None:
				secured = is_password_secure(password)
				if secured != True:
					return JsonResponse({'error': f'{secured}'}, status=400)
				target_user.password=make_password(password)

			target_user.save()
			return JsonResponse({
				'id': target_user.id,
				'nickname': target_user.nickname,
				'profile_photo': target_user.profile_photo.url if target_user.profile_photo else None,
				'elo': target_user.elo,
				'wins': target_user.wins,
				'losses': target_user.losses,
				'tfa_mail': target_user.tfa_mail
			})
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def delete_user(request, user_id):
	if request.method == 'DELETE':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)
		if user.id != user_id:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		try:
			target_user = User.objects.get(id=user_id)
			target_user.delete()
			return JsonResponse({}, status=204)
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def logout_user(request):
	if request.method == 'POST':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Unauthorized'}, status=401)

		user.is_active = False
		user.save()

		return JsonResponse({'detail': 'User logged out successfully.'})
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def add_friend(request):
	if request.method == 'POST':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Authentication required.'}, status=401)

		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

		friend_id = data.get('friend_id')

		if not friend_id:
			return JsonResponse({'error': 'Friend ID is required.'}, status=400)

		try:
			friend = User.objects.get(id=friend_id)
			user.friends.add(friend)
			return JsonResponse({'detail': 'Friend added successfully.'})
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def remove_friend(request):
	if request.method == 'DELETE':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Authentication required.'}, status=401)

		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

		friend_id = data.get('friend_id')

		if not friend_id:
			return JsonResponse({'error': 'Friend ID is required.'}, status=400)

		try:
			friend = User.objects.get(id=friend_id)
			user.friends.remove(friend)
			return JsonResponse({'detail': 'Friend removed successfully.'})
		except User.DoesNotExist:
			return JsonResponse({'error': 'User not found.'}, status=404)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def get_friends(request):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Authentication required.'}, status=401)

		friends_list = [
			{
				'id': friend.id,
				'nickname': friend.nickname,
				'profile_photo': friend.profile_photo.url if friend.profile_photo else None,
				'elo': friend.elo,
				'wins': friend.wins,
				'losses': friend.losses,
				'is_active': user.is_active
			}
			for friend in user.friends.all()
		]

		return JsonResponse({'friends': friends_list})
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def get_token_bearer_info(request):
	if request.method == 'GET':
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Authentication required.'}, status=200)

		return JsonResponse({
			'id': user.id,
			'nickname': user.nickname,
			'profile_photo': user.profile_photo.url if user.profile_photo else None,
			'elo': user.elo,
			'wins': user.wins,
			'losses': user.losses,
			'is_active': user.is_active,
			'tfa_mail': user.tfa_mail,
			'ft_id': user.ft_id
		})
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=200)

def send_email_code(request):
	if (request.method == 'POST'):
		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Authentication required.'}, status=401)
		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)
		tfa_mail = data.get('tfa_mail')
		if not tfa_mail:
			return JsonResponse({'error': 'Two-Factor Authentication mail required.'}, status=400)
		code = generate_random_code()
		user.tfa_code = code
		user.save()
		send_email(tfa_mail, 'Transcendence Two-Factor Authentication code', code)
		return JsonResponse({'success': "A mail has been sent to '" + tfa_mail + "'."}, status=200)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def validate_tfa_code(request):
	if (request.method == 'POST'):

		user = get_user_from_token(request)
		if not user:
			return JsonResponse({'error': 'Authentication required.'}, status=401)

		try:
			data = json.loads(request.body.decode('utf-8'))
		except ValueError:
			return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

		tfa_code = user.tfa_code
		if not tfa_code:
			return JsonResponse({'error': 'No code for user.'}, status=400)

		code = data.get('tfa_code')
		if not code:
			return JsonResponse({'error': 'Two-Factor Authentication code required.'}, status=400)

		if (str(code) != str(tfa_code)):
			return JsonResponse({'error': 'Codes missmatch.'}, status=400)
		else:
			user.tfa_code = None
			user.save()
			return JsonResponse({'success': "Two-Factor Authentication code valid"}, status=200)

	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def register_or_login_with_ft(request):
	if request.method == 'POST':
		data = json.loads(request.body.decode('utf-8'))
		code = data.get('code')
		token_response = requests.post(
			'https://api.intra.42.fr/oauth/token',
			data={
				'grant_type': 'authorization_code',
				'client_id': os.environ.get('FT_INTRA_CLIENT_ID'),
				'client_secret': os.environ.get('FT_INTRA_CLIENT_SECRET'),
				'code': code,
				'redirect_uri': 'https://localhost:1500/callback'
			},
			headers={
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		).json()

		access_token = token_response.get('access_token')
		if access_token is None:
			return JsonResponse({'error': 'error with code'}, status=400)

		user_data_response = requests.get(
			'https://api.intra.42.fr/v2/me',
			headers={
				'Authorization': 'Bearer ' + access_token
			}
		).json()

		ft_id = user_data_response.get('id')

		if ft_id is None:
			return JsonResponse({'error': 'error with intra.42.api'}, status=503)

		user_filter = User.objects.filter(ft_id=ft_id)

		if user_filter.exists():
			user = user_filter[0]
			token = jwt.encode({'user_id': user.id}, settings.SECRET_KEY, algorithm='HS256')
			return JsonResponse({
				'user': {
					'id': user.id,
					'nickname': user.nickname,
					'profile_photo': None,
					'elo': user.elo,
					'wins': user.wins,
					'losses': user.losses,
					'is_active': True,
					'ft_id': user.ft_id
				},
				'ft_token': access_token,
				'token': token
			}, status=200)
		else:
			return JsonResponse({
				'ft_token': access_token,
				'response': "nickname needed to register"
				}, status=200)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def finish_register_with_ft(request):
	if request.method == 'POST':

		ft_token = request.POST.get('ft_token')
		nickname = request.POST.get('nickname')
		if ft_token is None or nickname is None:
			return JsonResponse({'error': 'ft_token and/or nickname required.'}, status=400)

		if User.objects.filter(nickname=nickname).exists():
			return JsonResponse({'error': 'Nickname already exists.'}, status=400)

		user_data_response = requests.get(
			'https://api.intra.42.fr/v2/me',
			headers={
				'Authorization': 'Bearer ' + ft_token
			}
		).json()

		ft_id = user_data_response.get('id')
		if ft_id is None:
			return JsonResponse({'error': 'error with intra.42.api'}, status=503)
		if User.objects.filter(ft_id=ft_id).exists():
			return JsonResponse({'error': '42 profile already linked to another account.'}, status=400)

		photo_response = requests.get(user_data_response.get('image').get('link'))

		temp_image_path = f"/tmp/{nickname}_profile.jpg"

		with open(temp_image_path, 'wb') as temp_image_file:
			temp_image_file.write(photo_response.content)

		with open(temp_image_path, 'rb') as image_file:
			new_user = User(
				nickname=nickname,
				ft_id=ft_id,
				profile_photo=File(image_file, name=f"{ft_id}_{nickname}_profile.jpg"),
				password=uuid.uuid4(),
			)
			new_user.save()

		token = jwt.encode({'user_id': new_user.id}, settings.SECRET_KEY, algorithm='HS256')

		return JsonResponse({
			'user': {
				'id': new_user.id,
				'nickname': new_user.nickname,
				'profile_photo': None,
				'elo': new_user.elo,
				'wins': new_user.wins,
				'losses': new_user.losses,
				'is_active': True,
				'ft_id': new_user.ft_id
			},
			'ft_token': ft_token,
			'token': token
		}, status=200)
	else:
		return JsonResponse({'error': 'Invalid HTTP method'}, status=405)
