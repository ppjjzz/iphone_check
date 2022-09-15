const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");

const axios = require('axios');

const url = 'https://www.apple.com.cn/shop/fulfillment-messages?pl=true&mts.0=regular&mts.1=compact&parts.0=MQ883CH/A&parts.1=MQ8A3CH/A&parts.2=MQ893CH/A&parts.3=MQ873CH/A&searchNearby=true&store=R639';

let timer = null;

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

const sendMessage = async (iphoneType, storeName) => {
  const date = new Date();
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  const data = {
    "template_id": "1dmrMj3G065HCMRODNczR768zcWSEyKTnU_QDCLOguo",
    "page": "page/index",
    "touser": "opuTv0A8A1_DQBHDGqGBrvdIMEdA",
    "data": {
      "thing1": {
            "value": storeName
        },
        "date3": {
            "value": `${y}-${m}-${d} ${h}:${min}:${sec}`
        },
        "thing2": {
            "value": iphoneType
        }
    },
    "miniprogram_state": "developer",
    "lang": "zh_CN"
  };
  const resp = await axios.post("https://api.weixin.qq.com/cgi-bin/message/subscribe/send", data)
  return resp.data
}

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

app.post('/iphone14', async (req, res) => {
  if (req.headers["x-wx-source"]) {
    const openId = req.headers["x-wx-openid"];
    
  }
  try {
    const result = await sendMessage('深空黑色', '珠江新城');
    console.log(result);
    
  } catch (error) {
    console.error(error);
  }
  res.json({
    code: 0,
    msg: 'success',
    data: null
  })
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
  timer = setInterval(() => {
    main(); 
  }, 2000);  
}

bootstrap();



async function main () {
  try {
     const res = await axios.get(url + '&_=' + Date.now());
     const stores = res.data.body.content.pickupMessage.stores;
  //    console.log(stores);
     for (const store of stores) {
          const { storeName, partsAvailability, city } = store;
          if (city !== '广州') {
              continue;
          }
          const canBuy = [];
          for (const part of Object.values(partsAvailability)) {
              const compact = part.messageTypes.compact;
              const text = `${compact.storePickupProductTitle}  ${compact.storePickupQuote}`;
              canBuy.push(text);
              if (compact.storeSelectionEnabled) {
                  const iphoneType = storePickupProductTitle.split(' ');
                  sendMessage(iphoneType[iphoneType.length - 1], storeName);
              }
          }
          console.log(`\n${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN')}  ${storeName}`);
            for (const item of canBuy) {
                console.log(item)
            }
     }
     console.log('\n\n\n')
  } catch (error) {
      
  }
}
