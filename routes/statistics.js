const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// 학급 통계 조회
router.get('/:classId', auth, async (req, res) => {
    try {
        const classId = req.params.classId;
        
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

// 전체 통계 조회
router.get('/overall', auth, async (req, res) => {
    try {
        const userId = req.userData.userId;
        
        // 전체 학급 수
        const [classCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM classes WHERE created_by = ?',
            [userId]
        );
        
        // 전체 학생 수
        const [studentCount] = await pool.execute(
            `SELECT COUNT(*) as count 
            FROM students s 
            JOIN classes c ON s.class_id = c.id 
            WHERE c.created_by = ?`,
            [userId]
        );
        
        // 전체 선생님 수
        const [teacherCount] = await pool.execute(
            `SELECT COUNT(*) as count 
            FROM teachers t 
            JOIN classes c ON t.class_id = c.id 
            WHERE c.created_by = ?`,
            [userId]
        );
        
        // 평균 출석률 계산
        const [avgAttendance] = await pool.execute(
            `SELECT 
                AVG(attendance_rate) as avg_rate
            FROM (
                SELECT 
                    c.id,
                    CASE 
                        WHEN COUNT(DISTINCT s.id) * COUNT(DISTINCT a.date) > 0 
                        THEN (COUNT(DISTINCT a.id) * 100.0) / (COUNT(DISTINCT s.id) * COUNT(DISTINCT a.date))
                        ELSE 0 
                    END as attendance_rate
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id
                LEFT JOIN attendances a ON s.id = a.student_id
                WHERE c.created_by = ?
                GROUP BY c.id
            ) as class_rates`,
            [userId]
        );
        
        // 학급별 상세 통계
        const [classDetails] = await pool.execute(
            `SELECT 
                c.id,
                c.name,
                COUNT(DISTINCT s.id) as student_count,
                COUNT(DISTINCT t.id) as teacher_count,
                CASE 
                    WHEN COUNT(DISTINCT s.id) * COUNT(DISTINCT a.date) > 0 
                    THEN ROUND((COUNT(DISTINCT a.id) * 100.0) / (COUNT(DISTINCT s.id) * COUNT(DISTINCT a.date)), 1)
                    ELSE 0 
                END as attendance_rate
            FROM classes c
            LEFT JOIN students s ON c.id = s.class_id
            LEFT JOIN teachers t ON c.id = t.class_id
            LEFT JOIN attendances a ON s.id = a.student_id
            WHERE c.created_by = ?
            GROUP BY c.id, c.name
            ORDER BY c.name`,
            [userId]
        );
        
        res.json({
            totalClasses: classCount[0].count,
            totalStudents: studentCount[0].count,
            totalTeachers: teacherCount[0].count,
            avgAttendanceRate: Math.round(avgAttendance[0].avg_rate || 0),
            classDetails: classDetails.map(classInfo => ({
                id: classInfo.id,
                name: classInfo.name,
                studentCount: classInfo.student_count,
                teacherCount: classInfo.teacher_count,
                attendanceRate: classInfo.attendance_rate
            }))
        });
    } catch (error) {
        console.error('전체 통계 조회 에러:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router; 