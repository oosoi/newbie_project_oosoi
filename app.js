const express = require ('express')
const ejs = require ('ejs')
const app = express()
const port = 3000
var bodyParser = require('body-parser')

app.set('view engine', 'ejs')
app.set('views', './home')
app.use(bodyParser.urlencoded({extended:false}))

app.get('/', (req, res)=> {//req 요청 받고 res 응답 
    res.render('index')
})

app.get('/rankings', (req, res)=> {
    res.render('rankings')
})
app.get('/board', (req, res)=> {
    res.render('board')
})
app.post('/recent_plays', (req, res)=> {
    
    const name = req.body.myname;
    const oppname = req.body.oppname;
    const score = req.body.score;
    const point = req.body.point;

    var a = `${name} ${oppname} ${score} ${point} `

    res.send(a);
})
app.get('/addplays', (req, res)=> {
    res.render('addplays')
})

app.listen(port,()=>{
    console.log(`서버 실행 확인 접속주소 : http://localhost:${port}`)
})