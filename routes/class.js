const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// 모든 학급 조회
router.get('/', auth, async (req, res) => {
    try {
        const [classes] = await pool.execute(
            `SELECT c.*, 
                GROUP_CONCAT(DISTINCT t.name) as teachers,
                COUNT(DISTINCT s.id) as student_count
            FROM classes c
            LEFT JOIN teachers t ON c.id = t.class_id
            LEFT JOIN students s ON c.id = s.class_id
            WHERE c.created_by = ?
            GROUP BY c.id`,
            [req.userData.userId]
        );
        
        res.json(classes);
    } catch (error) {
        console.error('학급 목록 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 학급 생성
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO classes (name, created_by) VALUES (?, ?)',
            [name, req.userData.userId]
        );
        
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error('학급 생성 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 학급 상세 정보 조회
router.get('/:id', auth, async (req, res) => {
    try {
        const [classes] = await pool.execute(
            `SELECT c.*, 
                GROUP_CONCAT(DISTINCT t.id, ':', t.name) as teachers,
                GROUP_CONCAT(DISTINCT s.id, ':', s.name) as students
            FROM classes c
            LEFT JOIN teachers t ON c.id = t.class_id
            LEFT JOIN students s ON c.id = s.class_id
            WHERE c.id = ? AND c.created_by = ?
            GROUP BY c.id`,
            [req.params.id, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        const classData = classes[0];
        
        // 선생님과 학생 정보 파싱
        classData.teachers = classData.teachers ? 
            classData.teachers.split(',').map(t => {
                const [id, name] = t.split(':');
                return { id, name };
            }) : [];
            
        classData.students = classData.students ?
            classData.students.split(',').map(s => {
                const [id, name] = s.split(':');
                return { id, name };
            }) : [];
        
        res.json(classData);
    } catch (error) {
        console.error('학급 상세 정보 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 학급 수정
router.put('/:id', auth, async (req, res) => {
    try {
        const { name } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE classes SET name = ? WHERE id = ? AND created_by = ?',
            [name, req.params.id, req.userData.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        res.json({ message: '학급이 수정되었습니다.' });
    } catch (error) {
        console.error('학급 수정 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 학급 삭제
router.delete('/:id', auth, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
        }
        
        // 사용자 비밀번호 확인
        const [users] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [req.userData.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        // 비밀번호 확인 (bcrypt.compare 사용)
        const isValidPassword = await bcrypt.compare(password, users[0].password);
        if (!isValidPassword) {
            return res.status(403).json({ message: '비밀번호가 올바르지 않습니다.' });
        }
        
        // 학급 삭제 (CASCADE로 관련 데이터도 함께 삭제됨)
        const [result] = await pool.execute(
            'DELETE FROM classes WHERE id = ? AND created_by = ?',
            [req.params.id, req.userData.userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        res.json({ message: '학급이 삭제되었습니다.' });
    } catch (error) {
        console.error('학급 삭제 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 선생님 추가
router.post('/:id/teachers', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const classId = req.params.id;
        
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
router.delete('/:id/teachers/:teacherId', auth, async (req, res) => {
    try {
        const { id: classId, teacherId } = req.params;
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
        }
        
        // 사용자 비밀번호 확인
        const [users] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [req.userData.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        // 비밀번호 확인 (bcrypt.compare 사용)
        const isValidPassword = await bcrypt.compare(password, users[0].password);
        if (!isValidPassword) {
            return res.status(403).json({ message: '비밀번호가 올바르지 않습니다.' });
        }
        
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

// 학생 추가
router.post('/:id/students', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const classId = req.params.id;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 학생 추가
        const [result] = await pool.execute(
            'INSERT INTO students (name, class_id) VALUES (?, ?)',
            [name, classId]
        );
        
        res.status(201).json({ id: result.insertId, name });
    } catch (error) {
        console.error('학생 추가 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 학생 삭제
router.delete('/:id/students/:studentId', auth, async (req, res) => {
    try {
        const { id: classId, studentId } = req.params;
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
        }
        
        // 사용자 비밀번호 확인
        const [users] = await pool.execute(
            'SELECT password FROM users WHERE id = ?',
            [req.userData.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        
        // 비밀번호 확인 (bcrypt.compare 사용)
        const isValidPassword = await bcrypt.compare(password, users[0].password);
        if (!isValidPassword) {
            return res.status(403).json({ message: '비밀번호가 올바르지 않습니다.' });
        }
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 학생 삭제
        const [result] = await pool.execute(
            'DELETE FROM students WHERE id = ? AND class_id = ?',
            [studentId, classId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '학생을 찾을 수 없습니다.' });
        }
        
        res.json({ message: '학생이 삭제되었습니다.' });
    } catch (error) {
        console.error('학생 삭제 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 학급의 학생 목록 조회
router.get('/:id/students', auth, async (req, res) => {
    try {
        const classId = req.params.id;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 학생 목록 조회
        const [students] = await pool.execute(
            'SELECT id, name FROM students WHERE class_id = ?',
            [classId]
        );
        
        res.json(students);
    } catch (error) {
        console.error('학생 목록 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 출석 체크
router.post('/:id/attendance', auth, async (req, res) => {
    try {
        const { studentId, date } = req.body;
        const classId = req.params.id;
        
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
        
        // 이미 출석 기록이 있는지 확인
        const [existingAttendance] = await pool.execute(
            'SELECT id FROM attendances WHERE student_id = ? AND date = ?',
            [studentId, date]
        );
        
        if (existingAttendance.length > 0) {
            return res.status(400).json({ message: '이미 출석이 기록되어 있습니다.' });
        }
        
        // 출석 기록
        const [result] = await pool.execute(
            'INSERT INTO attendances (student_id, date, time, status) VALUES (?, ?, NOW(), "present")',
            [studentId, date]
        );
        
        res.status(201).json({ message: '출석이 기록되었습니다.' });
    } catch (error) {
        console.error('출석 체크 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// 특정 날짜의 출석 현황 조회
router.get('/:id/attendance/:date', auth, async (req, res) => {
    try {
        const { id: classId, date } = req.params;
        
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

// 학급 통계 조회
router.get('/:id/statistics', auth, async (req, res) => {
    try {
        const classId = req.params.id;
        
        // 학급 소유권 확인
        const [classes] = await pool.execute(
            'SELECT id FROM classes WHERE id = ? AND created_by = ?',
            [classId, req.userData.userId]
        );
        
        if (classes.length === 0) {
            return res.status(404).json({ message: '학급을 찾을 수 없습니다.' });
        }
        
        // 전체 출석률 계산 - 수정된 로직
        const [attendanceStats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT a.id) as total_attendance,
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT a.date) as total_days
            FROM students s
            LEFT JOIN attendances a ON s.id = a.student_id
            WHERE s.class_id = ?`,
            [classId]
        );
        
        const stats = attendanceStats[0];
        const totalPossible = stats.total_students * stats.total_days;
        const attendanceRate = totalPossible > 0 ?
            Math.round((stats.total_attendance / totalPossible) * 100) : 0;
        
        // 장기 결석자 조회 (3주 이상)
        const [longTermAbsent] = await pool.execute(
            `SELECT 
                s.id,
                s.name,
                COUNT(DISTINCT a.date) as absent_days
            FROM students s
            LEFT JOIN attendances a ON s.id = a.student_id
            WHERE s.class_id = ?
            GROUP BY s.id, s.name
            HAVING absent_days >= 15`,
            [classId]
        );
        
        res.json({
            attendanceRate,
            longTermAbsent: longTermAbsent.map(student => ({
                id: student.id,
                name: student.name,
                absentDays: student.absent_days
            }))
        });
    } catch (error) {
        console.error('통계 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router; 