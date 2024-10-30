const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { startBrowser, browsers, closeBlankPages } = require('./browserManager');
const { videosDir } = require('../../../config');


/**
 * 从远程 URL 下载视频文件到本地
 * @param {string} videoUrl - 视频的 URL
 * @param {string} fileName - 保存的文件名
 * @returns {Promise<string>} - 返回本地文件路径
 */
const downloadVideo = async (videoUrl, fileName) => {
    // 本地环境
    // const localPath = path.resolve(__dirname, fileName);
    // 线上环境
    const localPath = path.join(videosDir, fileName);

    const writer = fs.createWriteStream(localPath);

    try {
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream'
        });

        console.log('开始下载视频流');
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`视频下载完成，文件保存在: ${localPath}`);
                resolve(localPath);
            });
            writer.on('error', (err) => {
                console.error('写入流出错:', err);
                reject(err);
            });
        });
    } catch (error) {
        console.error('视频下载出错:', error.message);
        throw new Error('视频下载失败');
    }
};
/**
 * 上传视频逻辑
 */
const uploadVideo = async (browser, page, videoPath, title, desc) => {
    console.log("开始上传视频...");
    // const pages = await browser.pages();
    // let contactPageExists = false;

    // 代替定时器的刷新页面
    // for (let page of pages) {
    //     const pageUrl = page.url();
    //     if (pageUrl === 'https://creator.douyin.com/creator-micro/creator/help/contact') {
    //         contactPageExists = true;
    //         break;
    //     }
    // }
    // // 如果没有找到 contact 页面，则新建一个
    // if (!contactPageExists) {
    //     const time_page = await browser.newPage();
    //     await time_page.goto('https://creator.douyin.com/creator-micro/creator/help/contact', { waitUntil: 'networkidle0' });
    //     console.log('已打开 contact 页面');
    //     //todo设置定时器刷新这个页面，当这个页面没有了说明账号被踢出去了，就关闭浏览器同时清除浏览器映射
    // }

    await closeBlankPages(browser);
    
    await page.goto('https://creator.douyin.com/creator-micro/content/upload', { waitUntil: 'networkidle0' });
    await page.waitForSelector('div.container-F4b8d7 .container-drag-AOMYqU', { timeout: 60000 });

    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
        await fileInput.uploadFile(videoPath);
        console.log("视频上传成功");
        
    } else {
        console.error("未找到文件上传 input");
        throw new Error("上传输入框未找到");
    }
    // 设置一个定时器定时检查看视频上传完之后有没有跳到“发布视频”页面
    let is_send_video_page = false;

    const is_send_video_page_Interval = setInterval(async () => { 
        const currentUrl = page.url();

        if (currentUrl == 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page') {
            console.log(`进入发布视频页面`);
            is_send_video_page = true; 

            clearInterval(is_send_video_page_Interval);

            // 进入发布视频页面做最后操作
            await sendVideoPage(page, title, desc);
        } else {
            console.log(`等待进入发布视频页面...`);
        }
    }, 3000);
};

/**
 * 填写标题和简介
 */
const sendVideoPage = async (page, title, desc) => {
    await page.waitForSelector('input[placeholder="填写作品标题，为作品获得更多流量"]');
    await page.type('input[placeholder="填写作品标题，为作品获得更多流量"]', title);
    
    await page.waitForSelector('div[data-placeholder="添加作品简介"]');
    await page.type('div[data-placeholder="添加作品简介"]', desc);

    console.log(`已填写标题和简介`);

    await page.waitForSelector('div.tabItem-J7IiAk.active-vwSHoT', { visible: true });
    console.log(`预览视频DOM已加载`);


    
    await page.waitForSelector('button.button-dhlUZE.primary-cECiOJ.fixed-J9O8Yw');
    // await page.click('button.button-dhlUZE.primary-cECiOJ.fixed-J9O8Yw');
    await page.evaluate(() => {
        setTimeout(() => {
            document.querySelector('button.button-dhlUZE.primary-cECiOJ.fixed-J9O8Yw').click();
            console.log(`已点击提交按钮`);
        }, 2000);
    });
    console.log(`已点击提交按钮`);
};

/**
 * 处理请求逻辑
 */
const handleRequest = async (phoneNumber, videoUrl, title, desc) => {
    console.log(`处理手机号为 ${phoneNumber} 的请求，视频 URL: ${videoUrl}`);
    const timestamp = Math.floor(Date.now() / 1000);

    // 下载视频到本地
    // const localVideoPath = await downloadVideo(videoUrl, `../../../videos/${phoneNumber}_${timestamp}.mp4`);
    // 打包线上环境
    const localVideoPath = await downloadVideo(videoUrl, `${phoneNumber}_${timestamp}.mp4`);

    console.log(`视频下载完成: ${localVideoPath}`);

    // return;

    let page, browser;
    if (browsers[phoneNumber]) {
        // 已经有该手机号的浏览器实例，复用
        if (browsers[phoneNumber].timeoutId) {
            clearTimeout(browsers[phoneNumber].timeoutId);
            console.log(`取消之前的定时器：${browsers[phoneNumber].timeoutId}`);
        }
        console.log(`复用旧的浏览器实例用于手机号 ${phoneNumber}`);
        page = browsers[phoneNumber].page;
        browser = browsers[phoneNumber].browser
    } else {
        // 没有该手机号的浏览器实例，创建新的
        console.log(`创建新的浏览器实例用于手机号 ${phoneNumber}`);
        const bros = await startBrowser(phoneNumber);
        page = bros.page;
        browser = bros.browser;
        // 保存浏览器实例
        browsers[phoneNumber] = { browser,page };
    }

    // 上传视频
    await uploadVideo(browser, page, localVideoPath, title, desc);


};

module.exports = { handleRequest };