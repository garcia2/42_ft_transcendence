# Generated by Django 5.0.7 on 2024-07-29 12:29

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nickname', models.CharField(max_length=30, unique=True)),
                ('password', models.CharField(max_length=128)),
                ('profile_photo', models.ImageField(blank=True, null=True, upload_to='profile_photos/')),
                ('elo', models.IntegerField(default=1000)),
                ('wins', models.IntegerField(default=0)),
                ('losses', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('friends', models.ManyToManyField(blank=True, related_name='user_friends', to='users.user')),
            ],
        ),
    ]