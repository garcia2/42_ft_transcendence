from users.views import get_user_from_token
from django.http import JsonResponse
from .models import GameInvitation
from users.models import User
import json

def invite_user(request):
    if request.method == 'POST':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        inviter_id = data.get('inviter_id')
        invitee_id = data.get('invitee_id')
        timestamp = data.get('timestamp')
        message = data.get('message')

        if not invitee_id or not timestamp:
            return JsonResponse({'error': 'Invitee ID and timestamp are required.'}, status=400)

        try:
            inviter = User.objects.get(id=inviter_id)
            invitee = User.objects.get(id=invitee_id)
        except User.DoesNotExist:
            return JsonResponse({'error': 'One or both users not found.'}, status=404)

        invitation = GameInvitation(inviter=inviter, invitee=invitee, timestamp=timestamp, message=message)
        invitation.save()

        return JsonResponse({'detail': 'Invitation sent successfully.'})
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def accept_invite(request):
    if request.method == 'PATCH':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        invitation_id = data.get('invitation_id')

        if not invitation_id:
            return JsonResponse({'error': 'Invitation ID is required.'}, status=400)

        try:
            invitation = GameInvitation.objects.get(id=invitation_id)
        except GameInvitation.DoesNotExist:
            return JsonResponse({'error': 'Invitation not found.'}, status=404)

        if invitation.invitee.id != user.id:
            return JsonResponse({'error': 'Only the invitee can accept the invitation.'}, status=403)

        invitation.accepted = True
        invitation.save()

        return JsonResponse({
            'id': invitation.id,
            'inviter_id': invitation.inviter.id,
            'invitee_id': invitation.invitee.id,
            'timestamp': invitation.timestamp,
            'accepted': invitation.accepted,
            'message': invitation.message
        })
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def delete_invite(request):
    if request.method == 'DELETE':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        try:
            data = json.loads(request.body.decode('utf-8'))
        except ValueError:
            return JsonResponse({'error': 'Invalid JSON format.'}, status=400)

        invitation_id = data.get('invitation_id')

        if not invitation_id:
            return JsonResponse({'error': 'Invitation ID is required.'}, status=400)

        try:
            invitation = GameInvitation.objects.get(id=invitation_id)
        except GameInvitation.DoesNotExist:
            return JsonResponse({'error': 'Invitation not found.'}, status=404)

        if invitation.inviter.id != user.id and invitation.invitee.id != user.id:
            return JsonResponse({'error': 'Only the inviter or invitee can delete the invitation.'}, status=403)

        invitation.delete()
        return JsonResponse({}, status=204)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_invites(request):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        invites = GameInvitation.objects.all()
        invites_list = [
            {
                'id': invite.id,
                'inviter_id': invite.inviter.id,
                'invitee_id': invite.invitee.id,
                'timestamp': invite.timestamp,
                'accepted': invite.accepted,
                'message': invite.message
            }
            for invite in invites
        ]
        return JsonResponse(invites_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

def list_user_invites(request, id):
    if request.method == 'GET':
        user = get_user_from_token(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        if user.id != id:
            return JsonResponse({'error': 'ID must match token bearer ID.'}, status=403)

        invites = GameInvitation.objects.filter(invitee__id=id)
        invites_list = [
            {
                'id': invite.id,
                'inviter_id': invite.inviter.id,
                'invitee_id': invite.invitee.id,
                'timestamp': invite.timestamp,
                'accepted': invite.accepted,
                'message': invite.message
            }
            for invite in invites
        ]
        return JsonResponse(invites_list, safe=False)
    else:
        return JsonResponse({'error': 'Invalid HTTP method'}, status=405)

