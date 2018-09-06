/*
  A simple way of returning settings data.
  Taken from the Fitbit example sdk-moment on https://github.com/Fitbit/sdk-moment  
*/

import * as messaging from "messaging";
import { settingsStorage } from "settings";

export function initialize() {
  settingsStorage.addEventListener("change", evt => {
    if (evt.oldValue !== evt.newValue) {
      sendValue(evt.key, evt.newValue);
    }
    if (evt.key == "hrReset") {console.log("clicked button");}
  });
}

function sendValue(key, val) {
  if (val) {
    sendSettingData({
      key: key,
      value: JSON.parse(val)
    });
  }
}

function sendSettingData(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  } else {
    console.log("No peerSocket connection");
  }
}