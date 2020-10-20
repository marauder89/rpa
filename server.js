
const express = require('express');
const cv = require('opencv4nodejs');
const fs = require('fs');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const proxy = require('selenium-webdriver/proxy');

const app = express();
const port = 3000;
const fileDir = 'C:/key';
const id = '32729000302';
const password = 'simcare2378';
let url = '';
let webCookie = {};

app.get('/login', async(req, res) => {    
    //.setChromeOptions(new chrome.Options().addArguments('--proxy-server=socks5://127.0.0.1:9150'))    -proxy 설정
    const driver = new Builder().forBrowser('chrome').build();
    
    try {        
        await driver.get('http://www.longtermcare.or.kr/npbs/auth/login/loginForm.web?menuId=npe0000002160&rtnUrl=&zoomSize=');
        await driver.executeAsyncScript(`document.getElementById('userNo').value = '${id}';`);
        await driver.findElement(By.id('btn_login_A2')).click();
        await driver.wait(until.elementLocated(By.id('xwup_media_memorystorage')), 100000, 'ANUSIGN init error');        
        await driver.findElement(By.id('xwup_media_memorystorage')).click();
        await driver.findElement(By.id("xwup_openFile")).sendKeys(`${fileDir}/signPri.key\n${fileDir}/signCert.der`);
        await driver.findElement(By.id('xwup_inputpasswd_tek_input1')).click();

        const virtualKeyboard = await driver.findElement(By.id('xwup_inputpasswd_tek_input1_layoutLower'));
        const binary = await virtualKeyboard.takeScreenshot();

        fs.writeFile('tk/keyboard.png', Buffer.from(binary, 'base64'), async() => {            
            for(char of password.split('')){
                await onKeyboardClick(char);
            }
            await driver.executeAsyncScript('tk.done();');

            let changed = false;
            while(!changed){
                await sleep(100);
                const tabs =  await driver.getAllWindowHandles();

                if(tabs.length > 1) {
                    console.log('tab changed');
                    await driver.switchTo().window(tabs[1]);
                    changed = true;
                    break;
                }
            };
            await driver.wait(until.elementLocated(By.id('mainframe.VFrameSet.HFrameSet.VFrameSetSub.frameMain.POPUP')), 100000, 'popup not found');
            await driver.findElement(By.id('mainframe.VFrameSet.HFrameSet.VFrameSetSub.frameMain.POPUP.titlebar.closebutton:icontext')).click();

            webCookie = await driver.manage().getCookies();
            url = await driver.getCurrentUrl();
            res.send('success');
        });

        sleep = (time) => {
            return new Promise(resolve => setTimeout(resolve, time));
        };

        onKeyboardClick = async(char) => {
            const keyboard = await cv.imreadAsync(`tk/keyboard.png`);
            const key = await cv.imreadAsync(`tk/${char}.png`);

            const matched = await keyboard.matchTemplateAsync(key, 5);
            const minMax = await matched.minMaxLocAsync();
            
            const {maxLoc: {x, y}} = minMax;
            
            const centerX = Math.floor((x + (x + key.cols)) / 2);
            const centerY = Math.floor((y + (y + key.rows)) / 2);
            
            const {width, height} = await virtualKeyboard.getRect();
            const vertexX = Math.floor(width / 2)*-1;
            const vertexY = Math.floor(height / 2)*-1;
            
            return driver.actions({async: true}).move({origin: virtualKeyboard, x: vertexX + centerX, y: vertexY + centerY}).press().perform();
        };

    } catch(error) {
        console.error(error);
    }
});

app.get('/getUrl', async(req, res) => {    
    const driver = new Builder().forBrowser('chrome').build();

    try {
        await driver.get('http://www.longtermcare.or.kr');
        await driver.manage().deleteAllCookies();
        for(_cookie of webCookie){
            await driver.manage().addCookie(_cookie);
        }        
        await driver.get(url);
    } catch(error) {
        console.error(error);
    }
});

app.listen(port, '0.0.0.0', () => {
    chrome.setDefaultService(new chrome.ServiceBuilder('C:/chromedriver.exe').build());
    console.log(`Example app listening at http://localhost:${port}`);
});

