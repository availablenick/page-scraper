const fs = require('fs');
const https = require('https');
const urlm = require('url');

function filterHTMLComments(code) {
  let filteredCode = '';
  let regex = /<!--(.|\r\n|\r|\n)*?-->/g;
  let match = regex.exec(code);
  let start = 0;
  while (match) {
    filteredCode += code.slice(start, match.index);
    start = regex.lastIndex;
    match = regex.exec(code);
  }

  filteredCode += code.slice(start, code.length);
  return filteredCode;
}

function getContentType(url) {
  return new Promise((resolve) => {
    info = new URL(url);
    try {
      https.get(url, { protocol: 'https:' }, (res) => {
        resolve(res.headers['content-type']);
      });
    } catch(e) {
      https.get(url, { protocol: 'http:' }, (res) => {
        resolve(res.headers['content-type']);
      });
    }
  });
}

function getDirectoryURL(url) {
  let i = 0;
  for (i = url.length - 1; i >= 0 && url[i] !== '/'; i--);

  return url.slice(0, i + 1);
}

/* function getParentDirectoryURL(url) {
  let localURL = url;
  if (!isDirectory(localURL))
    localURL = getDirectoryURL(localURL);

  let i = localURL.length - 1;
  if (localURL[i] === '/')
    i--;

  while (localURL[i] !== '/') {
    i--;
  }

  return localURL.slice(0, i);
} */

/* function makeURL(url, path) {
  // Check whether path is absolute
  urlReg.lastIndex = 0;
  if (urlReg.test(path)) {
    console.log('no changes on:', path);
    return path;
  }

  // Check whether path is relative to root URL
  let directory = '';
  let amendedPath = path;
  if (path[0] === '/') {
    directory = rootURL;
    amendedPath = amendedPath.slice(1);
  } else {
    directory = getDirectoryURL(url);
  }

  // Check whether path has ../ or ./ and
  if (!/https?/gi.test(amendedPath)) {
    if (/^\/?\.\.\/.+/mg.test(amendedPath)) {
      directory = getParentDirectoryURL(directory);
      amendedPath = amendedPath.slice(3);
    }
  }

  // If url corresponds to a directory, it must end with a slash,
  // otherwise, it mustn't.
  if (!/\.[^.]+/gi.test(amendedPath)) { // Check whether it is not a file
    if (amendedPath[amendedPath.length - 1] !== '/')
      amendedPath += '/';
  }

  return directory + '/' + amendedPath;
} */

