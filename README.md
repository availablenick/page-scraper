# Page scraper
A simple page scraper

## Description
A page scraper that gather all the hypertext links and image links either in a single page or under a specific address's directory.

## Prerequisites
You will need to install [Node.js](https://nodejs.org/en/)

## Option flags
You can use the flags below:
* -a address | --addr address: specifies the url to get the links from;
* -f | --follow-links: looks for all links under the specified address's directory.
* --write-to-file filename: writes gathered links to a file named filename.  
* --html filename: creates an HTML file named filename and put all the gathered links into it.

## Examples
The following command gets all links to other pages and images from [https://example.com](https://example.com):

```
node scraper.js -a https://example.com
```

The following command gets all links to other pages and images under [https://example.com/dir](https://example.com/dir):

```
node scraper.js -a https://example.com/dir -f
```

The following command gets all links to other pages and images from [https://example.com](https://example.com) and write them to a file named links.txt:

```
node scraper.js -a https://example.com --write-to-file links.txt
```

The following command gets all links to other pages and images from [https://example.com](https://example.com) and put them into an HTML file named index.html:

```
node scraper.js -a https://example.com --html index.html
```
