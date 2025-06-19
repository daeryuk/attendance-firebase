class StatisticsManager {
    constructor() {
        this.statisticsSection = document.getElementById('statistics-section');
        this.calendar = document.getElementById('calendar');
        this.attendanceStats = document.getElementById('attendance-stats');
        this.longTermAbsence = document.getElementById('long-term-absence');
        this.currentClassId = null;
        this.currentDate = new Date();
        
        this.init();
    }

    init() {
        this.renderCalendar();
    }

    showStatisticsSection(classId) {
        // 다른 반을 클릭했을 때 기존 통계 영역 초기화
        if (this.currentClassId !== classId) {
            this.clearStatisticsSection();
        }
        
        this.currentClassId = classId;
        this.statisticsSection.classList.remove('hidden');
        this.loadStatistics();
    }

    clearStatisticsSection() {
        this.attendanceStats.innerHTML = '';
        this.longTermAbsence.innerHTML = '';
        this.currentClassId = null;
        // 달력은 유지하되 출석 표시만 초기화
        this.clearAttendanceMarks();
    }

    clearAttendanceMarks() {
        document.querySelectorAll('.calendar-day.has-attendance').forEach(day => {
            day.classList.remove('has-attendance');
        });
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const calendarHTML = `
            <div class="calendar-header">
                <button onclick="window.statisticsManager.previousMonth()">이전</button>
                <h3>${year}년 ${month + 1}월</h3>
                <button onclick="window.statisticsManager.nextMonth()">다음</button>
            </div>
            <div class="calendar-grid">
                <div>일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div>토</div>
                ${this.generateCalendarDays(firstDay, lastDay)}
            </div>
        `;
        
        this.calendar.innerHTML = calendarHTML;
    }

    generateCalendarDays(firstDay, lastDay) {
        let days = '';
        const startingDay = firstDay.getDay();
        const today = new Date();
        const currentMonth = this.currentDate.getMonth();
        const currentYear = this.currentDate.getFullYear();
        
        // 이전 달의 날짜들
        for (let i = 0; i < startingDay; i++) {
            days += '<div class="calendar-day empty"></div>';
        }
        
        // 현재 달의 날짜들
        for (let i = 1; i <= lastDay.getDate(); i++) {
            // 날짜 문자열을 직접 생성하여 시간대 문제 방지
            const monthStr = (currentMonth + 1).toString().padStart(2, '0');
            const dayStr = i.toString().padStart(2, '0');
            const dateString = `${currentYear}-${monthStr}-${dayStr}`;
            
            const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
            
            let dayClass = 'calendar-day';
            if (isToday) {
                dayClass += ' today';
            }
            
            days += `
                <div class="${dayClass}" data-date="${dateString}" onclick="window.statisticsManager.showAttendanceForDate('${dateString}')">
                    ${i}
                </div>
            `;
        }
        
        return days;
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
        this.loadStatistics();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
        this.loadStatistics();
    }

    async loadStatistics() {
        if (!this.currentClassId) return;

        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/statistics`, {
                credentials: 'include'
            });

            if (response.ok) {
                const stats = await response.json();
                this.renderStatistics(stats);
                this.loadAttendanceDates();
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            }
        } catch (error) {
            console.error('통계 로드 에러:', error);
        }
    }

    async loadAttendanceDates() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1;
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
            
            const response = await fetch(`/api/classes/${this.currentClassId}/attendance/range?start=${startDate}&end=${endDate}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const attendanceData = await response.json();
                this.markAttendanceDates(attendanceData);
            }
        } catch (error) {
            console.error('출석 날짜 로드 에러:', error);
        }
    }

    markAttendanceDates(attendanceData) {
        // 기존 출석 표시 제거
        document.querySelectorAll('.calendar-day.has-attendance').forEach(day => {
            day.classList.remove('has-attendance');
        });

        // 출석 날짜 표시
        attendanceData.forEach(record => {
            const dateString = record.date;
            const dayElement = document.querySelector(`[data-date="${dateString}"]`);
            if (dayElement) {
                dayElement.classList.add('has-attendance');
            }
        });
    }

    renderStatistics(stats) {
        // 출석률 표시
        this.attendanceStats.innerHTML = `
            <h4>전체 출석률</h4>
            <div class="attendance-rate">${stats.attendanceRate}%</div>
        `;

        // 장기 결석자 표시
        if (stats.longTermAbsent.length > 0) {
            this.longTermAbsence.innerHTML = `
                <h4>장기 결석자 (3주 이상)</h4>
                <ul>
                    ${stats.longTermAbsent.map(student => `
                        <li>${student.name} - ${student.absentDays}일 결석</li>
                    `).join('')}
                </ul>
            `;
        } else {
            this.longTermAbsence.innerHTML = '<h4>장기 결석자 없음</h4>';
        }
    }

    async showAttendanceForDate(date) {
        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/attendance/${date}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const attendance = await response.json();
                this.showAttendanceModal(attendance, date);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            }
        } catch (error) {
            console.error('출석 정보 로드 에러:', error);
        }
    }

    showAttendanceModal(attendance, date) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${date} 출석 현황</h3>
                <div class="attendance-list">
                    ${attendance.map(record => `
                        <div class="attendance-record">
                            <span>${record.studentName}</span>
                            <span>${record.status}</span>
                            <span>${record.time}</span>
                        </div>
                    `).join('')}
                </div>
                <button onclick="this.parentElement.parentElement.remove()">닫기</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    hideStatisticsSection() {
        this.statisticsSection.classList.add('hidden');
        this.currentClassId = null;
    }
}

// 전역 객체로 선언
// const statisticsManager = new StatisticsManager();
document.addEventListener('DOMContentLoaded', () => {
    window.statisticsManager = new StatisticsManager();
}); 