const http = require('node:http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
    console.log(req.url, req.method);

    // Analizza l'URL richiesto
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(__dirname, url);

    // Verifica se il file richiesto esiste
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Se il file non esiste, restituisci un errore 404
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.end(data);
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});