'use strict';

const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const logDir = './logs/daily';
const ErrorDir = './logs/error';

// Create the log directory if it does not exist
if (!(fs.existsSync(logDir) && fs.existsSync(ErrorDir))) {
     fs.mkdir(logDir,(err) => {
      console.log(`${logDir} has successfully created`);  
    })

    fs.mkdir(ErrorDir,(err1) => {
      console.log(`${ErrorDir} has successfully created`);
      });
  }

  const dailyRotateFileTransport = new transports.DailyRotateFile({
    filename: `${logDir}/%DATE%-results.log`,
    datePattern: 'YYYY-MM-DD',
    maxsize: 5242880
   });

   const dailyRotateErrorFileTransport = new transports.DailyRotateFile({
    filename: `${ErrorDir}/%DATE%-error.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxsize: 5242880
   });


  const logger = caller => {
    return createLogger({
      level: 'debug',
      colorize: true,
      handleExceptions: true,
      format: format.combine(
        format.label({ label: path.basename(caller) }),
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(
          info =>
            `${info.timestamp} [${info.label}]: ${info.message}`
        )
      ),
      transports: [new transports.Console(),dailyRotateFileTransport,dailyRotateErrorFileTransport],
      exitOnError: false
    });
  };



module.exports = logger;