function connectTo(url) {
  console.log('\nzzzzzzzzzzzzzzzzzzz');
  let rootz = getDirectoryURL(url);
  console.log('current checking:', url);
  console.log(rootz);
  console.log('zzzzzzzzzzzzzzzzzzz\n');

  anchorReg.lastIndex = 0;
  urlReg.lastIndex = 0;
  imgReg.lastIndex = 0;

  return new Promise((resolve) => {
    async function handleResponse(res) {
      if (300 <= res.statusCode && res.statusCode <= 399) {
        await connectTo(res.headers.location);
        resolve();
        return;
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk });
      res.on('end', async () => {
        console.log('data processed.');
        data = filterHTMLComments(data);
        console.log('filtered data length:');
        console.log(data.length);
        /* console.log(data); */

        let match = anchorReg.exec(data);
        let localInternalLinks = [];
        let localExternalLinks = [];
        let localImageLinks = [];
        let localMiscLinks = [];
        while (match) {
          href = match[4];
          if (href[0] === '"')
            href = href.slice(1, href.length - 1);

          match = anchorReg.exec(data);
          if (urlReg.test(href) || !/https?/gi.test(href)) {
            if (/mailto:/gi.test(href)) {
              miscLinks.push(href);
              localMiscLinks.push(href);
            } else {
              //let newURL = makeURL(url, href);
              let newURL = urlm.resolve(url, href);
              contentType = await getContentType(newURL);
              if (/text\/html/gi.test(contentType)) {
                localInternalLinks.push(href);
              } else {
                miscLinks.push(href);
                localMiscLinks.push(href);
              }
            }
          } else {
            externalLinks.push(href);
            localExternalLinks.push(href);
          }
        }

        match = imgReg.exec(data);
        while (match) {
          src = match[4];
          if (src[0] === '"')
            src = src.slice(1, src.length - 1);

          //let newURL = makeURL(url, src);
          let newURL = urlm.resolve(url, src);
          imageLinks.push(newURL);
          localImageLinks.push(newURL);
          match = imgReg.exec(data);
        }

        /* console.log('=================== INTERNAL LINKS ===================');
        for (let i = 0; i < localInternalLinks.length; i++) {
          link = localInternalLinks[i];
          console.log('   ', i, link);

          //let newURL = urlm.resolve(url, link);
          //internalLinks.push(newURL);
        }

        console.log('=================== IMAGE LINKS ===================');
        for (let i = 0; i < localImageLinks.length; i++) {
          link = localImageLinks[i];
          console.log('   ', i, link);
        }

        console.log('=================== EXTERNAL LINKS ===================');
        for (let i = 0; i < localExternalLinks.length; i++) {
          link = localExternalLinks[i];
          console.log('   ', i, link);
        }

        console.log('=================== MISC LINKS ===================');
        for (let i = 0; i < localMiscLinks.length; i++) {
          link = localMiscLinks[i];
          console.log('   ', i, link);
        } */

        for (let path of localInternalLinks) {
          let newURL = urlm.resolve(url, path);
          if (!paths.has(newURL) || paths.get(newURL) === false) {
            paths.set(newURL, true);
            internalLinks.push(newURL);
            await connectTo(newURL);
          }
        }

        resolve();
      });
    }

    try {
      https.get(url, { protocol: 'https:' }, handleResponse);
    } catch (e) {
      https.get(url, { protocol: 'http:' }, handleResponse);
    }
  });
}

/* let host = 'http://localhost:8000';
let initialPath = '/p1.html'; */

let initialURL = 'https://www.ime.usp.br/~cris/aulas';
if (!/https?:\/\//gi.test(initialURL))
  initialURL = 'https://' + initialURL;

let infoURL = new URL(initialURL);
let initialDirectoryURL = getDirectoryURL(initialURL);
if (initialDirectoryURL.length < infoURL.origin.length)
  initialDirectoryURL = infoURL.origin;
  infoURL = new URL(initialDirectoryURL);

console.log('directory:', initialDirectoryURL);

let paths = new Map();
paths.set(initialURL, true);

let internalLinks = [];
let externalLinks = [];
let imageLinks = [];
let miscLinks = [];

let anchorReg = /<a( |\r\n|\r|\n)+(.*( |\r\n|\r|\n)+)?href=("[^"]+"|[^"][^ >]*)/gi;
let imgReg = /<img( |\r\n|\r|\n)+(.+( |\r\n|\r|\n)+)?src=("[^"]+"|[^"][^ >]*)/gi;
let urlReg = new RegExp(infoURL.host + infoURL.pathname, 'ig');

connectTo(initialURL)
  .then(() => {
    console.log();
    console.log();
    console.log();
    console.log('=================== INTERNAL LINKS ===================');
    for (let i = 0; i < internalLinks.length; i++) {
      link = internalLinks[i];
      console.log('   ', i, link);
    }

    console.log('=================== IMAGE LINKS ===================');
    for (let i = 0; i < imageLinks.length; i++) {
      link = imageLinks[i];
      console.log('   ', i, link);
    }

    console.log('=================== EXTERNAL LINKS ===================');
    for (let i = 0; i < externalLinks.length; i++) {
      link = externalLinks[i];
      console.log('   ', i, link);
    }

    console.log('=================== MISC LINKS ===================');
    for (let i = 0; i < miscLinks.length; i++) {
      link = miscLinks[i];
      console.log('   ', i, link);
    }
  });
