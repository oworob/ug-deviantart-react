# DeviantArt React App

This project is a full stack app that imitates [DeviantArt](https://www.deviantart.com/). It was made as a University project in 2022.

### Technologies:

* React
* Sass
* NodeJS
* Neo4j
* Keycloak

### Functions:

Each user can create an account and submit images (saved as URL) with description and tags. Other users may add these to their favourites, download them, leave comments, find similar images or more from this author. 

Additionally, each user can edit their profile - profile picture, background image and a short bio. 

Home page shows many images from database, including most liked and most commented (obviously, it will look very bare with an empty database), as well as random facts about art using SSE. The app also has a functional search tool that lets users find other users and images. 

The app has an admin role that has additional functions, including editing other users' profiles, editing or removing their images and deleting comments.

### Instructions:

The entire app works in Docker. Simply navigate to the main project folder and run:

`docker compose up --build`

Please note that the first launch may take a while.