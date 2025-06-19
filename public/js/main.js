document.addEventListener('DOMContentLoaded', () => {
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

// API 요청을 위한 헬퍼 함수
async function fetchWithAuth(url, options = {}) {
    const defaultOptions = {
        credentials: 'include', // 쿠키 포함
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (response.status === 401) {
            window.location.href = '/';
            return;
        }
        return response;
    } catch (error) {
        console.error('API 요청 에러:', error);
        throw error;
    }
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

// 전역 함수로 등록
window.showModal = showModal;
window.showNotification = showNotification;
window.fetchWithAuth = fetchWithAuth; 