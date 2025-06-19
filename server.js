const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const config = require('./config');

// 라우터 임포트
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/class');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');
const statisticsRoutes = require('./routes/statistics');

const app = express();

// 미들웨어 설정
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 세션 미들웨어 설정
app.use(session(config.session));

// 라우터 설정
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/statistics', statisticsRoutes);

// 메인 페이지 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// favicon.ico 요청 처리
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content
});

// 서버 시작
app.listen(config.port, () => {
    console.log(`서버가 포트 ${config.port}에서 실행 중입니다`);
}); 