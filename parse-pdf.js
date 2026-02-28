const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('Attendance PUSH Communication Protocol 4.0.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf-text.txt', data.text);
    console.log('Done reading PDF');
}).catch(err => {
    console.error(err);
});
