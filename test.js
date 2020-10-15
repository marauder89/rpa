
const { Builder, Capabilities, By, Actions } = require("selenium-webdriver");
const capabilities = Capabilities.chrome();
const cv = require('opencv4nodejs');
const fs = require('fs');

const fileDir = 'C:/Users/DTA/Desktop/selenium/USER/cn=심청이노인복지센터2,ou=건강보험,ou=MOHW RA센터,ou=등록기관,ou=licensedCA,o=KICA,c=KR';
const id = '32729000302';
const password = 'simcare2378';

(async() => {
    const driver = new Builder()
        .usingServer("http://192.168.1.109:4444/")
        .withCapabilities(capabilities)
        .build();
    try {
        await driver.get('http://www.longtermcare.or.kr/npbs/auth/login/loginForm?&rtnUrl=');
        await driver.executeScript(`document.getElementById('userNo').value = '${id}';`);
        await driver.findElement(By.id('btn_login_A2')).click();        
        await driver.findElement(By.id('xwup_media_memorystorage')).click();
        await driver.findElement(By.id("xwup_openFile")).sendKeys(`${fileDir}/signPri.key\n${fileDir}/signCert.der`);
        await driver.findElement(By.id('xwup_inputpasswd_tek_input1')).click();

        const virtualKeyboard = await driver.findElement(By.id('xwup_inputpasswd_tek_input1_layoutLower'));
        const binary = await virtualKeyboard.takeScreenshot();

        fs.writeFile('tk/keyboard.png', Buffer.from(binary, 'base64'), async() => {            
            for(char of password.split('')){
                await onKeyboardClick(char);
            }
            await driver.executeScript(`tk.done();`);
        });

        onKeyboardClick = async(char) => {
            const keyboard = await cv.imreadAsync(`tk/keyboard.png`);
            const key = await cv.imreadAsync(`tk/${char}.png`);

            const matched = keyboard.matchTemplate(key, 5);
            const minMax = matched.minMaxLoc();
            
            const {maxLoc: {x, y}} = minMax;            
            
            const centerX = Math.floor((x + (x + key.cols)) / 2);
            const centerY = Math.floor((y + (y + key.rows)) / 2);
            
            const {width, height} = await virtualKeyboard.getRect();
            const vertexX = Math.floor(width / 2)*-1;
            const vertexY = Math.floor(height / 2)*-1;
            
            return driver.actions({async: true}).move({origin: virtualKeyboard, x: vertexX + centerX, y: vertexY + centerY}).press().perform();
        }
        
    } finally {
        
    }
    
})();