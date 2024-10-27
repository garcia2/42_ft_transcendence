import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from websockets.PresenceRecorder import PresenceRecorder

presenceRecorder: PresenceRecorder = PresenceRecorder()


class PresenceConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.username = None

    async def connect(self):
        print(self)
        await self.accept()
        await self.send(json.dumps(PresenceRecorder.logged_in_users))

    async def disconnect(self, close_code):
        print("disconnect : ", self.username)
        if self.username:
            presenceRecorder.set_user_logged_out(self.username)

    async def receive(self, text_data=None, bytes_data=None, **kwargs):
        text_data_json = json.loads(text_data)

        if 'username' in text_data_json:
            username = text_data_json['username']
            action = text_data_json['action']

            if action == 'ADD':
                print("connect : ", username)
                self.username = username
                presenceRecorder.set_user_logged_in(username)
            elif action == 'REMOVE':
                presenceRecorder.set_user_logged_out(username)

        await self.send(json.dumps(PresenceRecorder.logged_in_users))
