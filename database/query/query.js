var db2 = require('../connection/dbconnect');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt-nodejs');
const logger = require('../../common/logconfig')(__filename);
const tempWrite = require('temp-write');
const Excel = require('exceljs');
const moment = require('moment');

var teams = new Promise(function (resolve, reject) {
    sql = 'select * from teams';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});
var skills = new Promise(function (resolve, reject) {
    sql = 'select * from skills';

    db2.mydb.query(sql, (err, rows) => {
        if (!err)
            resolve(rows)

        else
            reject(err)

    })
});
var role = new Promise(function (resolve, reject) {
    sql = 'select * from role';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});
var companies = new Promise(function (resolve, reject) {
    sql = 'select * from companies';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});
var centers = new Promise(function (resolve, reject) {
    sql = 'select ID,CITY_ID,NAME,COMPANY_ID from centers';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});
var squads = new Promise(function (resolve, reject) {
    sql = 'select * from squads';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});
var cities = new Promise(function (resolve, reject) {
    sql = 'select * from cities';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});
var countries = new Promise(function (resolve, reject) {
    sql = 'select * from countries';

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            resolve(rows)
        } else {
            reject(err)
        }
    })
});

var masterData = function (cb) {
    var finalObj = {};
    Promise.all([teams, skills, role, companies, centers, squads, cities, countries]).then(function (result, err) {
        if (!err) {
            finalObj["teams"] = result[0];
            finalObj["skills"] = result[1];
            finalObj["role"] = result[2];
            finalObj["companies"] = result[3];
            finalObj["centers"] = result[4];
            finalObj["squads"] = result[5];
            finalObj["cities"] = result[6];
            finalObj["countries"] = result[7];
            console.log("master api result", finalObj);
            logger.info("master api result")
            logger.info(JSON.stringify(finalObj));
            cb(null, {
                "body": finalObj,
                "status": 200,
                "msg": "get all master data"
            })
        } else {
            logger.error("master api error")
            cb({
                "status": 404,
                "error": err
            })
        }
    })
};

function getLocation(email) {
    var sql = `select tempview.*,centers.name as "CENTER",blob(centers.image),centers.city_id,cities.name as "CITY" from
    (select count(users.id)as "HEAD_COUNT",sum(USERAVAILABILITY.AVAILABILITY_HOURS) as "AVAILABLE_HOURS",users.center_id from users 
    inner join USERAVAILABILITY on USERAVAILABILITY.user_id = users.id group by users.center_id order by users.center_id) tempview 
    inner join centers on tempview.center_id =centers.id inner join cities on centers.city_id = cities.id order by centers.name`;

    return new Promise((resolve,reject)=>{
        db2.mydb.query(sql, (err, rows) => {
            if (!err) {
                getUserData(email).then((userData)=>{
                   
                        let testObject =  {
                         "body": rows,
                         "user":userData,
                         "status": 200,
                         "msg": "get all locations",
                         "isvaliduser" : true
                        }
                        resolve(testObject);
    
                }).catch((er)=>{
                       
                    reject({
                        "status": 404,
                        "error": "Userdata is not correct",
                        "isvaliduser" : false
                    });
    
                }) 
            } else {
                reject({
                    "status": 404,
                    "error": err,
                    "isvaliduser" : false
                });
            }
        })

    });
    
 
};


var getSquadLeaders = function (center_id, cb) {

    let sql =
        ` select d.*,u.designation, u.firstname as "FIRST_NAME",u.lastname as "LAST_NAME",u.email,u.contact_number,u.center_id,u.image from
         (select c.squadleader_id,LISTAGG(c.hours,',') WITHIN GROUP(ORDER BY c.hours) as "SKILL_HOURS",LISTAGG(c.NAME,',') WITHIN GROUP(ORDER BY c.hours) as "SKILLS" 
         from(select m.squad_id,m.squadleader_id,sum(a.AVAILABILITY_HOURS) as hours,skill.name from SQUADS s inner join 
         MAPPEDSQUAD m on s.id = m.squad_id inner join USERAVAILABILITY a on a.user_id = m.squadmember_id 
        inner join MAPPEDSKILLS ms on (ms.user_id = m.squadmember_id and ms.isprimary = 1) inner join skills skill 
        on skill.id = ms.skill_id where s.center_id = ${center_id} group by m.squad_id,m.squadleader_id,skill.name order by m.squad_id) c 
        group by c.squad_id,c.squadleader_id) d inner join users u on u.id = d.squadleader_id order by d.squadleader_id`;

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {

            cb(
                null, {
                    "body": rows,
                    "status": 200,
                    "msg": "get all squad leaders"
                }
            )

        } else {
            logger.error("squad leader api error")
            cb({
                "status": 404,
                "error": err
            });
        }
    })
};

