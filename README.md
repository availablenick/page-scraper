
# page-scraper
A simple page scraper

## Description
A page scraper that gather all the hypertext links and image links either in a single page or under a specific address's directory.

## Prerequisites
You will need to install [Node.js](https://nodejs.org/en/)

## Option flags
You can use the flags below:

* -a address | --addr address: specify the url to get the links from;
* -f | --follow-links: look for all links under the specified address's directory.


## Examples
The following command gets all links to another pages and images from [https://github.com/availablenick/password-generator](https://github.com/availablenick/password-generator):
``` 
node scraper.js -a https://github.com/availablenick/password-generator
```

The following command gets all links to another pages and images under [https://github.com/availablenick/password-generator](https://github.com/availablenick/password-generator):

``` 
node scraper.js -a https://github.com/availablenick/password-generator -f
```
