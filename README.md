# Transcendence

**Transcendence** is an advanced project developed as part of the 42 curriculum. The goal of this project is to create a fully interactive multiplayer web application that includes features such as authentication, profile management, and secure login options. The main feature is a 3D local Pong game.

## Table of Contents
1. [Overview](#overview)
2. [Project Architecture](#project-architecture)
3. [Technologies Used](#technologies-used)
4. [Features](#features)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Author](#author)

## Overview

Transcendence is a complete web application that serves as a local multiplayer game platform. It is built with a Django backend, a native JavaScript frontend utilizing Three.js for 3D graphics, and a PostgreSQL database for handling data storage. The project is containerized using Docker, with separate containers for the backend, frontend, and Caddy as a reverse proxy.

## Project Architecture

- **Backend** : Django serves as the backend framework, handling API requests, database interactions, and WebSocket communication for real-time features.
- **Frontend** : The frontend is built in native JavaScript, creating an interactive 3D Pong game interface.
- **Database** : PostgreSQL is used for robust and reliable data storage.
- **Styling** : Bootstrap is used along with custom CSS.
- **Containerization** : Docker is used to isolate each component in separate containers.
- **Caddy Server** : Acts as a reverse proxy for serving the frontend and handling HTTPS configuration.

## Technologies Used

- **Django** : Backend framework
- **JavaScript (Native) & Three.js** : Frontend and 3D rendering
- **Bootstrap & CSS** : Styling
- **PostgreSQL** : Database
- **Docker** : Containerization of backend, frontend, and Caddy
- **Caddy** : Reverse proxy and HTTPS handling

## Features

1. **User Authentication** : OAuth-based login with 42's API for secure access.
2. **Two-Factor Authentication (2FA)** : Email-based 2FA for added security.
3. **3D Pong Game** : A 3D multiplayer Pong game built with Three.js.

## Installation

To run the Transcendence application with Docker, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/garcia2/42_ft_transcendence
   cd 42_ft_transcendence
   ```

2. Ensure Docker is installed and running on your machine.

3. Build and start the Docker containers:

   ```bash
   make
   ```

   This command will set up and start separate containers for Django (backend), Caddy (frontend server), and PostgreSQL.

4. Once the setup is complete, the application will be accessible at `https://localhost:1500`.

## Usage

After starting the containers, open your browser and navigate to `https://localhost:1500`. Sign up or log in using OAuth, enable 2FA if desired, and start playing the 3D Pong game.

## Author

Project developed by [Nicolas Garcia](https://github.com/garcia2) as part of 42 school.
