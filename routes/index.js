const express = require('express');
const router = express.Router();
var query = require('../database/query/query');
const logger = require('../common/logconfig')(__filename);


 


// router.post('/login', function (req, res) {
//     query.login(req.body.email, req.body.password, function (err, result) {
//       if (err) {
//         logger.error("Error in login API ", err);
//         res.status(404).send(err);
//       } else {
//         req.session.login = true;
//         res.send(result);
//       }
//     });
  
//   })


  router.post('/signUp', function (req, res) {
    query.register(req.body.role_id,
      req.body.first_name,
      req.body.last_name,
      req.body.company_id,
      req.body.email,
      req.body.center_id,
      req.body.team_id,
      req.body.squad_id,
      req.body.password,
      req.body.emp_id,
      req.body.city_id,
      req.body.country_id,
      req.body.contact_number,
      req.body.manager_id,
      function (err, result) {
        if (err) {
          logger.error("Error in signUp API", err);
          res.send(err)
        } else {
          res.send(result);
        }
      });
  
  })

  // Logout
  router.post('/logout', function(req, res, next) {
    req.session.destroy();
    res.json({"msg":"Session is successfully destroyed"});
});

  module.exports = router;