var getSquadMembers = function (squad_leader_id, cb) {

    var sql =
        `select tempview.*,avail.AVAILABILITY_HOURS,u.firstname as "FIRST_NAME",u.lastname as "LAST_NAME",u.contact_number,u.email,u.designation,u.image
        from (select b.user_id,
        LISTAGG(b.skillarray,',') WITHIN GROUP(ORDER BY b.isprimary desc) as "SKILL",
        LISTAGG(b.skillids,',')WITHIN GROUP(ORDER BY b.isprimary desc) as "SKILL_ID" from
        (select skill.isprimary,skill.user_id,LISTAGG(s.name,',') as skillarray,
        LISTAGG(s.id,',') as skillids
        from MAPPEDSQUAD mapp inner join mappedskills skill on mapp.squadmember_id = skill.user_id 
        left join skills s on s.id = skill.skill_id where mapp.squadleader_id =${squad_leader_id} group by skill.isprimary,skill.user_id) b group by b.user_id) tempview
        left join users u on tempview.user_id = u.id inner join USERAVAILABILITY avail on avail.user_id = tempview.user_id order by tempview.user_id`;

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {
            //console.log("squad members api result", rows);
            let tempArray = [];
            let tempSkillArray = [];
            rows.forEach((data) => {
                let tempObj = {};
                tempSkillArray.push(data.SKILL.split(",")[0]);
                tempObj["SKILL"] = data.SKILL.split(",")[0];
                tempObj["HOURS"] = data.AVAILABILITY_HOURS;
                tempArray.push(tempObj);
            });
            let uniqueSkill = [...new Set(tempSkillArray)];
            let aggrArray = [];
            for (let i = 0; i < uniqueSkill.length; i++) {
                let tempObj2 = {};
                let sum = 0;
                for(let j = 0; j < tempArray.length;j++){
                   if(tempArray[j].SKILL == uniqueSkill[i]){
                        sum = sum+tempArray[j].HOURS;
                    }
                  }
                  tempObj2["PRIMARY_SKILL"] = uniqueSkill[i];
                  tempObj2["HOURS"] = sum;
                  aggrArray.push(tempObj2);
            }

            cb(null, {
                "body": {"MEMBER_DETAILS":rows,"AGGREGATED_HOURS":aggrArray},
                "status": 200,
                "msg": "get all squad members"
            });
        } else {
            logger.error("squad member api error")
            cb({
                "status": 404,
                "error": err
            });
        }
    })
};

var register = function (role_id, first_name, last_name, company_id, email, center_id, team_id, squad_id, password, emp_id, city_id, country_id, contact_number, manager_id, cb) {

    var sql = `Insert into users(role_id,company_id,empid,firstname,lastname,contact_number,email,password,team_id,squad_id,center_id,city_id,country_id,manager_id,flag1,flag2,flag3) VALUES (${role_id},${company_id},${emp_id},'${first_name}','${last_name}',${contact_number},'${email}','${password}',${team_id},${squad_id},${center_id},${city_id},${country_id},${manager_id},NULL,NULL,NULL)`;

    db2.mydb.query(sql, (err, rows) => {
        if (!err) {
            console.log("register api result", rows);
            logger.info("register api result")
            logger.info(JSON.stringify(rows));
            cb(null, {
                "body": rows,
                "status": 200,
                "msg": "registered sucessfully"
            });
        } else {
            logger.error("register api error")
            cb({
                "status": 404,
                "error": err
            });
        }
    })
};


