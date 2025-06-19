class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginSection = document.getElementById('login-section');
        this.registerSection = document.getElementById('register-section');
        this.showRegisterBtn = document.getElementById('show-register');
        this.showLoginBtn = document.getElementById('show-login');
        
        this.init();
    }

    init() {
        // 로그인 폼 제출 이벤트
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 회원가입 폼 제출 이벤트
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // 회원가입 페이지로 이동
        this.showRegisterBtn.addEventListener('click', () => {
            this.showRegisterForm();
        });

        // 로그인 페이지로 이동
        this.showLoginBtn.addEventListener('click', () => {
            this.showLoginForm();
        });

        // 세션 확인
        this.checkSession();
    }

    showRegisterForm() {
        this.loginSection.classList.add('hidden');
        this.registerSection.classList.remove('hidden');
    }

    showLoginForm() {
        this.registerSection.classList.add('hidden');
        this.loginSection.classList.remove('hidden');
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // 쿠키 포함
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.showMainSection();
                // 다른 컴포넌트들 초기화
                if (window.classManager) {
                    window.classManager.loadClasses();
                }
            } else {
                const error = await response.json();
                alert(error.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 에러:', error);
            alert('로그인 중 오류가 발생했습니다.');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const name = document.getElementById('register-name').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, password, name })
            });

            if (response.ok) {
                alert('회원가입이 완료되었습니다. 로그인해주세요.');
                this.showLoginForm();
            } else {
                const error = await response.json();
                alert(error.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원가입 에러:', error);
            alert('회원가입 중 오류가 발생했습니다.');
        }
    }

    async checkSession() {
        try {
            const response = await fetch('/api/auth/check', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    // 로그인된 상태면 메인 페이지로 이동
                    this.showMainSection();
                }
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 정상적인 상황이므로 에러 로그를 출력하지 않음
                console.log('로그인되지 않은 상태입니다.');
            }
        } catch (error) {
            console.error('세션 확인 에러:', error);
        }
    }

    showMainSection() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('main-section').classList.remove('hidden');
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                alert('로그아웃되었습니다.');
                this.showLoginForm();
                // 모든 섹션 숨기기
                document.getElementById('main-section').classList.add('hidden');
            }
        } catch (error) {
            console.error('로그아웃 에러:', error);
            this.showLoginForm();
            document.getElementById('main-section').classList.add('hidden');
        }
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
}); 