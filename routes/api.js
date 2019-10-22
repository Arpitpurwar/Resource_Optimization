var express = require("express");
const router = express.Router();
var query = require('../database/query/query');
const logger = require('../common/logconfig')(__filename);

// check for auth session before proceeding with requests
// router.use(function(req, res, next) {
//   if (req.user) {
// 	  next();
//   }
//   else {
//     res.status(401);
//     res.json({"Error":"Please Authenticate yourself to see API response"});
//   }
// });

router.get('/getLocation', function (req, res) {
let username;
try {
  username = req.user.nameID;
 }catch(e){
  username = 'none';
 }
 if(username == 'none'){
  res.send({ "isvaliduser" : false });
 }else{
  query.getLocation(username).then((value)=>{
    res.send(value);
  }).catch((err)=>{
    res.send(err);
  })
 }



})


router.get('/insert', function (req, res) {
  query.insertImage(function (err, result) {
    if (err) {
      logger.error("Error in getLocation API", err);
      res.send(err)
    } else {
      res.send(result);
    }
  });
})

router.get('/getSquadLeaders', function (req, res) {
  query.getSquadLeaders(req.query.center_id, function (err, result) {
    if (err) {
      logger.error("Error in getSquadLeaders API", err);
      res.send(err)
    } else {
      res.send(result);
    }
  });
})

router.get('/getSquadMembers', function (req, res) {
  query.getSquadMembers(req.query.squad_leader_id, function (err, result) {
    if (err) {
      logger.error("Error in getSquadMembers API", err);
      res.send(err)
    } else {
      res.send(result);
    }
  });
})

router.get('/master', function (req, res) {
  query.masterData(function (err, result) {
    if (err) {
      logger.error("Error in master API", err);
      res.send(err)
    } else {
      res.send(result);
    }
  });

})

router.put('/editProfile', function (req, res) { 
  query.editProfile(req.body,function (err, result) {
    if (err)
      res.send(err)
    else
      res.send(result);
  });

  })

router.get('/avaliableMember', function (req, res) {
    query.avaliableMember(function (result) {
      if (result && result.length) {
       
        res.send(result);
      } else {
        logger.error("Error in master API");
        res.send({"notes": "Error in API"});
      }
    });
  
  })

// Create Excel report  Post API
router.get('/generateExcel',(req,res)=>{
   
  query.generateExcel().then((data)=>{
    
    res.download(data, function (err) {
      if (err) {
      
        console.log(err)
        }
         else {
          logger.info("Successfully Done");
        
      }
    });
   }
)
.catch(err => res.send(err));
})

module.exports = router;