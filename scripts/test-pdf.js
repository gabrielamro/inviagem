const pdf = require('pdf-parse');
console.log('pdf is array?', Array.isArray(pdf));
console.log('pdf is function?', typeof pdf === 'function');
console.log('keys:', Object.keys(pdf));
