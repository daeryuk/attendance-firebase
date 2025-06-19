module.exports = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'attendance_db',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
    },
    session: {
        secret: 'your_session_secret_key_here',
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: false, // HTTPS 사용 시 true로 변경
            maxAge: 24 * 60 * 60 * 1000 // 24시간
        }
    },
    port: 3000
}; 