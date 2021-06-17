# Chitragupta
This is a support package for the [winston](https://www.npmjs.com/package/winston) library that adds meta data for the logs and structures them into json.
The package is tested with winston 2.x version.

## Installation

```bash
npm install https://github.com/browserstack/chitragupta-node
```

## Usage

The informative structured logging can be achieved in 2 steps:
1. Setting up the logger
2. Setting up the contexts in server/process/worker

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

### Setting up contexts in Server, Services and Background Workers

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
OR
```node
function requestHandler(request, response) {
  logger.log('info', 'processing request', {'data': {'request': {'method': 'POST'}}});
  response.end();
}
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
OR
```node
function process_some_crazy_stuff(a, b, c) {
  logger.log('info', a, {'data': {'name': 'process_name', 'execution_id': 'some_unique_id'}});
  logger.log('info', b, {'data': {'name': 'some_other_process_name', 'execution_id': 'some_other_unique_id'}});
}
```
For workers
```node
const processFromQueue = (n) => {
  getCurrentQueue()
    .then(someAwesomeStuff)
    .catch(e => {
      logger.log('info', 'Exceptions');
      setTimeout(getWorkFromRedis, 1000);
    });
}

const getWorkFromRedis = (n, first_run) => {
  // Use the following function to set the worker job id if required
  // Chitragupta.setWorkerJobId('unique-job-id', functionToBeCalled, all, the, args, that, you, would, like, to, pass);
  Chitragupta.setWorkerJobId(jobId, processFromQueue, n);
}

// Chitragupta.setupWorkerLogger(uniqueNameOfTheWorker, functionToBeCalled, all, the, args, that, you, would, like, to, pass);
Chitragupta.setupWorkerLogger('redisWorker', getWorkFromRedis, 1, true);
```
OR
```node
const processFromQueue = (n) => {
  getCurrentQueue()
    .then(someAwesomeStuff)
    .catch(e => {
      logger.log('info', 'Exceptions', {'data': {'worker_name': 'worker_name', 'thread_id': 'some_thread_id'}});
      setTimeout(getWorkFromRedis, 1000);
    });
}
```
### Additional Features
For the logs where `log.kind` is missing, first 40 chars of dynamic_data is populated to uniquely identify each log in a restricted fashion.

## Contributing

Run eslint using the following command
```bash
# Please install the eslint supported node version using `nvm install v12.14.1`
npx eslint .
```
Bug reports and pull requests are welcome on GitHub at https://github.com/browserstack/chitragupta-node.

## License

The package is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
