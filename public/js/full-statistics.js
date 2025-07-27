// 전체 통계 기능

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('full-statistics-date');
    const resultDiv = document.getElementById('full-statistics-result');
    const section = document.getElementById('full-statistics-section');

    if (!dateInput || !resultDiv || !section) return;

    // 오늘 날짜 기본값
    function getToday() {
        const today = new Date();
        return today.toISOString().slice(0, 10);
    }

    dateInput.value = getToday();

    async function loadFullStatistics(date) {
        resultDiv.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            // 모든 반, 학생, 출석 데이터 불러오기
            const [classesSnap, studentsSnap, attendancesSnap] = await Promise.all([
                firebase.database().ref('users/' + user.uid + '/classes').once('value'),
                firebase.database().ref('users/' + user.uid + '/students').once('value'),
                firebase.database().ref('users/' + user.uid + '/attendances').orderByChild('date').equalTo(date).once('value')
            ]);
            const classes = {};
            classesSnap.forEach(child => {
                classes[child.key] = child.val();
            });
            const students = [];
            studentsSnap.forEach(child => {
                students.push({ id: child.key, ...child.val() });
            });
            // 출석 데이터: studentId -> status
            const attendanceMap = {};
            attendancesSnap.forEach(child => {
                const val = child.val();
                attendanceMap[val.studentId] = val.status;
            });
            // 학생을 반별로 그룹화
            const classStudentMap = {};
            students.forEach(stu => {
                if (!classStudentMap[stu.classId]) classStudentMap[stu.classId] = [];
                classStudentMap[stu.classId].push(stu);
            });
            // 표 생성
            let html = '';
            Object.keys(classes).forEach(classId => {
                const className = classes[classId].name;
                const classStudents = classStudentMap[classId] || [];
                html += `<div class="full-statistics-class">
                    <h4>${className}</h4>
                    <table class="full-statistics-table">
                        <thead><tr><th>이름</th><th>출석 상태</th></tr></thead>
                        <tbody>`;
                classStudents.forEach(stu => {
                    const status = attendanceMap[stu.id] || 'absent';
                    html += `<tr>
                        <td>${stu.name}</td>
                        <td class="${status}">${status === 'present' ? '출석' : status === 'late' ? '지각' : '결석'}</td>
                    </tr>`;
                });
                html += '</tbody></table></div>';
            });
            if (!html) html = '<div class="no-data">데이터가 없습니다.</div>';
            resultDiv.innerHTML = html;
        } catch (e) {
            resultDiv.innerHTML = '<div class="error">오류: ' + (e.message || e) + '</div>';
        }
    }

    // 날짜 변경 시
    dateInput.addEventListener('change', e => {
        loadFullStatistics(e.target.value);
    });

    // 전체 통계 섹션이 열릴 때마다 오늘 날짜로 갱신
    const observer = new MutationObserver(() => {
        if (!section.classList.contains('hidden')) {
            dateInput.value = getToday();
            loadFullStatistics(getToday());
        }
    });
    observer.observe(section, { attributes: true, attributeFilter: ['class'] });
}); 