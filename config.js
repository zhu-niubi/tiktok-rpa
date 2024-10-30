// config.js
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const videosDir = path.join(app.getPath('userData'), 'videos');

// 检查 videos 文件夹是否存在，如果不存在则创建
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
}

module.exports = { videosDir };