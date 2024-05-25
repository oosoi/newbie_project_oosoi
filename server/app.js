// app.js

const express = require('express');
const ejs = require('ejs');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const fs = require('fs');
const authRouter = require('./auth');
const authCheck = require('./authCheck');

require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, 
  database: 'Rank Your Rank'
});

connection.connect((err) => {
  if (err) {
    console.error('DB 연결 실패: ', err);
    process.exit(1); // 연결 실패 시 프로세스 종료
  }
  console.log('DB 연결 성공 !');
});

app.set('view engine', 'ejs');
app.set('views', './client/ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./client/public'));

// 세션 디렉토리 생성 확인
const sessionPath = './sessions';
if (!fs.existsSync(sessionPath)) {
    try {
        fs.mkdirSync(sessionPath, { recursive: true });
        console.log(`세션 디렉토리 생성: ${sessionPath}`);
    } catch (err) {
        console.error(`세션 디렉토리 생성 실패: ${err.message}`);
        process.exit(1); // 디렉토리 생성 실패 시 프로세스 종료
    }
}

// 세션 스토어 설정 및 에러 핸들링
const fileStoreOptions = {
    path: sessionPath,
    retries: 0 // 재시도 옵션 추가
};

const store = new FileStore(fileStoreOptions);

store.on('error', function (error) {
    console.error('FileStore Error:', error);
});

app.use(session({ 
  secret: 'keyboard cat', 
  cookie: { maxAge: 1800000 }, // 30분(30 * 60 * 1000 밀리초)
  resave: false, 
  saveUninitialized: true, 
  store: store
}));

// '/auth' 경로에 대한 라우터 설정
app.use('/auth', authRouter); 

// 인증이 필요한 라우트
app.get('/', (req, res) => {
  if (!authCheck.checkAuth(req, res, '/auth/login')) {
    return;
  }
  res.redirect('/index');
});

app.get('/index', (req, res) => {
  if (!authCheck.checkAuth(req, res, '/auth/login')) {
    return;
  }
  res.render('index');
});

// rankings 라우트
app.get('/rankings', (req, res) => {
  if (!authCheck.checkAuth(req, res)) {
    return;
  }
  
  const sqlrk = `SELECT namedb, eachpointdb FROM members ORDER BY eachpointdb DESC;`;
  connection.query(sqlrk, function (err, results, fields) {
    if (err) throw err;
    res.render('rankings', { lists: results });
  });
});

// recent_plays 라우트
app.post('/recent_plays', (req, res) => {
  if (!authCheck.checkAuth(req, res)) {
    return;
  }
  
  const { date, winner, loser, score, point } = req.body;
  const sql = `INSERT INTO recentPlays(datedb, winnerdb, loserdb, scoredb, pointdb) VALUES(?,?,?,?,?)`;
  const values = [date, winner, loser, score, point];

  connection.query(sql, values, function (err, result) {
    if (err) throw err;
    console.log('경기 1개 추가 완료 !.');

    if (winner) {
      const addPointsSql1 = `
        UPDATE members 
        SET eachpointdb = eachpointdb + 100 + (? / 2),
            winnumdb = winnumdb + 1
        WHERE namedb = ?;`;

      connection.query(addPointsSql1, [point, winner], function (err, result) {
        if (err) throw err;
        console.log('Winner points and win count updated.');
      });
    }

    if (loser) {
      const addPointsSql2 = `
        UPDATE members 
        SET eachpointdb = eachpointdb + 10 - (? / 2),
            losenumdb = losenumdb + 1
        WHERE namedb = ?;`;

      connection.query(addPointsSql2, [point, loser], function (err, result) {
        if (err) throw err;
        console.log('Loser points and lose count updated.');
      });
    }

    res.send("<script>alert('The match has been added.'); location.href='/recent_plays';</script>");
  });
});

// recent_plays 라우트
app.get('/recent_plays', (req, res) => {
  if (!authCheck.checkAuth(req, res)) {
    return;
  }

  const sql = `SELECT * FROM recentPlays ORDER BY datedb DESC`; // datedb 기준으로 내림차순 정렬
  connection.query(sql, function (err, results, fields) {
    if (err) throw err;
    res.render('recent_plays', { lists: results });
  });
});

// addplays 라우트
app.get('/addplays', (req, res) => {
  if (!authCheck.checkAuth(req, res)) {
    return;
  }
  
  res.render('addplays');
});

// 프로필 라우트 추가
app.get('/profile', (req, res) => {
  if (!authCheck.checkAuth(req, res, '/auth/login')) {
    return;
  }

  const nickname = req.session.nickname;
  connection.query('SELECT * FROM members WHERE namedb = ?', [nickname], function(error, results, fields) {
    if (error) throw error;
    if (results.length > 0) {
      const user = results[0];
      let winrate;

      if (user.winnumdb === 0 && user.losenumdb === 0) {
        winrate = "Play a game!";
      } else if (user.winnumdb === 0 && user.losenumdb !== 0) {
        winrate = "0%";
      } else if (user.winnumdb !== 0 && user.losenumdb === 0) {
        winrate = "100%";
      } else {
        winrate = ((user.winnumdb / (user.winnumdb + user.losenumdb)) * 100).toFixed(2) + "%";
      }

      // 최근 경기 기록 가져오기
      connection.query('SELECT * FROM recentPlays WHERE winnerdb = ? OR loserdb = ?', [nickname, nickname], function(error, matches, fields) {
        if (error) throw error;
        res.render('profile', { 
          user: {
            name: user.namedb,
            eachpoint: user.eachpointdb,
            winnum: user.winnumdb,
            losenum: user.losenumdb,
            winrate: winrate
          },
          matches: matches
        });
      });
    } else {
      res.redirect('/auth/login');
    }
  });
});

app.listen(port, () => {
  console.log(`서버 실행 성공 !! 접속주소 : http://localhost:${port}`);
});
