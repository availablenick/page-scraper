const https = require('https');

url = 'https://www.ime.usp.br/~cris/';
https.get(url, (res) => {

  let data = '';
  res.on('data', (chunk) => { data += chunk });
  res.on('end', () => {
    console.log('data processed.');

    let regex = /<a href="?([^"]+?)"?>/ig;
    let match = regex.exec(data);
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
    
    while (match) {
      href = match[1];
      if (href[0] === '"')
        href = href.slice(1, href.length - 1);

      match = regex.exec(data);
      imgReg = new RegExp(imgFormats.join('|'), 'ig');
      if (new RegExp(url, 'g').test(href) || !/https?/ig.test(href)) {
        if (!/https?/ig.test(href)) {
          href = url + href;
        }

        if (imgReg.test(href)) {
          imageLinks.push(href);
        } else if (/mailto:/ig.test(href)){
          miscLinks.push(href); 
        } else {
          internalLinks.push(href);
        }
      } else if (/https?/ig.test(href)){
        externalLinks.push(href);
      } else {
        miscLinks.push(href);
      }
    }

    regex = /<img.*src="?([^"]+)"?\/?.*>/ig;
    match = regex.exec(data);
    while (match) {
      console.log(match[0]);
      src = match[1];
      if (!/https?/ig.test(src)) {
        src = url + src;
      }

      imageLinks.push(src);
      match = regex.exec(data);
    }

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
  });
});

//let regex = /aew/g;
