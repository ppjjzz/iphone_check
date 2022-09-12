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
  const data = {
    "template_id": "1dmrMj3G065HCMRODNczR768zcWSEyKTnU_QDCLOguo",
    "page": "page/index",
    "touser": "opuTv0A8A1_DQBHDGqGBrvdIMEdA",
    "data": {
      "thing1": {
            "value": storeName
        },
        "date3": {
            "value": Date.now()
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
    const result = await sendMessage('iPhone 14 Pro Max 256GB 深空黑色', '珠江新城');
    console.log(result);
    
  } catch (error) {
    console.error(error);
  }
  res.json({
    code: 0,
    msg: 'success',
    data: JSON.stringify(req.headers)
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
  // timer = setInterval(() => {
  //   main(); 
  // }, 2000);  
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
              // if (part.pickupSearchQuote !== '暂无供应') {
              //     canBuy.push({
              //         status: part.pickupSearchQuote,
              //         type: part.storePickupProductTitle
              //     })
              // }
          }
          console.log(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}  ${storeName}  ${JSON.stringify(canBuy)}`)
     }
     console.log('\n\n\n')
  } catch (error) {
      
  }
}
