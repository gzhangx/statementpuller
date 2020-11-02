const http = require('http');

http.createServer(function (req, res) {
    var body;

    body = '';
    req.on('data', chunk=>body += chunk);
    req.on('end', ()=> {
        console.log(req.method + ' ' + req.url);

        for (prop in req.headers) {
            console.log(prop + ': ' + req.headers[prop]);
        }

        if (body.length > 0) {
            console.log('\n' + body);
        }
        console.log('');

        res.writeHead(200);
        res.end();
    });

    req.on('err', function (err) {
        console.error(err);
    });
}).listen(8090, function () {
    console.log('listening on port ');
});