const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        
        // 비밀번호 해시화
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 사용자 생성
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
            [username, hashedPassword, name]
        );
        
        res.status(201).json({ message: '회원가입이 완료되었습니다.' });
    } catch (error) {
        console.error('회원가입 에러:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: '이미 존재하는 사용자명입니다.' });
        } else {
            res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 사용자 조회
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
        
        const user = users[0];
        
        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
        
        // 세션에 사용자 정보 저장
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.name = user.name;
        
        res.json({ 
            message: '로그인 성공',
            user: {
                id: user.id,
                username: user.username,
                name: user.name
            }
        });
    } catch (error) {
        console.error('로그인 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 로그아웃
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
        }
        res.json({ message: '로그아웃되었습니다.' });
    });
});

// 세션 확인
router.get('/check', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                name: req.session.name
            }
        });
    } else {
        res.status(401).json({ authenticated: false });
    }
});

module.exports = router; 