var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");

module.exports = function(app, config, passport) {
    


 // validate JWT on all API calls
    router.use("/", function(req, res, next) {
        // check header or url parameters or post parameters for token
        var token = req.headers['authorization'] || req.body.token || req.query.token || ""; 
        jwt.verify(token, config.passport.sessionSecret, function(err, decoded) {      
            if (err) {
              return res.status(403).send({ success: false, message: 'Failed to authenticate token.' });    
            } else {
              if (decoded && decoded.uid) {
                  // Set user UID in the request
                  req.user = {uid: decoded.uid, displayName: decoded.displayName};
                  // In a real application the user profile should be retrieved from the persistent storage here
                  next();
              } else {
                  // return an error
                  return res.status(403).send({success: false,message: 'Invalid ID in token'});
              }
            }
        });
    });


    
 // Example of an API call  
    router.get("/profile", 
            function(req, res) {
                // req.user should be set from the token validation
                res.json({result: req.user});
            }
    );   
    
    return router;
};
