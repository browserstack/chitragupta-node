# Chitragupta
This is a support package for the [winston](https://www.npmjs.com/package/winston) library that adds meta data for the logs and structures them into json.
The package is tested with winston 2.x version.

## Installation

```bash
npm install https://github.com/browserstack/chitragupta-node
```

## Usage

For web servers built with node [http](https://nodejs.org/api/http.html) package
```node
const http = require("http");
const winston = require('winston');
const { Chitragupta } = require('chitragupta');


// Configure your logger's formatter
var logger = new winston.Logger({
  level: 'info',
  transports: [
    new (winston.transports.Console)({
      formatter: Chitragupta.jsonLogFormatter
    })]
});


// Initialize and add meta data for the server
function requestHandler(request, response) {
  logger.log('info', 'processing request');
  response.end();
}

var server = http.createServer(function(request, response) {
  // Chitragupta.setupServerLogger(loggerObject, request, response, userId, requestHandler);
  Chitragupta.setupServerLogger(logger, request, response, 123, requestHandler);
});
server.listen(8080);
```

For processes written using node
```node
const winston = require('winston');
const { Chitragupta } = require('chitragupta');

// Configure your logger's formatter
const logger = new (winston.Logger)({
  level: 'info',
  transports: [new (winston.transports.Console)({
    formatter: Chitragupta.jsonLogFormatter
  })],
});

function process_some_crazy_stuff(a, b, c) {
  logger.log('info', a);
  logger.log('info', b);
  logger.log('info', c);
}

// Chitragupta.setupProcessLogger(uniqueNameOfTheProcess, functionToBeCalled, all, the, args, that, you, would, like, to, pass);
Chitragupta.setupProcessLogger('processing_crazy_stuff', process_some_crazy_stuff, 1, true, 45);
```
## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/browserstack/chitragupta-node.

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
