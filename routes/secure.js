var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");
const logger = require('../common/logconfig')(__filename);
const path = require('path');

var relayHandler = function relayHandler(req, res) {
    var relayState = req.query && req.query.RelayState || req.body && req.body.RelayState; 
    var hashQuery = relayState && relayState.match(/^\#/) && ("/app"+relayState) || relayState  || "/"; 
    res.redirect(hashQuery);
};

module.exports = function(app, config, passport) {
    router.get("/accessDenied",   function(req, res) {  logger.error(" Access Denied"); 
    res.status(404).send({"msg":"Access Denied by IBM w3id"}); }   );
    
 // Main page requires an authenticated user    
    router.get("/", 
            function(req, res) {
                if (req.user) {
                  res.sendFile(path.join(__dirname,'..','dist','index.html'));
                } else {
            
                    res.redirect('/login');
                }
            }
    );

 // Example of checking privileges a specific page and adding a relayState
    // router.get("/privilegedArea", 
    //         function(req, res) {
    //             if (req.user) { // Add more checks for user attributes if necessary
    //             	res.render("index", {title: 'SSO Demo - Privileged Content', user : req.user});
    //             } else {
    //             	res.render("samlPost", {logout: false, 
    //                     config: {httpPostEntryPoint: "/login", /* Do not use location hash paramter */ postHash: false, method: 'GET'}, 
    //                     query: {SAMLRequest: "", RelayState:"/privilegedArea"}});
    //             }
    //         }
    //     );   

 // Example of protected pages using hash location for routing
    // router.get("/app", 
    //         function(req, res) {
    //             if (req.user) { // Add more checks for user attributes if necessary
    //             	res.render("index", {title: 'SSO Demo - Application Content', user : req.user});
    //             } else {
    //             	res.render("samlPost", {logout: false, 
    //                     config: {httpPostEntryPoint: "/login", /* Use location hash parameter for relayState */ postHash: true, method: 'GET'}, 
    //                     query: {SAMLRequest: "", RelayState:""}});
    //             }
    //         }
    //     );
    
 // JWT example - issue token    
   //  router.get("/getToken", 
   //          function(req, res) {
   //              if (req.user) {
   //                  // Generate JWT - set expire to 3 minutes to test token expiration 
   //                  // display name is encoded into the token as an example, real application usually should not need it here
   //                  res.json({success: true,
   //                            token: jwt.sign({uid:req.user.uid, displayName: req.user.displayName}, config.passport.sessionSecret, {expiresIn: 3*60 })  
   //                      });
   //              } else {
   //                  res.json({token: null});
   //              }
   //          }
   //  );    
// Example of a resource not requiring authentication
   //  router.get("/open", 
   //          function(req, res) {
   //            res.render("index", {title: 'SSO Demo', user : req.user || {displayName: "Anonymous" , blueGroups: [] } });
   //          }
   //  );
    
 // Start SAML login process
    router.get("/login",
       passport.authenticate(config.passport.strategy, {/*successRedirect : "/", */failureRedirect : "/accessDenied"}),
       relayHandler);

 // Process callback from IDP for login
    router.post('/login/callback/postResponse',
 // !!! Important !!! Response XML structure needs to be tweaked to pass signature validation
       passport.patchResponse(),
       passport.authenticate(config.passport.strategy, {successRedirect : "/", failureRedirect : "/accessDenied"}),
       relayHandler);    
    
    return router;
};
