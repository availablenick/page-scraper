const fs = require('fs');
const https = require('https');
const urlm = require('url');

let paths = new Map();

let internalLinks = [];
let externalLinks = [];
let imageLinks = [];
let miscLinks = [];

let anchorReg = /<a( |\r\n|\r|\n)+(.*( |\r\n|\r|\n)+)?href=("[^"]+"|[^"][^ >]*)/gi;
let imgReg = /<img( |\r\n|\r|\n)+(.+( |\r\n|\r|\n)+)?src=("[^"]+"|[^"][^ >]*)/gi;
let urlReg = null;

new Promise((resolve) => {
  let inputURL = process.argv[2];
  if (!/https?:\/\//gi.test(inputURL))
    inputURL = 'https://' + inputURL;

  try {
    https.get(inputURL, { protocol: 'https:' }, (res) => {
      // URL Redirection
      if (300 <= res.statusCode && res.statusCode <= 399) {
        resolve(res.headers.location);
        return;
      }

      resolve(inputURL);
    });
  } catch (e) {
    https.get(inputURL, { protocol: 'http:' }, (res) => {
      if (300 <= res.statusCode && res.statusCode <= 399) {
        resolve(res.headers.location);
        return;
      }

      resolve(inputURL);
    });
  }
})
.then(initialURL => {
  let infoURL = new URL(initialURL);
  let initialDirectoryURL = getDirectoryURL(initialURL);
  if (initialDirectoryURL.length < infoURL.origin.length) {
    initialDirectoryURL = infoURL.origin;
    infoURL = new URL(initialDirectoryURL);
  }

  console.log('\n===================================');
  console.log('initial URL:', initialURL);
  console.log('directory:', initialDirectoryURL);
  console.log('===================================');

  paths.set(initialURL, true);
  urlReg = new RegExp(infoURL.host + infoURL.pathname, 'ig');

  connectTo(initialURL)
    .then(() => {
      console.log('\n\n');

      if (internalLinks.length > 0) {
        console.log('=================== INTERNAL LINKS ===================\n');
        for (let i = 0; i < internalLinks.length; i++) {
          link = internalLinks[i];
          console.log('   ', i, link);
        }
      }

      if (imageLinks.length > 0) {
        console.log('\n=================== IMAGE LINKS ===================\n');
        for (let i = 0; i < imageLinks.length; i++) {
          link = imageLinks[i];
          console.log('   ', i, link);
        }
      }

      if (externalLinks.length > 0) {
        console.log('\n=================== EXTERNAL LINKS ===================\n');
        for (let i = 0; i < externalLinks.length; i++) {
          link = externalLinks[i];
          console.log('   ', i, link);
        }
      }

      if (miscLinks.length > 0) {
        console.log('\n=================== MISC LINKS ===================\n');
        for (let i = 0; i < miscLinks.length; i++) {
          link = miscLinks[i];
          console.log('   ', i, link);
        }
      }

      console.log();
    });
})

function connectTo(url) {
  console.log('\n===========================================');
  console.log('checking:', url);

  anchorReg.lastIndex = 0;
  urlReg.lastIndex = 0;
  imgReg.lastIndex = 0;

  return new Promise((resolve) => {
    async function handleResponse(res) {
      // URL Redirection
      if (300 <= res.statusCode && res.statusCode <= 399) {
        await connectTo(res.headers.location);
        resolve();
        return;
      }

      // Error
      if (res.statusCode > 299) {
        console.log(res.statusMessage);
        console.log('===========================================');
        resolve();
        return;
      }

      // Parse data
      let data = '';
      res.on('data', (chunk) => { data += chunk });
      res.on('end', async () => {
        data = filterHTMLComments(data);

        let match = anchorReg.exec(data);
        let localInternalLinks = [];
        while (match) {
          href = match[4];
          if (href[0] === '"')
            href = href.slice(1, href.length - 1);

          // Get links to other pages
          match = anchorReg.exec(data);
          if (urlReg.test(href) || !/https?/gi.test(href)) {
            if (/mailto:/gi.test(href)) {
              miscLinks.push(href);
            } else {
              let newURL = urlm.resolve(url, href);
              contentType = await getContentType(newURL);
              if (/text\/html/gi.test(contentType)) {
                localInternalLinks.push(href);
              } else {
                miscLinks.push(newURL);
              }
            }
          } else {
            externalLinks.push(href);
          }
        }

        // Get links to images
        match = imgReg.exec(data);
        while (match) {
          src = match[4];
          if (src[0] === '"')
            src = src.slice(1, src.length - 1);

          let newURL = urlm.resolve(url, src);
          imageLinks.push(newURL);
          match = imgReg.exec(data);
        }

        console.log('finished');
        console.log('===========================================');

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
