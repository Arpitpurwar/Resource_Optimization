var ibmdb = require('ibm_db');
const logger = require('../../common/logconfig')(__filename);

// ibmdb.

module.exports = {

	var: connString = "DRIVER={DB2};"
             + "DATABASE=" + process.env.DATABASE_NAME + ";"
             + "UID=" + process.env.DATABASE_USER + ";"
             + "PWD=" + process.env.DATABASE_PASSWORD + ";"
             + "HOSTNAME=" + process.env.DATABASE_HOST + ";"
             + "PORT=" + process.env.DATABASE_PORT +";"
             + "PROTOCOL=TCPIP;",
  
   mydb : ibmdb.openSync(connString, function (err, conn) {
    if (err) {
      return logger.error("error: ", err.message);
    } else {
      return logger.info("database connected successfully",conn);
    }
  })
}