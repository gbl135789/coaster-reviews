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

/list/create - page for creating a new shopping list

![list create](documentation/list-create.png)

/list - page for showing all shopping lists

![list](documentation/list.png)

/list/slug - page for showing specific shopping list

![list](documentation/list-slug.png)

## Site map

(___TODO__: draw out a site map that shows how pages are related to each other_)

Here's a [complex example from wikipedia](https://upload.wikimedia.org/wikipedia/commons/2/20/Sitemap_google.jpg), but you can create one without the screenshots, drop shadows, etc. ... just names of pages and where they flow to.

## User Stories or Use Cases

(___TODO__: write out how your application will be used through [user stories](http://en.wikipedia.org/wiki/User_story#Format) and / or [use cases](https://www.mongodb.com/download-center?jmp=docs&_ga=1.47552679.1838903181.1489282706#previous)_)

1. as non-registered user, I can register a new account with the site
2. as a user, I can log in to the site
3. as a user, I can create a new grocery list
4. as a user, I can view all of the grocery lists I've created in a single list
5. as a user, I can add items to an existing grocery list
6. as a user, I can cross off items in an existing grocery list

## Research Topics

(___TODO__: the research topics that you're planning on working on along with their point values... and the total points of research topics listed_)

* (5 points) Integrate user authentication
    * I'm going to be using passport for user authentication
    * And account has been made for testing; I'll email you the password
    * see <code>cs.nyu.edu/~jversoza/ait-final/register</code> for register page
    * see <code>cs.nyu.edu/~jversoza/ait-final/login</code> for login page
* (4 points) Perform client side form validation using a JavaScript library
    * see <code>cs.nyu.edu/~jversoza/ait-final/my-form</code>
    * if you put in a number that's greater than 5, an error message will appear in the dom
* (5 points) vue.js
    * used vue.js as the frontend framework; it's a challenging library to learn, so I've assigned it 5 points

10 points total out of 8 required points (___TODO__: addtional points will __not__ count for extra credit_)


## [Link to Initial Main Project File](app.js) 

(___TODO__: create a skeleton Express application with a package.json, app.js, views folder, etc. ... and link to your initial app.js_)

## Annotations / References Used

(___TODO__: list any tutorials/references/etc. that you've based your code off of_)

1. [passport.js authentication docs](http://passportjs.org/docs) - (add link to source code that was based on this)
2. [tutorial on vue.js](https://vuejs.org/v2/guide/) - (add link to source code that was based on this)

