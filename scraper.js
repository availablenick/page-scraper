const https = require('https');
const http = require('http');
const fs = require('fs');

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

function connectTo(host, path) {
  url = host + path;
  console.log('\nzzzzzzzzzzzzzzzzzzz');
  console.log('current checking:', url);
  console.log('zzzzzzzzzzzzzzzzzzz\n');

  anchorReg.lastIndex = 0;
  formatReg.lastIndex = 0;
  hostReg.lastIndex = 0;
  imgReg.lastIndex = 0;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk });
      res.on('end', async () => {
        console.log('data processed.');
        data = filterHTMLComments(data);
        /* console.log('filtered data:');
        console.log(data); */

        let match = anchorReg.exec(data);
        let localInternalLinks = [];
        let localExternalLinks = [];
        let localImageLinks = [];
        let localMiscLinks = [];
        while (match) {
          href = match[1];
          if (href[0] === '"')
            href = href.slice(1, href.length - 1);

          match = anchorReg.exec(data);
          if (hostReg.test(href) || !/https?/ig.test(href)) {
            let m = hostReg.exec(href);
            if (m) {
              href = href.slice(hostReg.lastIndex, href.length);
            }

            if (formatReg.test(href)) {
              imageLinks.push(href);
              localImageLinks.push(href);
            } else if (/mailto:/ig.test(href)){
              miscLinks.push(href);
              localMiscLinks.push(href);
            } else {
              localInternalLinks.push(href);
            }
          } else if (/https?/ig.test(href)){
            externalLinks.push(href);
            localExternalLinks.push(href);
          } else {
            miscLinks.push(href);
            localMiscLinks.push(href);
          }
        }

        match = imgReg.exec(data);
        while (match) {
          src = match[1];
          if (!/https?/ig.test(src)) {
            src = host + src;
          }

          localImageLinks.push(src);
          match = imgReg.exec(data);
        }

        console.log('=================== INTERNAL LINKS ===================');
        for (let link of localInternalLinks) {
          console.log('   ', link);
        }

        console.log('=================== IMAGE LINKS ===================');
        for (let link of localImageLinks) {
          console.log('   ', link);
        }

        console.log('=================== EXTERNAL LINKS ===================');
        for (let link of localExternalLinks) {
          console.log('   ', link);
        }

        console.log('=================== MISC LINKS ===================');
        for (let link of localMiscLinks) {
          console.log('   ', link);
        }

        for (let path of localInternalLinks) {
          //console.log('next path:', path);
          if (!paths.has(path) || paths.get(path) === false) {
            paths.set(path, true);
            internalLinks.push(host + path);
            await connectTo(host, path);
          }
        }

        resolve();
        
        if (path === initialPath) {
          console.log('=================== INTERNAL LINKS ===================');
          for (let link of internalLinks) {
            console.log('   ', link);
          }

          console.log('=================== IMAGE LINKS ===================');
          for (let link of imageLinks) {
            console.log('   ', link);
          }

          console.log('=================== EXTERNAL LINKS ===================');
          for (let link of externalLinks) {
            console.log('   ', link);
          }

          console.log('=================== MISC LINKS ===================');
          for (let link of miscLinks) {
            console.log('   ', link);
          }
        }
      });
    });
  });
  /* } catch (e) {
    http.get(url, handleResponse);
  } */
}

/* let host = 'http://localhost:8000';
let initialPath = '/p1.html'; */
let host = 'https://www.ime.usp.br/~cris/';
initialPath = '';

let paths = new Map();
paths.set(initialPath, true);

let internalLinks = [];
let externalLinks = [];
let imageLinks = [];
let miscLinks = [];

let imgFormats = [
  'bmp',
  'jpg',
  'jpeg',
  'png'
];

let anchorReg = /<a href="?([^"]+?)"?>/ig;
let formatReg = new RegExp(imgFormats.join('|'), 'ig');
let hostReg = new RegExp(host, 'g');
let imgReg = /<img.*src="?([^"]+)"?\/?.*>/ig;

connectTo(host, initialPath);
