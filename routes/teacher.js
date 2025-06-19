const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 선생님 추가
router.post('/:classId', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const classId = req.params.classId;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 선생님 추가
        const [result] = await pool.execute(
            'INSERT INTO teachers (name, class_id) VALUES (?, ?)',
            [name, classId]
        );
        
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error('선생님 추가 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 선생님 삭제
router.delete('/:classId/:teacherId', auth, async (req, res) => {
    try {
        const { classId, teacherId } = req.params;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 선생님 삭제
        const [result] = await pool.execute(
            'DELETE FROM teachers WHERE id = ? AND class_id = ?',
            [teacherId, classId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '선생님을 찾을 수 없습니다.' });
        }
        
        res.json({ message: '선생님이 삭제되었습니다.' });
    } catch (error) {
        console.error('선생님 삭제 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router; 