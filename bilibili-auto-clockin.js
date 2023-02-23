// ==UserScript==
// @name         B站直播间打卡助手
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Jinyang
// @match        https://t.bilibili.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// ==/UserScript==

(function () {
  'use strict';

  // script start ----------------------------------------------------------
  const clock_in_msg = "打卡～"
  let clock_in_success = 0;
  let clock_in_error = 0;

  const uid = getCookie("DedeUserID");
  const csrf = getCookie("bili_jct");
  const isClockIn = getCookie("isClockIn");

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getCookie(name) {
    const pattern = new RegExp("(^|;\\s*)" + name + "=([^;]*)");
    const matches = document.cookie.match(pattern);
    return matches ? matches[2] : null;
  }

  function setCookie(key, value, time = 7 * 24 * 60 * 60) {
    const exp = new Date();
    exp.setTime(exp.getTime() + time * 1000);
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; expires=${exp.toGMTString()}; path=/`;
  }

  function setCookieExpirationTime() {
    const expiration_time =
      24 * 60 * 60 -
      (new Date().getHours() * 60 * 60 +
        new Date().getMinutes() * 60 +
        new Date().getSeconds());
    setCookie("isClockIn", "true", expiration_time);
  }

  startClockIn(isClockIn);

  function startClockIn(isClockIn) {
    if (!isClockIn) {
      console.log("打卡开始 -----------------------------");
      alert("打卡助手运行中，请勿关闭页面！按F12可以查看进度");

      getUserMedalWall();
    } else {
      console.log('今日已打卡完成 ✅')
    }
  }

  function getUserMedalWall() {
    $.ajax({
      url: 'https://api.live.bilibili.com/xlive/web-ucenter/user/MedalWall',
      data: {
        target_id: uid
      },
      type: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (data) {
        clockInLiveRoom(data);
      }
    })
  }

  async function getAccInfo(mid) {
    return await $.ajax({
      url: 'https://api.bilibili.com/x/space/acc/info',
      data: {
        mid
      },
      type: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (data) {
        return data
      }
    })
  }

  async function sendMsg(formdata) {
    return await $.ajax({
      url: 'https://api.live.bilibili.com/msg/send',
      data: formdata,
      type: 'POST',
      contentType: false,
      processData: false,
      xhrFields: {
        withCredentials: true
      },
      success: function (data) {
        return data;
      }
    })
  }

  async function clockInLiveRoom(data) {
    const {
      list
    } = data.data;
    const length = list.length;

    for (let i = 0; i < length; i++) {
      await delay(1000);

      const target_id = list[i].medal_info.target_id;
      const target_name = list[i].target_name;
      const accInfo = await getAccInfo(target_id);

      const {
        roomid
      } = accInfo.data.live_room;

      const formdata = new FormData();
      const time = new Date().getTime();
      formdata.append("roomid", roomid)
      formdata.append("msg", clock_in_msg)
      formdata.append("bubblt", "0")
      formdata.append("color", "16777215");
      formdata.append("mod", "1")
      formdata.append("rnd", time)
      formdata.append("fontsize", 25)
      formdata.append("csrf", csrf)
      formdata.append("csrf_token", csrf)

      const sendMsgRes = await sendMsg(formdata);

      if (sendMsgRes.msg === "") {
        console.log(`${target_name} 打卡成功 ✅, 还有${length - i}个房间`);
        clock_in_success += 1;
      } else {
        console.log(`${target_name} 打卡失败 ❌, 原因：${sendMsgRes.msg}`);
        clock_in_error += 1;
      }
    }

    alert(`打卡完成,成功：${clock_in_success},失败：${clock_in_error}`);

    setCookieExpirationTime()
    console.log("打卡结束 -----------------------------");
  }
  // script end ----------------------------------------------------------
})();