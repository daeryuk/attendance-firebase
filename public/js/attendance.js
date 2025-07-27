class AttendanceManager {
    constructor() {
        this.attendanceSection = document.getElementById('attendance-section');
        this.attendanceList = document.getElementById('attendance-list');
        this.currentClassId = null;
        this.isLoading = false;
        this.isRendering = false;
        this.lastCallTime = 0;
        // 디버깅용 DOM 체크
        console.log('attendanceSection:', this.attendanceSection);
        console.log('attendanceList:', this.attendanceList);
    }

    showAttendanceSection(classId) {
        const now = Date.now();
        
        // 500ms 내에 같은 classId로 호출되면 무시
        if (now - this.lastCallTime < 500 && this.currentClassId === classId) {
            console.log('중복 호출 방지:', classId);
            return;
        }
        
        console.log('showAttendanceSection 호출됨, classId:', classId, '현재 classId:', this.currentClassId);
        this.lastCallTime = now;
        
        // 무조건 가장 먼저 할당!
        this.currentClassId = classId;
        
        // 이미 같은 반의 출석 섹션이 열려있다면 아무것도 하지 않음
        if (this.currentClassId === classId && !this.attendanceSection.classList.contains('hidden')) {
            console.log('이미 같은 반의 출석 섹션이 열려있음');
            return;
        }
        
        // 기존 출석 영역 초기화
        this.clearAttendanceSection();
        this.attendanceSection.classList.remove('hidden');
        this.loadStudents();
    }

    clearAttendanceSection() {
        console.log('clearAttendanceSection 호출됨');
        this.attendanceList.innerHTML = '';
        this.isLoading = false;
        this.isRendering = false;
        this.lastCallTime = 0;
        
        // 출석 관리 헤더 제거
        const attendanceHeader = this.attendanceSection.querySelector('.attendance-header');
        if (attendanceHeader) {
            attendanceHeader.remove();
        }
        
        // 모든 학생 카드 제거
        const existingCards = document.querySelectorAll('.student-card');
        existingCards.forEach(card => card.remove());
    }

    getStatusText(status) {
        switch (status) {
            case 'present':
                return '출석';
            case 'absent':
                return '결석';
            case 'late':
                return '지각';
            default:
                return '출석체크';
        }
    }

    async loadStudents() {
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            console.log('loadStudents 쿼리 classId:', this.currentClassId);
            const studentsSnap = await firebase.database().ref('users/' + user.uid + '/students').orderByChild('classId').equalTo(this.currentClassId).once('value');
            const students = [];
            studentsSnap.forEach(child => {
                console.log('loadStudents 학생:', child.key, child.val());
                students.push({ id: child.key, ...child.val() });
            });
            this.renderStudents(students);
        } catch (error) {
            alert('학생 목록을 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    async addStudent(name) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const newStudentRef = firebase.database().ref('users/' + user.uid + '/students').push();
            await newStudentRef.set({
                name,
                classId: this.currentClassId,
                createdAt: Date.now()
            });
            this.loadStudents();
        } catch (error) {
            alert('학생 추가에 실패했습니다.');
        }
    }

    async markAttendance(studentId, status) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const today = new Date().toISOString().slice(0, 10);
            // 중복 출석 체크
            const attendanceSnap = await firebase.database().ref('users/' + user.uid + '/attendances').orderByChild('classId').equalTo(this.currentClassId).once('value');
            let alreadyPresent = false;
            attendanceSnap.forEach(child => {
                const val = child.val();
                if (val.studentId === studentId && val.date === today && val.status === 'present') {
                    alreadyPresent = true;
                }
            });
            if (alreadyPresent) {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('이미 출석이 완료된 학생입니다.', 'warning');
                } else {
                    alert('이미 출석이 완료된 학생입니다.');
                }
                return;
            }
            const newAttendanceRef = firebase.database().ref('users/' + user.uid + '/attendances').push();
            await newAttendanceRef.set({
                studentId,
                classId: this.currentClassId,
                date: today,
                status,
                createdAt: Date.now()
            });
            if (typeof window.showNotification === 'function') {
                window.showNotification('출석이 완료되었습니다.', 'success');
            } else {
                alert('출석이 완료되었습니다.');
            }
            // 출석 후 목록 갱신
            this.loadStudents();
        } catch (error) {
            alert('출석 기록에 실패했습니다.');
        }
    }

    async renderStudents(students) {
        // 이미 렌더링 중이면 중복 방지
        if (this.isRendering) {
            console.log('이미 렌더링 중입니다.');
            return;
        }
        
        this.isRendering = true;
        console.log('renderStudents 호출됨, 학생 수:', students.length);
        
        // 기존 목록 완전히 초기화
        this.attendanceList.innerHTML = '';
        
        // 기존 attendance-header 모두 제거
        const oldHeaders = this.attendanceSection.querySelectorAll('.attendance-header');
        oldHeaders.forEach(header => header.remove());
        
        // 중복 제거 (같은 ID를 가진 학생이 여러 번 있는 경우)
        const uniqueStudents = students.filter((student, index, self) => 
            index === self.findIndex(s => s.id === student.id)
        );
        
        console.log('중복 제거 후 학생 수:', uniqueStudents.length);
        
        // 추가 중복 검사 (이름 기준)
        const finalStudents = uniqueStudents.filter((student, index, self) => 
            index === self.findIndex(s => s.name === student.name)
        );
        
        console.log('최종 학생 수:', finalStudents.length);
        
        // 이미 렌더링된 학생 ID 추적
        const renderedStudentIds = new Set();
        
        // 오늘 출석 데이터 로드
        let todayAttendance = {};
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const today = new Date().toISOString().split('T')[0];
            const attendanceSnap = await firebase.database().ref('users/' + user.uid + '/attendances').orderByChild('classId').equalTo(this.currentClassId).once('value');
            attendanceSnap.forEach(child => {
                const val = child.val();
                if (val.date === today) {
                    todayAttendance[val.studentId] = val.status;
                }
            });
        } catch (error) {
            console.error('출석 데이터 로드 에러:', error);
        }
        
        // 출석 완료/미출석 숫자 계산
        const presentCount = finalStudents.filter(s => todayAttendance[s.id] === 'present').length;
        const absentCount = finalStudents.length - presentCount;
        // 출석 관리 헤더 추가
        const headerHTML = `
            <div class="attendance-header">
                <div class="attendance-title">
                    <h2>📚 출석 관리</h2>
                    <p class="attendance-date">${new Date().toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'long'
                    })}</p>
                </div>
                <div class="attendance-stats">
                    <div class="stat-item">
                        <span class="stat-value">${finalStudents.length}</span>
                        <span class="stat-label">전체 학생</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${presentCount}</span>
                        <span class="stat-label">출석 완료</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${absentCount}</span>
                        <span class="stat-label">미출석</span>
                    </div>
                </div>
            </div>
        `;
        
        // 헤더 추가
        this.attendanceSection.insertAdjacentHTML('afterbegin', headerHTML);
        
        // 학생 목록 컨테이너
        const studentsContainer = document.createElement('div');
        studentsContainer.className = 'students-container';
        
        finalStudents.forEach(student => {
            // 이미 렌더링된 학생인지 확인
            if (renderedStudentIds.has(student.id)) {
                console.log('이미 렌더링된 학생 건너뛰기:', student.name);
                return;
            }
            
            renderedStudentIds.add(student.id);
            
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.dataset.studentId = student.id;
            
            // 기존 출석 상태 확인
            const existingStatus = todayAttendance[student.id];
            let cardClass = 'student-card';
            let buttonText = '출석체크';
            let statusIcon = '⏰';
            let statusClass = '';
            let buttonDisabled = '';
            
            if (existingStatus === 'present') {
                cardClass += ' present';
                buttonText = '출석완료';
                statusIcon = '✅';
                statusClass = 'present';
                buttonDisabled = 'disabled';
            }
            
            studentCard.className = cardClass;
            
            studentCard.innerHTML = `
                <div class="student-info">
                    <div class="student-avatar">
                        <span class="avatar-text">${student.name.charAt(0)}</span>
                    </div>
                    <div class="student-details">
                <h4>${student.name}</h4>
                        <p class="student-status ${statusClass}">
                            <span class="status-icon">${statusIcon}</span>
                            <span class="status-text">${existingStatus === 'present' ? '출석 완료' : '출석 대기'}</span>
                        </p>
                    </div>
                </div>
                <div class="attendance-button">
                    <button class="attendance-btn ${existingStatus === 'present' ? 'present' : ''}" 
                            onclick="window.attendanceManager.markAttendance('${student.id}', 'present')" 
                            data-student-id="${student.id}" ${buttonDisabled}>
                        ${buttonText}
                    </button>
                </div>
            `;
            
            studentsContainer.appendChild(studentCard);
        });
        
        this.attendanceList.appendChild(studentsContainer);
        
        console.log('실제 렌더링된 학생 수:', renderedStudentIds.size);
        this.isRendering = false;
    }

    hideAttendanceSection() {
        this.attendanceSection.classList.add('hidden');
        this.currentClassId = null;
    }

    async fixStudentClassIds() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        const studentsRef = firebase.database().ref('users/' + user.uid + '/students');
        const studentsSnap = await studentsRef.once('value');
        let fixedCount = 0;
        studentsSnap.forEach(child => {
            const val = child.val();
            if (typeof val.classId !== 'string' || !val.classId) {
                studentsRef.child(child.key).update({ classId: String(val.classId) });
                console.log('[fixStudentClassIds] 고침:', child.key, val);
                fixedCount++;
            }
        });
        if (fixedCount > 0) {
            console.log(`[fixStudentClassIds] 총 ${fixedCount}건의 classId를 문자열로 보정함.`);
        } else {
            console.log('[fixStudentClassIds] 모든 classId가 정상입니다.');
        }
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceManager = new AttendanceManager();
    window.attendanceManager.fixStudentClassIds();
}); 