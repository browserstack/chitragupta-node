# Chitragupta
This is a support package for the [winston](https://www.npmjs.com/package/winston) library that adds meta data for the logs and structures them into json.
The package is tested with winston 2.x version.

## Installation

```bash
npm install https://github.com/browserstack/chitragupta-node
```

## Usage

### Setting Up the Logger

#### Winston 2.x
```node
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
```

#### Winston 3.x
```node
const winston = require('winston');
const { Chitragupta } = require('chitragupta');

const jsonLogFormatter = winston.format.printf( ({ level, message, ...meta}) => {
  const options = {level: level, message: message, meta: meta};
  return Chitragupta.jsonLogFormatter(options);
});

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: jsonLogFormatter,
    })
  ],
});
```

### Setting Up Server, Services and Background Workers

For web servers built with node [http](https://nodejs.org/api/http.html) package
```node
const http = require("http");

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

For processes/services
```node
function process_some_crazy_stuff(a, b, c) {
  logger.log('info', a);
  logger.log('info', b);
  logger.log('info', c);
}

// Chitragupta.setupProcessLogger(uniqueNameOfTheProcess, functionToBeCalled, all, the, args, that, you, would, like, to, pass);
Chitragupta.setupProcessLogger('processing_crazy_stuff', process_some_crazy_stuff, 1, true, 45);
```

For workers
```node
const getWorkFromRedis = (n, first_run) =>
  getCurrentQueue()
    .then(someAwesomeStuff)
    .catch(e => {
      logger.log('info', 'Exceptions');
      setTimeout(getWorkFromRedis, 1000);
    });

// Chitragupta.setupProcessLogger(uniqueNameOfTheProcess, functionToBeCalled, all, the, args, that, you, would, like, to, pass);
Chitragupta.setupWorkerLogger('redisWorker', getWorkFromRedis, 1, true);
```
## Contributing

Run eslint using the following command
```bash
# Please install the eslint supported node version using `nvm install v12.14.1`
npx eslint .
```
Bug reports and pull requests are welcome on GitHub at https://github.com/browserstack/chitragupta-node.

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
