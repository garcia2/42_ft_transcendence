from django.core.exceptions import ValidationError
import re
import socket
import ssl
import base64
import random
import string
import os

def send_email_via_smtp(host, port, from_email, from_password, to_email, subject, body):
	# Créer une connexion socket
	context = ssl.create_default_context()
	with socket.create_connection((host, port)) as sock:
		with context.wrap_socket(sock, server_hostname=host) as server:
			# Lire la réponse du serveur
			def recv():
				response = server.recv(4096).decode('utf-8')
				print("Server: ", response)
				return response

			# Envoyer des commandes au serveur
			def send(command):
				print("Client: ", command)
				server.sendall((command + '\r\n').encode('utf-8'))

			# Connexion au serveur SMTP
			print("Connecting to server...")
			recv()
			send("EHLO " + host)
			recv()

			# Authentification
			print("Authenticating...")
			send("AUTH LOGIN")
			recv()
			send(base64.b64encode(from_email.encode()).decode())
			recv()
			send(base64.b64encode(from_password.encode()).decode())
			auth_response = recv()
			if "535" in auth_response:
				print("Authentication failed. Check your username and password.")
				return

			# Envoi de l'email
			print("Sending email...")
			send(f"MAIL FROM: <{from_email}>")
			recv()
			send(f"RCPT TO: <{to_email}>")
			recv()
			send("DATA")
			recv()

			# Envoi du contenu de l'email
			email_message = f"""\
From: {from_email}
To: {to_email}
Subject: {subject}

{body}
.
"""
			print("Client: ", email_message)
			server.sendall(email_message.encode('utf-8'))
			server.sendall(b"\r\n.\r\n")
			data_response = recv()
			print("Data response: ", data_response)

			# Terminer la session SMTP
			print("Quitting...")
			send("QUIT")
			quit_response = recv()
			print("Quit response: ", quit_response)




def send_email(to_email, subject, body):
	smtp_host = "smtp.gmail.com"
	smtp_port = 465
	from_email = os.environ.get("SMTP_FROM_EMAIL")
	from_password = os.environ.get("SMTP_FROM_PASSWORD")  # Utilisez un mot de passe d'application ici

	send_email_via_smtp(smtp_host, smtp_port, from_email, from_password, to_email, subject, body)



def generate_random_code(length=6):
	"""Génère un code aléatoire composé de chiffres."""
	return ''.join(random.choices(string.digits, k=length))


def is_password_secure(password):
	min_length = 8
	if len(password) < min_length:
		return (f"Le mot de passe doit contenir au moins {min_length} caractères.")

	if not re.search(r'[A-Z]', password):
		return ("Le mot de passe doit contenir au moins une lettre majuscule.")

	if not re.search(r'[a-z]', password):
		return ("Le mot de passe doit contenir au moins une lettre minuscule.")

	if not re.search(r'[0-9]', password):
		return ("Le mot de passe doit contenir au moins un chiffre.")

	if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
		return ("Le mot de passe doit contenir au moins un caractère spécial.")
	
	return True