var encrypt = function (password) {
    var salt = bcrypt.genSaltSync(8);
    var hash = bcrypt.hashSync(password, salt);
    return hash;
}

var compare = function (dbPassword, userPassword) {
    return bcrypt.compareSync(userPassword, dbPassword);
}

var getUserData =  function (email) {
    return new Promise((resolve,reject)=>{
        if (email == '') {
            reject(false);
        } else {
            let sql1 =
                `SELECT USERS.ID AS "USER_ID", USERS.CITY_ID AS "CITY_ID", USERS.CENTER_ID AS "CENTER_ID", 
             USERS.FIRSTNAME AS "FIRST_NAME", USERS.LASTNAME AS "LAST_NAME", USERS.ROLE_ID AS "ROLE_ID", 
             ROLE.NAME AS "ROLE_NAME",USERS.IMAGE FROM USERS INNER JOIN 
             ROLE ON (USERS.ROLE_ID = ROLE.ID) WHERE (USERS.EMAIL = ?)`;
    
            db2.mydb.query(sql1, [email], (err, rows) => {
                if (err) {
                    reject(false);
                } else {
                    if (rows.length > 0) {
                            resolve(rows);
                        } else {
                            reject(false);
                    }
                }
    
            })
        }
    })
 
};

var editProfile = function (body, cb) {

    let availablehours = body.availableHours;
    let newskills = body.newSkill;
    let oldskills = body.oldSkill;
    let userid = body.userId;


    if (userid) {

        let temparr = [];
        let temparr1 = [];
        let tempdata = [];

        if (newskills.length > 0) {
            newskills.forEach(element => {
                if (element.isPrimary == 0) {
                    let newskillsid = element.ID;
                    let isprimary = element.isPrimary;
                    let userid = body.userId;
                    let newskillfield = [userid, newskillsid, isprimary];
                    temparr.push(newskillfield);
                    tempdata.push(userid, newskillsid, isprimary);

                } else {
                    let newskillsid = element.ID;
                    let isprimary = element.isPrimary;
                    let userid = body.userId;

                    var sql = `update  MAPPEDSKILLS  set MAPPEDSKILLS.SKILL_ID = ${newskillsid} where MAPPEDSKILLS.USER_ID= ${userid} AND isprimary = ${isprimary};`
                    db2.mydb.query(sql, (err, rows) => {
                        if (err) {
                            logger.error("updation for primary skill api error")
                            cb({
                                "status": 404,
                                "error": err
                            });
                        } else {
                            console.log("updation for primary skill api runs sucessfully", rows);
                            logger.info("updation for primary skill api runs sucessfully")
                        }
                    })
                }
            })

        }
        if (temparr.length > 0) {
            let placemarks = [];
            for (var i = 0; i < temparr.length; i++) {
                placemarks.push("(?,?,?)");
            }
            let sql =
                `insert into MAPPEDSKILLS(MAPPEDSKILLS.USER_ID,MAPPEDSKILLS.SKILL_ID,MAPPEDSKILLS.isprimary) 
              values ${placemarks.join(',')}`;

            db2.mydb.query(sql, tempdata, (err, rows) => {
                if (!err) {
                    console.log("insertion for secondary skill api runs sucessfully", rows);
                    logger.info("insertion for secondary skill api runs sucessfully")
                } else {
                    logger.error("insertion for secondary skill api error")
                    cb({
                        "status": 404,
                        "error": err
                    });
                }
            })
        }

        if (oldskills.length > 0) {
            oldskills.forEach(element => {
                if (element.isPrimary == 0) {
                    let oldskillsid = element.ID;
                    temparr1.push(oldskillsid);
                }
            })
        }
        if (temparr1.length > 0) {
            var sql = `delete from MAPPEDSKILLS where MAPPEDSKILLS.SKILL_ID IN (${temparr1}) AND MAPPEDSKILLS.USER_ID= ${userid}`
            db2.mydb.query(sql, (err, rows) => {
                if (err) {
                    logger.error("deletion for secondary skill api error")
                    cb({
                        "status": 404,
                        "error": err
                    });
                } else {
                    console.log("deletion for secondary skill api runs sucessfully", rows);
                    logger.info("deletion for secondary skill api runs sucessfully")
                }
            })

        }
        if (availablehours !== false) {
            var sql = `update  USERAVAILABILITY  set USERAVAILABILITY.AVAILABILITY_HOURS = ${availablehours} where USERAVAILABILITY.USER_ID = ${userid}`;

            db2.mydb.query(sql, (err, rows) => {
                if (!err) {
                    console.log("updation for available hours api result", rows);
                    logger.info("updation for available hours api result")
                    logger.info(JSON.stringify(rows));
                    cb(null, {
                        "status": 200,
                        "body": rows,
                        "msg": "Updation Sucessfully"
                    });
                } else {
                    logger.error("updation for available hours api error")
                    cb({
                        "status": 404,
                        "error": err
                    });
                }
            })

        }
    } else {
        logger.error("field is missing")
        cb({
            "status": 404,
            "msg": "field is missing"
        })
    }
}

