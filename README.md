The content below is an example project proposal / requirements document. Replace the text below the lines marked "__TODO__" with details specific to your project. Remove the "TODO" lines.

# Coaster Reviews

## Overview

The world is full of magical theme parks and roller coasters, with more popping up each year. This is great and all, until one is faced with the task of planning a vacation to one of these destinations. Thanks to the paradox of choice, deciding which park(s) to visit can be quite stressful. This site serves to aid financially constrained theme park/coaster enthusiasts in deciding where to spend their hard earned bucks.

Coaster Reviews is a web app that allows users to review and read reviews of roller coasters from around the world. Users can register and login. Anyone can read reviews, but only logged in users can post new reviews.


## Data Model

The app will store Users, Parks, Coasters, and Reviews. Parks and Coasters will be displayed with a rating between 1 and 5. Coaster ratings are calculated with the average rating of its reviews. Park ratings are calculated with the average rating of its Coasters.

Sample User:

```javascript
{
  type: admin // could also be 'user' (less privileged)
  username: “garrettlu”,
  password: // a salted & hashed password
}
```

Sample Review:

```javascript
{
  author: // a reference to a User document
  rating: 5,
  text: “Great, would ride again”
}
```

Sample Coaster:

```javascript
{
  name: “Superman The Ride”,
  rating: 4.8, // the average of each review rating
  reviews: // a list of Review subdocuments
}
```

Sample Park:

```javascript
{
  name: “Six Flags New England”,
  rating: 4.4 // the average of each coaster rating
  coasters: // a list of Coaster subdocuments
}
```


## [Link to Commented First Draft Schema](db.js) 


## Wireframes

(___TODO__: wireframes for all of the pages on your site; they can be as simple as photos of drawings or you can use a tool like Balsamiq, Omnigraffle, etc._)

Common header:

![list create](documentation/header.png)

/ - homepage; displays a few highly rated parks and coasters

![list create](documentation/home.png)

/login - login page

![list create](documentation/login.png)

/register - registration page

![list create](documentation/register.png)

/parks - page for displaying all parks

![list](documentation/parks-coasters.png)

/coasters - page for displaying all coasters (same wireframe as above)

/:park - page for displaying a specific park and its coasters

![list](documentation/park.png)

/:park/:coaster - page for displaying a specific coaster and its reviews

![list](documentation/coaster.png)

/account - page for displaying a user's account information and reviews posted by the user

![list](documentation/account.png)


## Site Map

![list](documentation/sitemap.png)


## Use Cases

1. As a non-logged in user, I can register an account on the site
2. As a non-logged in user, I can log in to the site
3. As a non-logged in user, I can view parks, coasters, and reviews on the site
4. As a logged-in user, I can do (3), as well as post and delete own reviews, and log out of the site
5. As a logged-in admin, I can do (4), as well as delete all reviews, and add/edit parks and coasters


## Research Topics

* (4 points, estimated) Front end framework
  * Candidates: React, Vue, Angular
  * These frameworks provide powerful methods for creating and managing user interfaces. I will use a framework to handle site presentation and user interactivity such as sorting, filtering, posting/deleting reviews, etc.
* (3 points, estimated) Configuration management
  * Candidates: nconf, Node convict
  * It is often the case that the app's behavior needs to be modified to suit its production environment, such as disabling logging and connecting to different databases. I will use a library to help me manage development and production configurations.
* (1 point, estimated) Slug generation for routing
  * Candidates: Mongoose slug generator, slugify
  * The site will potentially have many parks and coasters. It would be convenient to automatically generate a slug whenever a new park or coaster is added. I will use a library to generate slugs for each new park and coaster.

Total points: 8


## [Link to Initial Main Project File](app.js) 


## Annotations / References Used

1. [docs on React](https://reactjs.org/docs/getting-started.html) - (add link to source code that was based on this)
2. [docs on Node convict](https://www.npmjs.com/package/convict) - (add link to source code that was based on this)
2. [docs on Mongoose slug generator](https://www.npmjs.com/package/mongoose-slug-generator) - (add link to source code that was based on this)