class OverallStatisticsManager {
    constructor() {
        this.overallStatsSection = document.getElementById('overall-statistics');
        this.overallStatsBtn = document.getElementById('overall-stats-btn');
        this.totalClassesElement = document.getElementById('total-classes');
        this.totalStudentsElement = document.getElementById('total-students');
        this.totalTeachersElement = document.getElementById('total-teachers');
        this.avgAttendanceElement = document.getElementById('avg-attendance');
        this.overallClassListElement = document.getElementById('overall-class-list');
        this.overallStatisticsSection = document.getElementById('overall-statistics-section');
        this.overallStats = document.getElementById('overall-stats');
        this.currentClassId = null;
        
        this.init();
    }

    init() {
        if (this.overallStatsBtn) {
            this.overallStatsBtn.addEventListener('click', () => {
                this.showOverallStatistics();
            });
        }
    }

    showOverallStatistics() {
        // 모든 섹션 숨기기
        document.getElementById('class-detail').classList.add('hidden');
        document.getElementById('attendance-section').classList.add('hidden');
        document.getElementById('statistics-section').classList.add('hidden');
        
        // 전체 통계 섹션 표시
        this.overallStatsSection.classList.remove('hidden');
        
        // 통계 데이터 로드
        this.loadOverallStatistics();
    }

    async loadOverallStatistics() {
        try {
            const response = await fetch('/api/statistics/overall', {
                credentials: 'include'
            });

            if (response.ok) {
                const stats = await response.json();
                this.renderOverallStatistics(stats);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            }
        } catch (error) {
            console.error('전체 통계 로드 에러:', error);
        }
    }

    renderOverallStatistics(stats) {
        // 기본 통계 업데이트
        this.totalClassesElement.textContent = stats.totalClasses || 0;
        this.totalStudentsElement.textContent = stats.totalStudents || 0;
        this.totalTeachersElement.textContent = stats.totalTeachers || 0;
        this.avgAttendanceElement.textContent = `${stats.avgAttendanceRate || 0}%`;

        // 학급별 상세 통계 렌더링
        this.renderClassDetails(stats.classDetails || []);
    }

    renderClassDetails(classDetails) {
        this.overallClassListElement.innerHTML = '<h4 style="margin:20px 0;color:#6a82fb;">학급별 상세 통계</h4>';
        
        if (classDetails.length === 0) {
            this.overallClassListElement.innerHTML += '<p style="text-align:center;color:#666;padding:20px;">등록된 학급이 없습니다.</p>';
            return;
        }

        const classGrid = document.createElement('div');
        classGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:20px;';

        classDetails.forEach(classInfo => {
            const classCard = document.createElement('div');
            classCard.className = 'stat-card';
            classCard.innerHTML = `
                <h4>${classInfo.name}</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px;">
                    <div>
                        <div class="stat-value" style="font-size:1.5rem;">${classInfo.studentCount}</div>
                        <div class="stat-label">학생 수</div>
                    </div>
                    <div>
                        <div class="stat-value" style="font-size:1.5rem;">${classInfo.teacherCount}</div>
                        <div class="stat-label">선생님 수</div>
                    </div>
                </div>
                <div style="margin-top:15px;">
                    <div class="stat-value" style="font-size:1.2rem;color:#6a82fb;">${classInfo.attendanceRate}%</div>
                    <div class="stat-label">출석률</div>
                </div>
            `;
            classGrid.appendChild(classCard);
        });

        this.overallClassListElement.appendChild(classGrid);
    }

    hideOverallStatistics() {
        this.overallStatsSection.classList.add('hidden');
    }

    showOverallStatisticsSection(classId) {
        // 다른 반을 클릭했을 때 기존 통계 영역 초기화
        if (this.currentClassId !== classId) {
            this.clearOverallStatisticsSection();
        }
        
        this.currentClassId = classId;
        this.overallStatisticsSection.classList.remove('hidden');
        this.loadOverallStatistics();
    }

    clearOverallStatisticsSection() {
        this.overallStats.innerHTML = '';
        this.currentClassId = null;
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.overallStatisticsManager = new OverallStatisticsManager();
}); 