var insertImage = function (cb) {

   console.log("image");
   var photo = {ParamType:"FILE", DataType: "BLOB", "Data":path.join(__dirname,'../../Webp.net-compress-image.jpg')};
    //var dog = path.join(__dirname,'../../BLRMAN.png');
  //insert into IMAGE_RESUME(FILE_NAME,IMG) VALUES (?, ?)  
 // console.log("path",dog);
 let sql1 = `Update centers set image = ? where id in (7,9)`
    db2.mydb.query(sql1,[photo],
  function (err, rows) {
    if (err) {
      console.log(err);
      return db2.mydb.closeSync();
}
else{
cb(null, {
    "body": rows,
    "status": 200,
    "msg": "get all locations"
});
}
//var outputfile1 = 'phool2.jpg';
console.log("photo");
    //stmt.bindSync([photo], function (err, result) {
    //if (!err) {
       // let sql1 = 'select * from centers2';
       // db2.mydb.query(sql1, (err, rows) => {
            
        //     let hexBuffer = new Buffer(rows[0].IMAGE,'binary');
        //    console.log(hexBuffer);
        //    fs.writeFileSync(outputfile1, rows[0].IMAGE, 'binary');
        //         console.log("location api result", rows);
        //         logger.info("location api result")
        //         logger.info(JSON.stringify(rows));
              
           // })
            // } else {
            //     logger.error("location api error")
            //     cb({
            //         "status": 404,
            //         "error": err
            //     });
            // }

})

  //})

}

var avaliableMember = function(cb){
    let sql = `select c.name as "center_name",t.name as "team", u.firstname as "member_firstname", u.lastname as "member_lastname", u.contact_number as "member_contact",
    u.email as "member_email", temp_new.AVAILABILITY_HOURS, temp_new.skill, sl.firstname as "squadleader_firstname", sl.lastname as "squadleader_lastname",
    sl.contact_number as "squadleader_contact",sl.email as "squadleader_email" 
    from
    (select temp.user_id,temp.squadleader_id,temp.AVAILABILITY_HOURS,LISTAGG(s.name,',') WITHIN GROUP(ORDER BY ms.skill_id) as skill from
    (select a.user_id,b.squadleader_id,a.AVAILABILITY_HOURS from USERAVAILABILITY a inner join mappedsquad b on a.user_id = b.squadmember_id 
    where AVAILABILITY_HOURS > 0) temp  
    inner join mappedskills ms on ms.user_id = temp.user_id inner join skills s on s.id = ms.skill_id  group by temp.user_id,temp.squadleader_id,
    temp.AVAILABILITY_HOURS order by temp.user_id) temp_new 
    inner join users u on u.id = temp_new.user_id inner join users sl on sl.id = temp_new.squadleader_id inner join centers c on c.id = u.center_id
    inner join teams t on t.id = u.team_id
    `
    ;
    db2.mydb.query(sql, (err, rows) => {
        if (err) {
            logger.error("Get Avaliable api error")
            cb({
                "status": 404,
                "error": err
            });
        } else {
            //console.log("updation for primary skill api runs sucessfully", rows);
            logger.info("updation for primary skill api runs sucessfully");
            cb(rows);
        }
    })  

}

