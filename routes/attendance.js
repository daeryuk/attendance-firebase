const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 출석 체크 (새로운 구조)
router.post('/', auth, async (req, res) => {
    try {
        const { classId, studentId, status, date } = req.body;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 학생 존재 확인
        const [students] = await pool.execute(
            'SELECT id FROM students WHERE id = ? AND class_id = ?',
            [studentId, classId]
        );
        
        if (students.length === 0) {
            return res.status(404).json({ message: '학생을 찾을 수 없습니다.' });
        }
        
        // 기존 출석 기록 확인
        const [existing] = await pool.execute(
            'SELECT id FROM attendances WHERE student_id = ? AND date = ?',
            [studentId, date]
        );
        
        if (existing.length > 0) {
            // 기존 기록 업데이트
            await pool.execute(
                'UPDATE attendances SET status = ?, time = NOW() WHERE student_id = ? AND date = ?',
                [status, studentId, date]
            );
        } else {
            // 새로운 출석 기록
            await pool.execute(
                'INSERT INTO attendances (student_id, date, time, status) VALUES (?, ?, NOW(), ?)',
                [studentId, date, status]
            );
        }
        
        res.status(201).json({ message: '출석이 기록되었습니다.' });
    } catch (error) {
        console.error('출석 체크 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 날짜의 출석 현황 조회
router.get('/:classId/:date', auth, async (req, res) => {
    try {
        const { classId, date } = req.params;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 출석 현황 조회
        const [attendance] = await pool.execute(
            `SELECT a.*, s.name as studentName
            FROM attendances a
            JOIN students s ON a.student_id = s.id
            WHERE s.class_id = ? AND a.date = ?
            ORDER BY a.time`,
            [classId, date]
        );
        
        res.json(attendance);
    } catch (error) {
        console.error('출석 현황 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router; 