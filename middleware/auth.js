const config = require('../config');

module.exports = (req, res, next) => {
    if (req.session && req.session.userId) {
        req.userData = {
            userId: req.session.userId,
            username: req.session.username,
            name: req.session.name
        };
        next();
    } else {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }
}; 