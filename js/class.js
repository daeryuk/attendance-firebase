class ClassManager {
    constructor() {
        this.addClassBtn = document.getElementById('add-class-btn');
        this.classList = document.getElementById('class-list');
        this.classDetail = document.getElementById('class-detail');
        this.classNameInput = document.getElementById('class-name');
        this.saveClassBtn = document.getElementById('save-class-btn');
        this.addTeacherBtn = document.getElementById('add-teacher-btn');
        this.addStudentBtn = document.getElementById('add-student-btn');
        this.teachersList = document.getElementById('teachers-list');
        this.studentsList = document.getElementById('students-list');
        
        this.currentClassId = null;
        this.init();
    }
    

    init() {
        this.addClassBtn.addEventListener('click', () => this.showAddClassForm());
        this.saveClassBtn.addEventListener('click', () => this.saveClass());
        this.addTeacherBtn.addEventListener('click', () => this.showAddTeacherForm());
        this.addStudentBtn.addEventListener('click', () => this.showAddStudentForm());
        this.loadClasses();
    }

    async loadClasses() {
        try {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (!user) return;
                const snapshot = await firebase.database().ref('users/' + user.uid + '/classes').once('value');
                const classes = [];
                snapshot.forEach(child => {
                    classes.push({ id: child.key, ...child.val() });
                });
                await this.renderClasses(classes, user.uid);
            });
        } catch (error) {
            alert('학급 목록을 불러오는 중 오류가 발생했습니다.');
        }
    }

    async renderClasses(classes, uid) {
        this.classList.innerHTML = '';
        for (const classItem of classes) {
            const [teachersSnap, studentsSnap] = await Promise.all([
                firebase.database().ref('users/' + uid + '/teachers').orderByChild('classId').equalTo(classItem.id).once('value'),
                firebase.database().ref('users/' + uid + '/students').orderByChild('classId').equalTo(classItem.id).once('value')
            ]);
            const teachers = [];
            teachersSnap.forEach(child => teachers.push(child.val().name));
            const students = [];
            studentsSnap.forEach(child => {
                students.push({ id: child.key, ...child.val() });
            });
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            classCard.dataset.classId = String(classItem.id);
            classCard.innerHTML = `
                <button class="delete-class-btn" onclick="window.classManager.showDeleteClassModal('${classItem.id}', '${classItem.name}')" title="학급 삭제">
                  <svg class="delete-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff4757" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6.5" width="18" height="14" rx="3"/><path d="M8 10v6M12 10v6M16 10v6"/><path d="M5 6.5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1.5"/></svg>
                </button>
                <h4>${classItem.name}</h4>
                <p>담임: ${teachers.length > 0 ? teachers.join(', ') : '없음'}</p>
                <p>학생 수: ${students.length}명</p>
                <div class="class-actions">
                    <button onclick="window.classManager.showClassDetailPage('${classItem.id}')">상세보기</button>
                    <button class="attendance-btn" data-class-id="${classItem.id}">출석체크</button>
                </div>
            `;
            const attendanceBtn = classCard.querySelector('.attendance-btn');
            attendanceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.attendanceManager.showAttendanceSection(classItem.id);
            });
            this.classList.appendChild(classCard);
        }
    }

    showAddClassForm() {
        // 모달을 띄우기 전에 기존 모달 제거
        const existingModal = document.querySelector('.modal');
        if (existingModal) existingModal.remove();
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <!-- 상단 아이콘 및 제목 -->
                <div class="modal-header">
                <div class="modal-icon">
                    <span class="modal-icon-emoji">🏫</span>
                </div>
                <h3>새 학급 만들기</h3>
                </div>

                <!-- 구분선 -->
                <div class="modal-divider"></div>

                <!-- 학급 이름 -->
                <div class="form-group">
                <label class="modal-label">학급 이름</label>
                <input type="text" class="modal-class-name modal-input" placeholder="학급 이름을 입력하세요">
                </div>

                <!-- 담임 선생님 -->
                <div class="form-group">
                <label class="modal-label">담임 선생님</label>
                <div id="modal-teachers-container">
                    <div class="teacher-input-row">
                    <input type="text" class="teacher-input modal-input" placeholder="선생님 이름">
                    <button type="button" class="remove-teacher-btn modal-remove-btn">삭제</button>
                    </div>
                </div>
                <button type="button" id="add-teacher-input-btn" class="modal-add-btn">+ 선생님 추가</button>
                </div>

                <!-- 학생 목록 -->
                <div class="form-group">
                <label class="modal-label">학생 목록</label>
                <div id="modal-students-container">
                    <div class="student-input-row">
                    <input type="text" class="student-input modal-input" placeholder="학생 이름">
                    <button type="button" class="remove-student-btn modal-remove-btn">삭제</button>
                    </div>
                </div>
                <button type="button" id="add-student-input-btn" class="modal-add-btn">+ 학생 추가</button>
                </div>

                <!-- 버튼 영역 -->
                <div class="modal-footer">
                <button class="modal-cancel-btn" onclick="this.closest('.modal').remove()">닫기</button>
                <button id="modal-create-class-btn" class="modal-create-btn">학급 생성</button>
                </div>

                <!-- 우측 상단 X -->
                <button onclick="this.closest('.modal').remove()" class="modal-close-x">✕</button>
            `);
            
            setTimeout(() => {
                // 선생님 추가 버튼 이벤트
                document.getElementById('add-teacher-input-btn').onclick = () => {
                    const container = document.getElementById('modal-teachers-container');
                    const newRow = document.createElement('div');
                    newRow.className = 'teacher-input-row';
                    newRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
                    newRow.innerHTML = `
                        <input type="text" class="teacher-input" placeholder="선생님 이름" style="flex:1;padding:8px;border:1.5px solid #e0e0e0;border-radius:6px;">
                        <button type="button" class="remove-teacher-btn" style="padding:8px 12px;background:#ff4757;color:white;border:none;border-radius:6px;cursor:pointer;">삭제</button>
                    `;
                    container.appendChild(newRow);
                    
                    // 새로 추가된 삭제 버튼에 이벤트 추가
                    newRow.querySelector('.remove-teacher-btn').onclick = () => {
                        if (container.children.length > 1) {
                            newRow.remove();
                        }
                    };
                };
                
                // 학생 추가 버튼 이벤트
                document.getElementById('add-student-input-btn').onclick = () => {
                    const container = document.getElementById('modal-students-container');
                    const newRow = document.createElement('div');
                    newRow.className = 'student-input-row';
                    newRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';
                    newRow.innerHTML = `
                        <input type="text" class="student-input" placeholder="학생 이름" style="flex:1;padding:8px;border:1.5px solid #e0e0e0;border-radius:6px;">
                        <button type="button" class="remove-student-btn" style="padding:8px 12px;background:#ff4757;color:white;border:none;border-radius:6px;cursor:pointer;">삭제</button>
                    `;
                    container.appendChild(newRow);
                    
                    // 새로 추가된 삭제 버튼에 이벤트 추가
                    newRow.querySelector('.remove-student-btn').onclick = () => {
                        if (container.children.length > 1) {
                            newRow.remove();
                        }
                    };
                };
                
                // 초기 삭제 버튼들에 이벤트 추가
                document.querySelector('.remove-teacher-btn').onclick = () => {
                    const container = document.getElementById('modal-teachers-container');
                    if (container.children.length > 1) {
                        container.firstElementChild.remove();
                    }
                };
                
                document.querySelector('.remove-student-btn').onclick = () => {
                    const container = document.getElementById('modal-students-container');
                    if (container.children.length > 1) {
                        container.firstElementChild.remove();
                    }
                };
                
                // 학급 생성 버튼 이벤트
                document.getElementById('modal-create-class-btn').onclick = () => {
                    const className = document.querySelector('.modal-class-name').value.trim();
                    
                    if (!className) {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('학급 이름을 입력하세요.', 'error');
                        } else {
                            alert('학급 이름을 입력하세요.');
                        }
                        return;
                    }
                    
                    // 선생님 목록 수집
                    const teacherInputs = document.querySelectorAll('.teacher-input');
                    const teachers = Array.from(teacherInputs)
                        .map(input => input.value.trim())
                        .filter(name => name);
                    
                    // 학생 목록 수집
                    const studentInputs = document.querySelectorAll('.student-input');
                    const students = Array.from(studentInputs)
                        .map(input => input.value.trim())
                        .filter(name => name);
                    
                    this.createClassWithMembers(className, teachers, students);
                    document.querySelector('.modal').remove();
                };
                
                document.querySelector('.modal-class-name').focus();
                
                // Enter 키 이벤트 추가
                document.querySelector('.modal-class-name').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('modal-create-class-btn').click();
                    }
                });
            }, 0);
        } else {
            // 폴백: 기존 방식
            this.currentClassId = null;
            this.classNameInput.value = '';
            this.classDetail.classList.remove('hidden');
            this.teachersList.innerHTML = '';
            this.studentsList.innerHTML = '';
        }
    }

    async createClassWithMembers(className, teachers, students) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const newClassRef = firebase.database().ref('users/' + user.uid + '/classes').push();
            await newClassRef.set({
                name: className,
                createdAt: Date.now()
            });
            const classId = newClassRef.key;
            for (const teacherName of teachers) {
                if (teacherName.trim()) {
                    await firebase.database().ref('users/' + user.uid + '/teachers').push({
                        name: teacherName.trim(),
                        classId,
                        createdAt: Date.now()
                    });
                }
            }
            for (const studentName of students) {
                if (studentName.trim()) {
                    await firebase.database().ref('users/' + user.uid + '/students').push({
                        name: studentName.trim(),
                        classId,
                        createdAt: Date.now()
                    });
                }
            }
            await this.loadClasses();
        } catch (error) {
            alert('학급 생성에 실패했습니다.');
        }
    }

    async saveClass() {
        const name = this.classNameInput.value;
        if (!name) {
            alert('학급 이름을 입력해주세요.');
            return;
        }
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            if (this.currentClassId) {
                await firebase.database().ref('users/' + user.uid + '/classes/' + this.currentClassId + '/name').set(name);
            } else {
                const newClassRef = firebase.database().ref('users/' + user.uid + '/classes').push();
                await newClassRef.set({ name, createdAt: Date.now() });
            }
            alert('학급이 성공적으로 저장되었습니다.');
            this.loadClasses();
            this.classDetail.classList.add('hidden');
        } catch (error) {
            alert('학급 저장에 실패했습니다.');
        }
    }

    showClassDetailPage(classId) {
        // 모든 섹션 숨기기
        this.hideAllSections();
        
        // 상세보기 섹션 표시
        this.showDetailPage(classId);
    }

    async showDetailPage(classId) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const classSnap = await firebase.database().ref('users/' + user.uid + '/classes/' + classId).once('value');
            const classData = classSnap.val();
            if (!classData) {
                alert('학급 정보를 찾을 수 없습니다.');
                return;
            }
            // 최신 teachers/students 데이터를 가져온 후에 detailPageHTML 생성
            const teachersSnap = await firebase.database().ref('users/' + user.uid + '/teachers').orderByChild('classId').equalTo(classId).once('value');
            const teachers = [];
            teachersSnap.forEach(child => teachers.push({ id: child.key, ...child.val() }));
            const studentsSnap = await firebase.database().ref('users/' + user.uid + '/students').orderByChild('classId').equalTo(classId).once('value');
            const students = [];
            studentsSnap.forEach(child => {
                students.push({ id: child.key, ...child.val() });
            });
            classData.teachers = teachers;
            classData.students = students;
            this.currentClassId = classId;
            // detailPageHTML을 최신 데이터로 생성
            const detailPageHTML = `
                <div class="detail-page">
                    <div class="detail-header">
                        <h2>📚 ${classData.name} 상세 정보</h2>
                        <button onclick="window.classManager.hideDetailPage()" class="close-btn">✕ 닫기</button>
                    </div>
                    <div class="detail-content">
                        <div class="detail-section">
                            <h3>선생님 목록</h3>
                            <div class="teachers-list">
                                ${classData.teachers.length > 0 ? 
                                    classData.teachers.map(teacher => `
                                        <div class="teacher-item">
                                            <span>${teacher.name}</span>
                                            <button onclick="window.classManager.showDeleteTeacherModal('${teacher.id}', '${teacher.name}')" class="delete-icon-btn" title="선생님 삭제"></button>
                                        </div>
                                    `).join('') : 
                                    '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">등록된 선생님이 없습니다.</p>'
                                }
                            </div>
                            <button onclick="window.classManager.showAddTeacherForm()" class="add-btn">선생님 추가</button>
                        </div>
                        <div class="detail-section">
                            <h3>학생 목록</h3>
                            <div class="students-list">
                                ${classData.students.length > 0 ? 
                                    classData.students.map(student => `
                                        <div class="student-item">
                                            <span>${student.name}</span>
                                            <button onclick="window.classManager.showDeleteStudentModal('${student.id}', '${student.name}')" class="delete-icon-btn" title="학생 삭제"></button>
                                        </div>
                                    `).join('') : 
                                    '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">등록된 학생이 없습니다.</p>'
                                }
                            </div>
                            <button onclick="window.classManager.showAddStudentForm()" class="add-btn">학생 추가</button>
                        </div>
                    </div>
                </div>
            `;
            // 기존 상세보기 페이지 제거
            const existingDetailPage = document.querySelector('.detail-page');
            if (existingDetailPage) {
                existingDetailPage.remove();
            }
            // 새로운 상세보기 페이지 추가
            document.getElementById('main-section').insertAdjacentHTML('beforeend', detailPageHTML);
        } catch (error) {
            alert('학급 정보를 불러오는 중 오류가 발생했습니다.');
        }
    }

    hideDetailPage() {
        const detailPage = document.querySelector('.detail-page');
        if (detailPage) {
            detailPage.remove();
        }
    }

    showDeleteClassModal(classId, className) {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>학급 삭제</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    <strong>${className}</strong> 학급을 삭제하시겠습니까?<br>
                    이 작업은 되돌릴 수 없으며, 모든 출석 기록도 함께 삭제됩니다.
                </p>
                <div class="form-group">
                    <label for="modal-password">비밀번호 확인</label>
                    <input type="password" id="modal-password" placeholder="비밀번호를 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-delete-class-btn" style="background:#ff4757;">삭제</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-delete-class-btn').onclick = () => {
                    const password = document.getElementById('modal-password').value;
                    if (password) {
                        this.deleteClass(classId, password); // 비밀번호 전달
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('비밀번호를 입력하세요.', 'error');
                        } else {
                            alert('비밀번호를 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-password').focus();
                // Enter 키 이벤트 추가
                document.getElementById('modal-password').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('modal-delete-class-btn').click();
                    }
                });
            }, 0);
        } else {
            const password = prompt('학급을 삭제하려면 비밀번호를 입력하세요:');
            if (password) {
                this.deleteClass(classId, password); // 비밀번호 전달
            }
        }
    }

    async deleteClass(classId, password) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            // re-authenticate
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
            await user.reauthenticateWithCredential(credential);
            await firebase.database().ref('users/' + user.uid + '/classes/' + classId).remove();
            const [teachersSnap, studentsSnap, attendancesSnap] = await Promise.all([
                firebase.database().ref('users/' + user.uid + '/teachers').orderByChild('classId').equalTo(classId).once('value'),
                firebase.database().ref('users/' + user.uid + '/students').orderByChild('classId').equalTo(classId).once('value'),
                firebase.database().ref('users/' + user.uid + '/attendances').orderByChild('classId').equalTo(classId).once('value')
            ]);
            teachersSnap.forEach(child => child.ref.remove());
            studentsSnap.forEach(child => child.ref.remove());
            attendancesSnap.forEach(child => child.ref.remove());
            await this.loadClasses();
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                alert('비밀번호가 일치하지 않습니다.');
            } else {
                alert('학급 삭제에 실패했습니다.');
            }
        }
    }

    showAddTeacherForm() {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>선생님 추가</h3>
                <div class="form-group">
                    <label for="modal-teacher-name">선생님 이름</label>
                    <input type="text" id="modal-teacher-name" placeholder="이름을 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-add-teacher-btn" style="background:#6a82fb;">추가</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-add-teacher-btn').onclick = () => {
                    const name = document.getElementById('modal-teacher-name').value.trim();
                    if (name) {
                        this.addTeacher(name);
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('이름을 입력하세요.', 'error');
                        } else {
                            alert('이름을 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-teacher-name').focus();
            }, 0);
        } else {
            const name = prompt('선생님 이름을 입력해주세요:');
            if (name) {
                this.addTeacher(name);
            }
        }
    }

    async addTeacher(name) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const newTeacherRef = firebase.database().ref('users/' + user.uid + '/teachers').push();
            await newTeacherRef.set({
                name,
                classId: this.currentClassId,
                createdAt: Date.now()
            });
            this.showDetailPage(this.currentClassId);
        } catch (error) {
            console.error('선생님 추가 에러:', error);
            alert('선생님 추가 중 오류가 발생했습니다.');
        }
    }

    showAddStudentForm() {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>학생 추가</h3>
                <div class="form-group">
                    <label for="modal-student-name">학생 이름</label>
                    <input type="text" id="modal-student-name" placeholder="이름을 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-add-student-btn" style="background:#6a82fb;">추가</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-add-student-btn').onclick = async () => {
                    const name = document.getElementById('modal-student-name').value.trim();
                    if (name) {
                        await this.addStudent(name);
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('이름을 입력하세요.', 'error');
                        } else {
                            alert('이름을 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-student-name').focus();
            }, 0);
        } else {
            const name = prompt('학생 이름을 입력해주세요:');
            if (name) {
                this.addStudent(name);
            }
        }
    }

    async addStudent(name) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            const newStudentRef = firebase.database().ref('users/' + user.uid + '/students').push();
            await newStudentRef.set({
                name,
                classId: String(this.currentClassId), // 항상 문자열로 저장
                createdAt: Date.now()
            });
            await this.showDetailPage(this.currentClassId);
            // 학생 추가 후 출석체크 화면도 즉시 갱신
            if (window.attendanceManager && window.attendanceManager.currentClassId === this.currentClassId) {
                window.attendanceManager.loadStudents();
            }
        } catch (error) {
            console.error('학생 추가 에러:', error);
            alert('학생 추가 중 오류가 발생했습니다.');
        }
    }

    renderTeachers(teachers) {
        this.teachersList.innerHTML = '';
        teachers.forEach(teacher => {
            const teacherElement = document.createElement('div');
            teacherElement.className = 'teacher-item';
            teacherElement.innerHTML = `
                <p>${teacher.name}</p>
                <button onclick="window.classManager.deleteTeacher(${teacher.id})">삭제</button>
            `;
            this.teachersList.appendChild(teacherElement);
        });
    }

    renderStudents(students) {
        this.studentsList.innerHTML = '';
        students.forEach(student => {
            const studentElement = document.createElement('div');
            studentElement.className = 'student-item';
            studentElement.innerHTML = `
                <p>${student.name}</p>
                <button onclick="window.classManager.deleteStudent(${student.id})">삭제</button>
            `;
            this.studentsList.appendChild(studentElement);
        });
    }

    async deleteTeacher(teacherId) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            await firebase.database().ref('users/' + user.uid + '/teachers/' + teacherId).remove();
            if (typeof window.showNotification === 'function') {
                window.showNotification('선생님이 성공적으로 삭제되었습니다.', 'success');
            } else {
                alert('선생님이 성공적으로 삭제되었습니다.');
            }
            this.showDetailPage(this.currentClassId);
        } catch (error) {
            console.error('선생님 삭제 에러:', error);
            if (typeof window.showNotification === 'function') {
                window.showNotification('선생님 삭제 중 오류가 발생했습니다.', 'error');
            } else {
                alert('선생님 삭제 중 오류가 발생했습니다.');
            }
        }
    }

    async deleteStudent(studentId) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            // 학생 삭제
            await firebase.database().ref('users/' + user.uid + '/students/' + studentId).remove();
            // 출석정보 삭제
            const attendancesSnap = await firebase.database().ref('users/' + user.uid + '/attendances').orderByChild('studentId').equalTo(studentId).once('value');
            let deletedCount = 0;
            attendancesSnap.forEach(child => {
                child.ref.remove();
                deletedCount++;
            });
            if (typeof window.showNotification === 'function') {
                window.showNotification('학생이 성공적으로 삭제되었습니다.' + (deletedCount > 0 ? ` (출석기록 ${deletedCount}건도 삭제됨)` : ''), 'success');
            } else {
                alert('학생이 성공적으로 삭제되었습니다.' + (deletedCount > 0 ? ` (출석기록 ${deletedCount}건도 삭제됨)` : ''));
            }
            this.showDetailPage(this.currentClassId);
        } catch (error) {
            console.error('학생 삭제 에러:', error);
            if (typeof window.showNotification === 'function') {
                window.showNotification('학생 삭제 중 오류가 발생했습니다.', 'error');
            } else {
                alert('학생 삭제 중 오류가 발생했습니다.');
            }
        }
    }

    showClassDetails(classId) {
        // 모든 섹션 숨기기
        this.hideAllSections();
        
        // 선택된 반 버튼 활성화
        document.querySelectorAll('.class-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // 반 상세 정보 표시
        this.classDetailsSection.classList.remove('hidden');
        this.loadClassDetails(classId);
    }

    hideAllSections() {
        // 모든 섹션 숨기기
        this.classDetail.classList.add('hidden');
        
        // 출석, 통계, 전체 통계 섹션도 숨기기
        if (window.attendanceManager) {
            window.attendanceManager.attendanceSection.classList.add('hidden');
        }
        if (window.statisticsManager) {
            window.statisticsManager.statisticsSection.classList.add('hidden');
        }
        if (window.overallStatisticsManager) {
            window.overallStatisticsManager.overallStatisticsSection.classList.add('hidden');
        }
        
        // 상세보기 페이지 숨기기
        this.hideDetailPage();
    }

    showDeleteTeacherModal(teacherId, teacherName) {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>선생님 삭제</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    <strong>${teacherName}</strong> 선생님을 삭제하시겠습니까?<br>
                    이 작업은 되돌릴 수 없습니다.
                </p>
                <div class="form-group">
                    <label for="modal-password">비밀번호 확인</label>
                    <input type="password" id="modal-password" placeholder="비밀번호를 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-delete-teacher-btn" style="background:#ff4757;">삭제</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-delete-teacher-btn').onclick = () => {
                    const password = document.getElementById('modal-password').value;
                    if (password) {
                        this.deleteTeacher(teacherId, password); // 비밀번호 전달
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('비밀번호를 입력하세요.', 'error');
                        } else {
                            alert('비밀번호를 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-password').focus();
                // Enter 키 이벤트 추가
                document.getElementById('modal-password').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('modal-delete-teacher-btn').click();
                    }
                });
            }, 0);
        } else {
            const password = prompt('선생님을 삭제하려면 비밀번호를 입력하세요:');
            if (password) {
                this.deleteTeacher(teacherId, password); // 비밀번호 전달
            }
        }
    }

    async deleteTeacher(teacherId, password) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            // re-authenticate
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
            await user.reauthenticateWithCredential(credential);
            await firebase.database().ref('users/' + user.uid + '/teachers/' + teacherId).remove();
            if (typeof window.showNotification === 'function') {
                window.showNotification('선생님이 성공적으로 삭제되었습니다.', 'success');
            } else {
                alert('선생님이 성공적으로 삭제되었습니다.');
            }
            this.showDetailPage(this.currentClassId);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                alert('비밀번호가 일치하지 않습니다.');
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('선생님 삭제 중 오류가 발생했습니다.', 'error');
                } else {
                    alert('선생님 삭제 중 오류가 발생했습니다.');
                }
            }
        }
    }

    showDeleteStudentModal(studentId, studentName) {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>학생 삭제</h3>
                <p style="margin-bottom: 20px; color: #666;">
                    <strong>${studentName}</strong> 학생을 삭제하시겠습니까?<br>
                    이 작업은 되돌릴 수 없으며, 모든 출석 기록도 함께 삭제됩니다.
                </p>
                <div class="form-group">
                    <label for="modal-password">비밀번호 확인</label>
                    <input type="password" id="modal-password" placeholder="비밀번호를 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-delete-student-btn" style="background:#ff4757;">삭제</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-delete-student-btn').onclick = () => {
                    const password = document.getElementById('modal-password').value;
                    if (password) {
                        this.deleteStudent(studentId, password); // 비밀번호 전달
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('비밀번호를 입력하세요.', 'error');
                        } else {
                            alert('비밀번호를 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-password').focus();
                // Enter 키 이벤트 추가
                document.getElementById('modal-password').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        document.getElementById('modal-delete-student-btn').click();
                    }
                });
            }, 0);
        } else {
            const password = prompt('학생을 삭제하려면 비밀번호를 입력하세요:');
            if (password) {
                this.deleteStudent(studentId, password); // 비밀번호 전달
            }
        }
    }

    async deleteStudent(studentId, password) {
        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('로그인 필요');
            // re-authenticate
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
            await user.reauthenticateWithCredential(credential);
            // 학생 삭제
            await firebase.database().ref('users/' + user.uid + '/students/' + studentId).remove();
            // 출석정보 삭제
            const attendancesSnap = await firebase.database().ref('users/' + user.uid + '/attendances').orderByChild('studentId').equalTo(studentId).once('value');
            let deletedCount = 0;
            attendancesSnap.forEach(child => {
                child.ref.remove();
                deletedCount++;
            });
            if (typeof window.showNotification === 'function') {
                window.showNotification('학생이 성공적으로 삭제되었습니다.' + (deletedCount > 0 ? ` (출석기록 ${deletedCount}건도 삭제됨)` : ''), 'success');
            } else {
                alert('학생이 성공적으로 삭제되었습니다.' + (deletedCount > 0 ? ` (출석기록 ${deletedCount}건도 삭제됨)` : ''));
            }
            this.showDetailPage(this.currentClassId);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                alert('비밀번호가 일치하지 않습니다.');
            } else {
                if (typeof window.showNotification === 'function') {
                    window.showNotification('학생 삭제 중 오류가 발생했습니다.', 'error');
                } else {
                    alert('학생 삭제 중 오류가 발생했습니다.');
                }
            }
        }
    }

    showClassDetails(classId) {
        // 모든 섹션 숨기기
        this.hideAllSections();
        
        // 선택된 반 버튼 활성화
        document.querySelectorAll('.class-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // 반 상세 정보 표시
        this.classDetailsSection.classList.remove('hidden');
        this.loadClassDetails(classId);
    }

    hideAllSections() {
        // 모든 섹션 숨기기
        this.classDetail.classList.add('hidden');
        
        // 출석, 통계, 전체 통계 섹션도 숨기기
        if (window.attendanceManager) {
            window.attendanceManager.attendanceSection.classList.add('hidden');
        }
        if (window.statisticsManager) {
            window.statisticsManager.statisticsSection.classList.add('hidden');
        }
        if (window.overallStatisticsManager) {
            window.overallStatisticsManager.overallStatisticsSection.classList.add('hidden');
        }
        
        // 상세보기 페이지 숨기기
        this.hideDetailPage();
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.classManager = new ClassManager();
}); 