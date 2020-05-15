const fs = require('fs');
const https = require('https');
const urlm = require('url');

let visitedURLS = new Map();
let storedURLS = new Map();

let internalLinks = [];
let externalLinks = [];
let imageLinks = [];
let miscLinks = [];

let anchorReg = /<a( |\r\n|\r|\n)+(((?!href).)+( |\r\n|\r|\n)+)?href( |\r\n|\r|\n)*=( |\r\n|\r|\n)*("[^"]+"|[^"][^ >]*)/gi;
let anchorGroup = 7;
let imageReg = /<img( |\r\n|\r|\n)+(((?!src).)+( |\r\n|\r|\n)+)?src( |\r\n|\r|\n)*=( |\r\n|\r|\n)*("[^"]+"|[^"][^ >]*)/gi;
let imageGroup = 7;
let urlReg = null;

let optionFlags = {
  f: false,
  'write-to-file': '',
  html: '',
};

new Promise((resolve) => {
  let inputURL = '';
  for (let i = 2; i < process.argv.length; i++) {
    arg = process.argv[i];
    if (arg === '-a' || arg === '--addr')
      if (i + 1 < process.argv.length)
        inputURL = process.argv[i + 1];

    if (arg === '-f' || arg === '--follow-links')
      optionFlags.f = true;

    if (arg === '--write-to-file')
      if (i + 1 < process.argv.length)
        optionFlags['write-to-file'] = process.argv[i + 1];

    if (arg === '--html')
      if (i + 1 < process.argv.length)
        optionFlags.html = process.argv[i + 1];

    if (arg === '-h' || arg === '--help') {
      resolve(-1);
      return;
    }
  }

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
      // URL Redirection
      if (300 <= res.statusCode && res.statusCode <= 399) {
        resolve(res.headers.location);
        return;
      }

      resolve(inputURL);
    });
  }
})
.then(result => {
  if (result === -1) {
    console.log(
      'Usage: node scraper.js',
      '[-a address | --addr address]',
      '[-f | --follow-links]',
      '[--write-to-file filename]'
    );

    return;
  }

  let initialURL = result;
  let infoURL = new URL(initialURL);
  let initialDirectoryURL = getDirectoryURL(initialURL);
  if (initialDirectoryURL.length < infoURL.origin.length) {
    initialDirectoryURL = infoURL.origin;
  }

  infoURL = new URL(initialDirectoryURL);

  console.log('\n===================================');
  console.log('initial URL:', initialURL);
  console.log('directory:', initialDirectoryURL);
  console.log('===================================');

  // Remove protocol and hash
  let cleanURL = initialURL.replace(/https?:\/\//i, '').replace(/#.*/i, '');
  visitedURLS.set(cleanURL, true);
  urlReg = new RegExp(infoURL.host + infoURL.pathname, 'i');

  connectTo(initialURL)
    .then(() => {
      let data = '';
      let htmlData = '<html><body>';
      console.log('\n\n');

      if (internalLinks.length > 0) {
        data += '================= INTERNAL LINKS =================' + '\n\n';
        htmlData += '<h1>Internal links</h1>';
        for (let i = 0; i < internalLinks.length; i++) {
          link = internalLinks[i];
          data += '    ' + i + ' ' + link + '\n';

          if (optionFlags.html !== '') {
            htmlData += '<ul><li><a href="' + link + '">' + link + '</a></li></ul>';
          }
        }
      }

      if (imageLinks.length > 0) {
        data += '\n================= IMAGE LINKS =================' + '\n\n';
        htmlData += '<h1>Image links</h1>';
        for (let i = 0; i < imageLinks.length; i++) {
          link = imageLinks[i];
          data += '    ' + i + ' ' + link + '\n';

          if (optionFlags.html !== '') {
            htmlData += '<ul><li><a href="' + link + '">' + link + '</a></li></ul>';
          }
        }
      }

      if (externalLinks.length > 0) {
        data += '\n================= EXTERNAL LINKS =================' + '\n\n';
        htmlData += '<h1>External links</h1>';
        for (let i = 0; i < externalLinks.length; i++) {
          link = externalLinks[i];
          data += '    ' + i + ' ' + link + '\n';

          if (optionFlags.html !== '') {
            htmlData += '<ul><li><a href="' + link + '">' + link + '</a></li></ul>';
          }
        }
      }

      if (miscLinks.length > 0) {
        data += '\n================= MISC LINKS =================' + '\n\n';
        htmlData += '<h1>Misc links</h1>';
        for (let i = 0; i < miscLinks.length; i++) {
          link = miscLinks[i];
          data += '    ' + i + ' ' + link + '\n';

          if (optionFlags.html !== '') {
            htmlData += '<ul><li><a href="' + link + '">' + link + '</a></li></ul>';
          }
        }
      }

      console.log(data);
      if (optionFlags.html !== '') {
        htmlData += '</body></html>';
        console.log('creating html file...');
        filename = optionFlags.html;
        fs.writeFile(filename, htmlData, (err) => {
          if (err)
            throw err;

          console.log('finished');
        });
      } else if (optionFlags['write-to-file'] !== '') {
          console.log('writing to file...');
          filename = optionFlags['write-to-file'];
          fs.writeFile(filename, data, (err) => {
            if (err)
              throw err;

            console.log('finished');
          });
      }
    });
})

function connectTo(url) {
  console.log('\n===========================================');
  console.log('checking:', url);

  anchorReg.lastIndex = 0;
  imageReg.lastIndex = 0;

  return new Promise((resolve) => {
    async function handleResponse(res) {
      console.log(res.statusCode);
      // URL Redirection
      if (300 <= res.statusCode && res.statusCode <= 399) {
        console.log('Redirection');
        console.log('===========================================');
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
        let localLinks = [];
        while (match) {
          href = match[anchorGroup];
          if (href[0] === '"')
            href = href.slice(1, href.length - 1);

          // Get links to other pages
          match = anchorReg.exec(data);
          if (urlReg.test(href) || !/https?/i.test(href)) {
            let newURL = urlm.resolve(url, href);
            if (/mailto:/i.test(href)) {
              checkAndStoreURL(href, miscLinks);
            } else {
              if (urlReg.test(newURL)) {
                contentType = await getContentType(newURL);
                if (/text\/html/i.test(contentType)) {
                  localLinks.push(href);
                } else {
                  checkAndStoreURL(newURL, miscLinks);
                }
              } else {
                checkAndStoreURL(newURL, externalLinks);
              }
            }
          } else {
            checkAndStoreURL(href, externalLinks);
          }
        }

        // Get links to images
        match = imageReg.exec(data);
        while (match) {
          src = match[imageGroup];
          if (src[0] === '"')
            src = src.slice(1, src.length - 1);

          let newURL = urlm.resolve(url, src);
          checkAndStoreURL(newURL, imageLinks);
          match = imageReg.exec(data);
        }

        console.log('finished');
        console.log('===========================================');

        for (let path of localLinks) {
          let newURL = urlm.resolve(url, path);
          checkAndStoreURL(newURL, internalLinks);
        
          if (optionFlags.f === true) {
            // Remove protocol and hash
            let cleanURL = newURL.replace(/https?:\/\//i, '').replace(/#.*/i, '');
            if (!visitedURLS.has(cleanURL) || visitedURLS.get(cleanURL) === false) {
              visitedURLS.set(cleanURL, true);
              await connectTo(newURL);
            }
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

function checkAndStoreURL(url, linksList) {
  if (!storedURLS.has(url) || storedURLS.get(url) === false) {
    linksList.push(url);
    storedURLS.set(url, true);
  }
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
