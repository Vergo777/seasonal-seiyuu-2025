I want to build a webapp called "seasonal seiyuu" which for a given latest season of anime, lets me look up by voice actor the shows in the season that they're part of. Fans of voice actors such as myself decide what shows to pick up on this basis.

Jikan (https://github.com/jikan-me/jikan-rest) has a myanimelist REST API that can provide info on anime, characters, people/voice actors and seasons.

I want to build this using Google anti-gravity without writing a single line of code. 

Additionally: 

- I would like the backend to be in Java Spring Boot

- I'm ok with the frontend being whatever is the most suitable choice to easily host on my personal VPS and connect to the Spring Boot backend.
  
- I do NOT want the overhead of an actual database. Instead, let's keep it simple and have the fetched data saved/cached
  in a local file so that all subsequent requests for the website just refer to this local file until I explicitly delete
  this or trigger a refresh for a new season of anime. 
  
- I want the backend and frontend to be part of the same codebase, just split up into separate folders.
  
The website should be laid out as follows: 

- The landing page should show a grid of all the voice actors who are part of shows in the current latest season. It should
  show their name, a picture of them and info on the number of shows they're part of in the current season.
  
- When clicking on any voice actor, it should show a detailed page of theirs which lists out all the shows in the current
  season they're part of and which character they're playing in it along with associated images.
  
- Additonally, this detailed page should also contain a tab/section where the user can browse the full set of all-time
roles/characters they've played throughout their career - not just constrained to the current season.