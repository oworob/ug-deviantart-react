# DeviantArt React App

This project is a full stack app that imitates [DeviantArt](https://www.deviantart.com/). It was made as a University project in 2022.

### Technologies:

* Frontend - React + Sass
* Backend - NodeJS + Express
* Database - Neo4j
* Authorization - Keycloak 18.0.2

### Functions:

Each user can create an account and submit images (saved as URL) with description and tags. Other users may add these to their favourites, download them, leave comments, find similar images or more from this author. 

Additionally, each user can edit their profile - profile picture, background image and a short bio. 

Home page shows images from database, including most liked and most commented (obviously, it will look very bare with an empty database), as well as random facts about art using SSE. The app also has a functional search tool that lets users find other users and images. 

The app has an admin role that has additional functions, including editing other users' profiles, editing or removing their images and deleting comments.

### Instructions:

The entire app works in Docker. Simply navigate to the main project folder and run:

`docker compose up --build`

Please note that the first launch may take a while.

Premade user accounts (the password is `test`):
* anne82
* eve118
* jack12
* oscar189
* phil55

And the admin account with the password `admin`.

Note that none of the accounts will be visible at first as they do not exist in the database prior to the first login. I did not upload my database to the repository.

### Screenshots:

![home page](https://github.com/oworob/ug-deviantart-react/blob/main/screenshots/home.png)

![image page](https://github.com/oworob/ug-deviantart-react/blob/main/screenshots/imagepage.png)

![edit page](https://github.com/oworob/ug-deviantart-react/blob/main/screenshots/edit.png)

![search page](https://github.com/oworob/ug-deviantart-react/blob/main/screenshots/search.png)

![database](https://github.com/oworob/ug-deviantart-react/blob/main/screenshots/database.png)
