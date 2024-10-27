from threading import Lock


class PresenceRecorder:
    logged_in_users: list[str] = []

    _logged_in_users_lock: Lock = Lock()

    @classmethod
    def add_user(cls, username: str):
        with cls._logged_in_users_lock:
            cls.logged_in_users.append(username)

    @classmethod
    def remove_user(cls, username: str):
        with cls._logged_in_users_lock:
            cls.logged_in_users.remove(username)

    def set_user_logged_in(self, username: str):
        if username not in self.logged_in_users:
            self.add_user(username)

    def set_user_logged_out(self, username: str):
        if username in self.logged_in_users:
            self.remove_user(username)