// Generate Excel function 
var generateExcel = function () {
    
    return new Promise((resolve,reject)=>{

        let sql = `select c.name as "center_name",t.name as "team", u.firstname as "member_firstname", u.lastname as "member_lastname",
        temp_new.AVAILABILITY_HOURS, temp_new.skill, sl.firstname as "squadleader_firstname", sl.lastname as "squadleader_lastname"
        from
        (select temp.user_id,temp.squadleader_id,temp.AVAILABILITY_HOURS,LISTAGG(s.name,',') WITHIN GROUP(ORDER BY ms.skill_id) as skill from
        (select a.user_id,b.squadleader_id,a.AVAILABILITY_HOURS from USERAVAILABILITY a inner join mappedsquad b on a.user_id = b.squadmember_id 
        where AVAILABILITY_HOURS > 0) temp  
        inner join mappedskills ms on ms.user_id = temp.user_id inner join skills s on s.id = ms.skill_id  group by temp.user_id,temp.squadleader_id,
        temp.AVAILABILITY_HOURS order by temp.user_id) temp_new 
        inner join users u on u.id = temp_new.user_id inner join users sl on sl.id = temp_new.squadleader_id inner join centers c on c.id = u.center_id
        inner join teams t on t.id = u.team_id`;

        db2.mydb.query(sql, (err, rows) => {
            if (err) {
                logger.error("Get Avaliable api error")
                reject({
                    "status": 404,
                    "error": err
                });
            } else {
                let borderStyles = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
        
                let wbook = new Excel.Workbook();
                let wsheet = wbook.addWorksheet('My Sheet');
        
                let collum = [
                    { header: "Center", key: 'center_name', width: 15 },
                    { header: "Team", key: 'team', width: 15 },
                    { header: "Member", key: 'membername', width: 20},
                    { header: "Squad Leader", key: 'leadername', width: 20 },
                    { header: "Available Hours", key: 'availability'},
                    { header: "Skill", key: 'skill', width: 30 }
                ];
                wsheet.columns = collum;
              rows.forEach((value,index)=>{
                let rows = [];
                rows.push(value.center_name);
                rows.push(value.team); 
                rows.push(`${value.member_firstname} ${value.member_lastname}`); 
                rows.push(`${value.squadleader_firstname} ${value.squadleader_lastname}`);
                rows.push(value.AVAILABILITY_HOURS);
                rows.push(value.SKILL);
                wsheet.addRow(rows);
                })

                wsheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
                    // Iterate over all non-null cells in a row
                    row.eachCell(function (cell, colNumber) {
                        cell.font = { name: 'Calibri', size: 10 };
                        cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                        cell.border = borderStyles;
                    });
                });
                wsheet.getRow(1).eachCell({ includeEmpty: true }, function (cell) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'd6dce4' }
                    };
                    cell.font = { name: 'Calibri', size: 11, bold: true };
                    cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
                    cell.border = borderStyles;
                });

                let currentTime = moment().format("YYYY-MMM-DD-HH-mm-ss");
                var tempPath = 'Available-people-'+ currentTime + '.xlsx';
                const filepath = tempWrite.sync('location');
                fs.readFileSync(filepath, 'utf8');
                let demoPath = tempWrite.sync('location', tempPath);
                wbook.xlsx.writeFile(demoPath).then(function () {
                    
                        resolve(demoPath)
                    }).catch((err) => { reject(err); })
             
            }
        })  
    
    })
}

module.exports = {

    getLocation:getLocation,
    getSquadLeaders: getSquadLeaders,
    getSquadMembers: getSquadMembers,
    register: register,
    masterData: masterData,
    editProfile: editProfile,
    insertImage: insertImage,
    avaliableMember: avaliableMember,
    generateExcel: generateExcel
}
