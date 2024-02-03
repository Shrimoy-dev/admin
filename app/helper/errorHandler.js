// module.exports = function(err) {
//     let errorMessages = {};
//     for (let errKey in err.errors) {
//         if (err.errors.hasOwnProperty(errKey)) {
//             errorMessages.message = err.errors[errKey].message;
//             //errorMessages.push(err.errors[errKey].message);
//         }
//     }
//     return errorMessages;
// };



const appRoot = require('app-root-path');
const winston = require('winston');
const { combine, timestamp, json,colorize } = winston.format;


// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
    timestamp: true
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: true
  },
};

// const myformat = winston.format.combine(
//     winston.format.colorize(),
//     winston.format.timestamp(),
//     winston.format.align(),
//     winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
//   );
  

// instantiate a new Winston Logger with the settings defined above
const logger = new winston.createLogger({
    //format:winston.format.cli(),

    format: combine(timestamp(), json()),
    transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;
