document.addEventListener('DOMContentLoaded', () => {
    window.classManager = new ClassManager();
    // 네비게이션 이벤트 리스너 설정
    setupNavigation();
    
    // 로그아웃 버튼 이벤트 리스너
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.authManager) {
                window.authManager.handleLogout();
            }
        });
    }

    const fullStatisticsBtn = document.getElementById('full-statistics-btn');
    const fullStatisticsSection = document.getElementById('full-statistics-section');
    const mainSection = document.getElementById('main-section');
    const statisticsSection = document.getElementById('statistics-section');
    const attendanceSection = document.getElementById('attendance-section');
    const classDetail = document.getElementById('class-detail');
    const classManagement = document.querySelector('.class-management');

    function hideAllMainSections() {
        if (statisticsSection) statisticsSection.classList.add('hidden');
        if (attendanceSection) attendanceSection.classList.add('hidden');
        if (classDetail) classDetail.classList.add('hidden');
        if (fullStatisticsSection) fullStatisticsSection.classList.add('hidden');
        if (classManagement) classManagement.classList.add('hidden');
    }

    if (fullStatisticsBtn) {
        fullStatisticsBtn.addEventListener('click', () => {
            hideAllMainSections();
            fullStatisticsSection.classList.remove('hidden');
        });
    }
});

function setupNavigation() {
    // 학급 카드 클릭 이벤트 위임
    document.getElementById('class-list').addEventListener('click', (e) => {
        const classCard = e.target.closest('.class-card');
        if (!classCard) return;

        const classId = classCard.dataset.classId;
        if (e.target.classList.contains('attendance-btn')) {
            window.attendanceManager.showAttendanceSection(classId);
        } else if (e.target.classList.contains('statistics-btn')) {
            window.statisticsManager.showStatisticsSection(classId);
        }
    });

    // 뒤로가기 버튼 이벤트 리스너
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            hideAllSections();
            document.getElementById('main-section').classList.remove('hidden');
        });
    });
}

function hideAllSections() {
    document.getElementById('class-detail').classList.add('hidden');
    document.getElementById('attendance-section').classList.add('hidden');
    document.getElementById('statistics-section').classList.add('hidden');
}

// 날짜 포맷팅 헬퍼 함수
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// 시간 포맷팅 헬퍼 함수
function formatTime(date) {
    return date.toTimeString().split(' ')[0].substring(0, 5);
}

// 모달 표시 헬퍼 함수
function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            ${content}
            <button onclick="this.parentElement.parentElement.remove()">닫기</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// 알림 표시 헬퍼 함수
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 전체 통계 돌아가기 버튼 이벤트 리스너
document.getElementById("back-to-main-btn").addEventListener("click", function () {
    // 전체 통계 섹션 숨기기
    document.getElementById("full-statistics-section").classList.add("hidden");

    // 메인 섹션 보이기
    document.querySelector(".class-management").classList.remove("hidden");

});


// 전역 함수로 등록
window.showModal = showModal;
window.showNotification = showNotification; 