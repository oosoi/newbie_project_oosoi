const express = require('express');
const ejs = require('ejs');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
const mysql = require('mysql2');
var session = require('express-session')

require('dotenv').config();


const connection = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'tnfqkrtm',
  database: 'RankYourRank'
})
console.log('DB 연결 성공 !')



app.set('view engine', 'ejs');
app.set('views', './home');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public')) //미들웨어 ?
app.use(session({secret: 'keyboard cat', cookie: {maxAge: 60000}, resave: true, saveUninitialized:true}))

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/rankings', (req, res) => {
  res.render('rankings');
});


app.post('/recent_plays', (req, res) => {
  const date = req.body.date;
  const winner = req.body.winner;
  const loser = req.body.loser;
  const score = req.body.score;
  const point = req.body.point;
  

//데이터베이스 손보기 ////////////////////////////
  var sql =`insert into recentPlays(datedb,winnerdb,loserdb,scoredb,pointdb )
  values(?,?,?,?,?)`
  
  var values =[date,winner,loser, score,point];

  connection.query(sql, values, function (err, result){
    if(err) throw err;
    console.log('경기 1개 추가 완료 !.');

    if (winner) {
      var addPointsSql1 = `
        UPDATE members 
        SET eachpointdb = eachpointdb + 100 + (? / 2),
            winnumdb = winnumdb + 1
        WHERE namedb = ?;
      `;
    
      connection.query(addPointsSql1, [point, winner], function (err, result) {
        if (err) throw err;
        console.log('Winner points and win count updated.');
      });
    }

    if (loser) {
      var addPointsSql2 = `
        UPDATE members 
        SET eachpointdb = eachpointdb + 10 - (? / 2),
            losenumdb = losenumdb + 1
        WHERE namedb = ?;
      `;
    
      connection.query(addPointsSql2, [point, loser], function (err, result) {
        if (err) throw err;
        console.log('Loser points and lose count updated.');
      });
    }
    
    
    
    res.send("<script>alert('The match has been added.'); location.href='/recent_plays';</script>");
  })
});




app.get('/recent_plays', (req, res) => {
  var sql = `select * from recentPlays`
  connection.query(sql, function (err, results, fields){
    if(err) throw err;
    res.render('recent_plays', {lists:results})
  })

});


app.get('/addplays', (req, res) => {
  res.render('addplays');
});


//로그인///////////////////////////////////////

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/loginProc', (req, res) => {
  const user_id = req.body.user_id;
  const user_pw = req.body.user_pw;

  var sql = `select * from members where id=? and pw=?`
  var values =[user_id, user_pw];

  connection.query(sql, values, function (err, result){
    if(err) throw err;
    if(result.length==0){
      res.send("<script>alert('Please check your ID and Password .'); location.href='/login';</script>");
    }else{
      console.log(result[0]);

      req.session.members =result[0]
      res.send(result);
    }
  })
});



app.listen(port, () => {
  console.log(`서버 실행 성공 !! 접속주소 : http://localhost:${port}`);
});
