/*
  Responsible for loading, applying and saving settings.
  Requires companion/companion-settings.js
  Callback should be used to update your UI.
  Taken from the Fitbit example sdk-moment on https://github.com/Fitbit/sdk-moment  
*/

import * as fs from "fs";
import * as messaging from "messaging";

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

let settings, onsettingschange;

export function initialize(callback) {
  settings = loadSettings();
  onsettingschange = callback;
  onsettingschange(settings);
}

// Received message containing settings data
messaging.peerSocket.addEventListener("message", function (evt) {
  console.log("DEVICE-SETTINGS.JS: evt - "+JSON.stringify(evt));
  settings[evt.data.key] = evt.data.value;
  saveSettings();
  console.log("DEVICE-SETTINGS.JS: settings - "+JSON.stringify(settings));
  onsettingschange(settings);
});

// Load settings from filesystem
function loadSettings() {
  try {
    return fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    return {};
  }
}

// Save settings to the filesystem
function saveSettings() {
  fs.writeFileSync(SETTINGS_FILE, settings, SETTINGS_TYPE);
}