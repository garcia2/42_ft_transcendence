from django.db import models
from users.models import User
from games.models import Game


class Tournament(models.Model):
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('finished', 'Finished')
    ]

    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_tournaments')
    name = models.CharField(max_length=255)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tournament_participations')
    user_alias = models.CharField(max_length=255)

    class Meta:
        unique_together = (('tournament', 'user'), ('tournament', 'user_alias'))


class TournamentGame(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='tournament_games')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='tournament_games')
    round = models.IntegerField()

    class Meta:
        unique_together = (('tournament', 'game', 'round')) 
