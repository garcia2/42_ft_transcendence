from django.db import models

class User(models.Model):
    nickname = models.CharField(max_length=30, unique=True)
    password = models.CharField(max_length=128)
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    elo = models.IntegerField(default=1000)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    is_active = models.BooleanField(default=False)
    friends = models.ManyToManyField('self', symmetrical=False, related_name='user_friends', blank=True)
    tfa_mail = models.CharField(max_length=50, unique=True, blank=True, null=True)
    tfa_code = models.CharField(null=True, blank=True)
    ft_id = models.IntegerField(null=True, blank=True, unique=True)
