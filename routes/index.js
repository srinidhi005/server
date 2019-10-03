var express = require('express');
var router = express.Router();
var fs = require('fs');
var Users = require('../models').users;
var Statement = require('../models').statement;
var moment = require('moment');
var csvtojson = require('csvtojson');

/* GET home page. */
module.exports = function(passport) {
  router.get('/index', function(req, res, next) {
    if (req.user) {
      res.render('index', {username: req.user.username, role: req.user.role});
    } else {
      res.render('login');
    }
  });

  router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    console.log(req.user)
    console.log(req.session)
    res.status(200).json({status: "SUCCESS"});
    // res.status(200).json({status: 'SUCCESS'});
  });

  router.get('/statements', function(req, res) {
    Statement.findAll({
      include: [{
        model: Users
      }]
    }).then(data => {
      var statements = data.map(el => {
        var obj = el.get({plain: true});
        obj.username = obj.user.username;
        delete obj.user;
        obj.created_at = moment(obj.created_at).format('DD-MM-YYYY hh:mm')
        console.log(obj.created_at)
        return obj;
      });
      res.status(200).json({statements: statements});
    });
    // res.status(200).json({status: 'SUCCESS'});
  });

  // router.path('/statements', function(req, res) {
  //   var {company} = req.query;
  //   var files = [];
  //   files.push('')
  //   let csv = new ObjectsToCsv(results);
  //   await csv.toDisk(skuFile);
  //   res.status(200).json({status: 'UPDATED SUCCESSFULLY'});
  //   // res.status(200).json({status: 'SUCCESS'});
  // });
  
  router.get('/logout', function(req, res, next) {
    req.session.destroy(function(err){
      if (err) {
        console.log(err)
        res.status(500).send({status: "Server Error"})
      } else {
        res.status(302).redirect('/')
      }
    })
  });

  return router
};
