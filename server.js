
const cv = require('opencv4nodejs');
const request = require('request').defaults({encoding: null});
const express = require('express');
const app = express();
const port = 3000;

app.get('/', async(req, res) => {        
    const img1 = await cv.imreadAsync(`tk-img/tk.png`);
    const img2 = await cv.imreadAsync(`tk-img/4.png`);
    
    const matched = img1.matchTemplate(img2, 5);
    
    const minMax = matched.minMaxLoc();
    const {maxLoc: {x, y}} = minMax;

    const tk = async() => {
        await request.get('http://www.longtermcare.or.kr/npbs/transkeyServlet?op=getKey&name=xwup_inputpasswd_tek_input1&keyType=lower&keyboardType=qwerty&fieldType=password&inputName=inputpasswd_tek_input1&transkeyUuid=5212a1f8c769fc807cb455d583c9420336d3ff4ac2c0d3ac100e40b387a41eff&TK_requestToken=-1837809125&isCrt=true&3430555687', (err, res, body) => {
            return body;
        });        
    };
    const aa = await cv.imdecodeAsync(tk());
    console.log(aa);
    
    
    // const ttt = await cv.imdecodeAsync(aaa);

    

    res.json({x: x, y: y});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

