const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const authCheck = require('./authCheck');

const connection = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'tnfqkrtm',
  database: 'RankYourRank'
});
console.log('DB 연결 성공(auth.js) !');

// 로그인 화면
router.get('/login', function (req, res) {
  res.render('login', { title: '로그인' });
});

// 로그인 프로세스
router.post('/login_process', function (req, res) {
  const { enteredid, enteredpw } = req.body;
  if (enteredid && enteredpw) {
    connection.query('SELECT * FROM members WHERE iddb = ? AND pwdb = ?', [enteredid, enteredpw], function(error, results, fields) {
      if (error) throw error;
      if (results.length > 0) {
        req.session.is_logined = true;
        req.session.nickname = results[0].namedb; // enteredid 대신 namedb 사용
        req.session.save(function () {
          res.send(`<script>alert('Welcome ! Player ${req.session.nickname}'); location.href='/index';</script>`);
        });
      } else {              
        res.send("<script>alert('Please check your ID or Password again.'); location.href='/auth/login';</script>");
      }            
    });
  } else {
    res.send("<script>alert('Please type in the empty space.'); location.href='/auth/login';</script>");
  }
});

// 로그아웃
router.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    res.redirect('/');
  });
});

// 회원가입 화면
router.get('/register', function(req, res) {
  res.render('register', { title: '회원가입' });
});

// 회원가입 프로세스
router.post('/register_process', function(req, res) {
  const { enteredid, pwd: enteredpw, pwd2: enteredpw2, name: enteredname } = req.body;

  if (enteredid && enteredpw && enteredpw2 && enteredname) {
    if (enteredpw !== enteredpw2) {
      res.send("<script>alert('The two passwords are different.'); location.href='/auth/register';</script>");
    } else {
      connection.query('SELECT * FROM members WHERE iddb = ? OR namedb = ?', [enteredid, enteredname], function(error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          const idExists = results.some(result => result.iddb === enteredid);
          const nameExists = results.some(result => result.namedb === enteredname);

          if (idExists && nameExists) {
            res.send("<script>alert('The ID and name already exists.'); location.href='/auth/register';</script>");
          } else if (idExists) {
            res.send("<script>alert('This is a ID that already exists.'); location.href='/auth/register';</script>");
          } else if (nameExists) {
            res.send("<script>alert('Please use another name (e.g.최우석2).'); location.href='/auth/register';</script>");
          }
        } else {
          const sql = 'INSERT INTO members (iddb, pwdb, namedb, eachpointdb, winnumdb, losenumdb) VALUES (?,?,?,?,?,?)';
          const values = [enteredid, enteredpw, enteredname, 0, 0, 0];
          connection.query(sql, values, function (error, data) {
            if (error) throw error;
            res.send("<script>alert('Successfully created account !'); location.href='/auth/login';</script>");
          });
        }
      });
    }
  } else {
    res.send("<script>alert('Please try again.'); location.href='/auth/register';</script>");
  }
});

module.exports = router;
