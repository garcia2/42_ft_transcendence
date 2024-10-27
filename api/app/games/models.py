from django.db import models
from users.models import User

class Game(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player_1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='player_2')
    score1 = models.IntegerField(default=0)
    score2 = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    completion_date = models.DateTimeField(null=True, blank=True)
    code = models.CharField(null=True, blank=True)
