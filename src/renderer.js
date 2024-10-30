const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value;
            const videoUrl = document.getElementById('videoUrl').value;
            const title = document.getElementById('title').value;
            const desc = document.getElementById('desc').value;

            // 发送数据到主进程
            ipcRenderer.send('start-upload', { phone, videoUrl, title, desc });

            ipcRenderer.on('upload-success', (event, message) => {
                alert(message);
            });
            
            ipcRenderer.on('upload-failure', (event, message) => {
                alert(message);
            });
        });
    } else {
        console.error("Form with ID 'uploadForm' not found.");
    }
});
// const { ipcRenderer } = require('electron');

// document.addEventListener('DOMContentLoaded', () => {
//     const uploadForm = document.getElementById('uploadForm');

//     if (uploadForm && !uploadForm.hasListener) { // 检查是否已经绑定事件
//         uploadForm.addEventListener('submit', (e) => {
//             e.preventDefault();

//             const phone = document.getElementById('phone').value;
//             const videoUrl = document.getElementById('videoUrl').value;
//             const title = document.getElementById('title').value;
//             const desc = document.getElementById('desc').value;

//             // 发送数据到主进程
//             ipcRenderer.send('start-upload', { phone, videoUrl, title, desc });
//         });

//         // 添加标志避免重复绑定
//         uploadForm.hasListener = true;
//     } else {
//         console.error("Form with ID 'uploadForm' not found or already has a listener.");
//     }
// });