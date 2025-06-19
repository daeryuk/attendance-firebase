// import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; // 제거

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

    async handleRegister() {
        const useremail = document.getElementById('register-useremail').value;
        const password = document.getElementById('register-password').value;
        try {
            await firebase.auth().createUserWithEmailAndPassword(useremail, password);
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            this.showLoginForm();
        } catch (error) {
            alert(error.message || '회원가입에 실패했습니다.');
        }
    }

    async handleLogin() {
        const useremail = document.getElementById('login-useremail').value;
        const password = document.getElementById('login-password').value;
        try {
            await firebase.auth().signInWithEmailAndPassword(useremail, password);
            this.showMainSection();
            if (window.classManager) window.classManager.loadClasses();
        } catch (error) {
            alert(error.message || '로그인에 실패했습니다.');
        }
    }

    async checkSession() {
        // checkSession 등 /api/auth/check 관련 함수는 완전히 삭제
    }

    showMainSection() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('main-section').classList.remove('hidden');
    }

    async handleLogout() {
        try {
            await firebase.auth().signOut();
            this.showLoginForm();
            document.getElementById('main-section').classList.add('hidden');
        } catch (error) {
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// 회원가입
async function signUp(email, password) {
    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        alert('회원가입이 완료되었습니다.');
        // 회원가입 후 자동 로그인
        window.location.reload();
    } catch (error) {
        alert(error.message || '회원가입에 실패했습니다.');
    }
}

// 로그인
async function signIn(email, password) {
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        window.location.reload();
    } catch (error) {
        alert(error.message || '로그인에 실패했습니다.');
    }
}

// 로그아웃
async function signOut() {
    try {
        await firebase.auth().signOut();
        window.location.reload();
    } catch (error) {
        alert('로그아웃에 실패했습니다.');
    }
} 