var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    querystring = require('querystring'),
    port = process.argv[2] || 4000;
    targetHost = process.argv[3] || '10.133.20.98',
    targetPort = process.argv[4] || '8080';

http.globalAgent.maxSockets = 100;

http.createServer(function(request, response) {
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), "/feprocessor/app/", uri)
    , body = '';
    if (uri === '/processCommand') {
      console.log('************')
      request.on('data', function (data) {
        console.log('----------------')
        body += data;
        console.log(body)

        var post_options = {
          host: targetHost,
          port: targetPort,
          path: '/smartapp/processCommand',
          method: 'POST',
          agent : false ,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length
          }
        };

        // Set up the request
        var post_req = http.request(post_options, function(res) {
          //console.log(res)
            var dt = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
              dt += chunk;
              console.log('Response: ' + chunk);
            });
            res.on('end', function () {
              console.log('Response')
              console.log(dt);
              response.writeHead(200, {"Content-Type": "application/json"});
              response.write(JSON.stringify({'res': dt}));
              response.end();
            })
            res.on('error', function (e) {
              console.log('problem with request: ' + e.message);
              response.writeHead(200, {"Content-Type": "application/json"});
              response.write({'res': e.message});
              response.end();
            });
        });

        post_req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });

        // post the data
        post_req.write(body);
        post_req.end();

      });
    // An object of options to indicate where to post to
    
  } else {

    path.exists(filename, function(exists) {
      if(!exists) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if (fs.statSync(filename).isDirectory()) filename += '/index.html';

      fs.readFile(filename, "binary", function(err, file) {
        if(err) {        
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        response.writeHead(200);
        response.write(file, "binary");
        response.end();
      });
    });

  }

    //console.log(filename)
  
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
