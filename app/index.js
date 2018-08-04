/*eslint-env es_modules */
import * as mySettings from "./device-settings";
import { StatsObject } from "./widgetStats";
import { Screens } from "./clsScreen";
import * as activity from "./activity";
import * as hrZones from "./hrZones";

import * as util from "../common/utils";
import * as localeUtil from "../common/locales";

import document from "document";
import clock from "clock";
import { HeartRateSensor } from "heart-rate";
import { battery } from "power";
import { charger } from "power";
import { display } from "display";

import { goals } from "user-activity";
import { user } from "user-profile";
import { preferences } from "user-settings";

// get handler to the click Target rectangle
var clickTargetLH = document.getElementById("clickTargetLH");
var clickTargetRH = document.getElementById("clickTargetRH");

// initialize the screens object
var myScreens = new Screens(2, 0);

// initialize all objects for the stat elements
var statBattery = new StatsObject("Battery", 0, 100, true, 0 );
var statSteps = new StatsObject("Steps", 0, goals.steps || 0, true, 1 );
var statStairs = new StatsObject("Floors", 0, goals.elevationGain || 0, true, 1 );
var statCalories = new StatsObject("Calories", 0, goals.calories || 0, true, 1 );
var statDistance = new StatsObject("Distance", 0, goals.distance || 0, true, 1 );
var statActive = new StatsObject("ActiveMinutes", 0, goals.activeMinutes || 0, true, 1 );

// Clock Elements
var myClock = document.getElementById("txtHourMin");
var myClockSmall = document.getElementById("txtHourMinSmall");
var myClockHeader = document.getElementById("txtHourMinHeader");
var myDate = document.getElementById("txtDate");
var myLnSec = document.getElementById("lnSec");
var myLnSecBG = document.getElementById("lnSecBG");
var lnSecBGWidth = Math.floor(0.8 * document.getElementById("bgWindow").width);
var lnSecBGX = Math.floor(0.1 * document.getElementById("bgWindow").width);

// Heart Rate Monitor + Elements
var statHeartRate = new StatsObject("HeartRate" , 50, 180, false,  0 );
var statHeartRateBig = new StatsObject("HeartRateBig" , 50, 180, false,  0 );
var statHeartRateZoneText = document.getElementById("txtHeartRateZone");
var hrm = new HeartRateSensor();
var myHRZones = hrZones.getHeartRateZones();
initializeHRelements();


// *** SETTINGS / INITIALIZATIONS ***
// Update the clock every second
clock.granularity = "seconds";
// Begin monitoring the heart rate sensor
hrm.start();
// initialize the screen
showElements(myScreens.activeScreen);

// Update the UI elements every tick
clock.ontick = (evt) => {
  
  // update the clock elements
  updateClock(evt.date);
  
  // update stat elements if 2nd window is shown
  if ( myScreens.activeScreen === 1 ) { 
  
    // get seconds value
    let seconds = evt.date.getSeconds();
  
    // update stats each second (only steps)
    statSteps.setValue( activity.getSteps(), true  );
   
    // update rest each 3 seconds
    if ( ( seconds % 3 ) === 0 ) { 
      statStairs.setValue( activity.getElevationGain(), true  ); 
      statCalories.setValue( activity.getCalories(), true );
      statActive.setValue( activity.getActiveMinutes(), true );
      statDistance.setValue( activity.getDistance(), true );
    }
    
  }

  // check if the last query for the HR zones is older than 24h and refresh if necessary
  if ( ( Math.abs(evt - myHRZones.date) / 36e5 ) > 24 ) {
    myHRZones = hrZones.getHeartRateZones();
    initializeHRelements();
  }

};

// read HR
hrm.onreading = function() {
    
  // only if display on
  if ( display.on ) { updateHR; }
  
};

// read Battery
battery.onchange = function() {
    
  // only if display on
  if ( !display.on ) { return; }
  
  updateBattery();
  
};

// update Battery after charging 
charger.onchange = function() {
	
	if (!charger.charging) {
        updateBattery();
    } 
	
};

// click event for the Background Window
clickTargetRH.onclick = function() {
  
  // goto next Screen
  myScreens.nextScreen();
  
  // hide show the elements accordingly
  showElements ( myScreens.activeScreen );
  
};

clickTargetLH.onclick = function() {
  
  // goto previous Screen
  myScreens.prevScreen();
  
  // hide show the elements accordingly
  showElements ( myScreens.activeScreen );
  
};

// event called when the display is switched on or off
display.onchange = function() {
  
  if ( display.on ) {
      
      // start the heart rate monitor
      hrm.start(); 
      
      // update the clock elements
      let now = new Date();
      updateClock(now);
      
  } else {
      
      // stop the heart rate monitor for battery saving
      hrm.stop(); 
      
  }
  
};

function initializeHRelements() {

    if ( myHRZones.isDefined ) {
        if ( myHRZones.hasCustom ) {
            statHeartRate.minValue = myHRZones.customStart;
            statHeartRate.goal = myHRZones.customEnd;
            statHeartRateBig.minValue = myHRZones.customStart;
            statHeartRateBig.goal = myHRZones.customEnd;
        } else {
           statHeartRate.minValue = myHRZones.fatBurn;
            statHeartRate.goal = myHRZones.peak;
            statHeartRateBig.minValue = myHRZones.fatBurn;
            statHeartRateBig.goal = myHRZones.peak;
        }
    }

}

function updateHR() {

  // update value
  let hrmValue = {
    raw: hrm.heartRate,
    pretty: hrm.heartRate };

  statHeartRate.setValue( hrmValue, false );
  if (myHRZones.isDefined ) {
  	if (myHRZones.hasCustom ) {
  	    statHeartRate.setColorGradientIcon( Math.floor( (myHRZones.customEnd - myHRZones.customStart) / 2 ) , true )
  	} else {
  	    statHeartRate.setColorGradientIcon( myHRZones.cardio, true );
  	}
  } else {
    statHeartRate.setColorGradientIcon( 120 , true );
  }

  statHeartRateBig.setValue( hrmValue, false );
  let hrZone = ( user.heartRateZone( hrmValue.raw ) === "out-of-range" ) ? "normal" : user.heartRateZone( hrmValue.raw );

  statHeartRateZoneText.text = hrZone;

  if (!myHRZones) {
    statHeartRateBig.setColorGradientIcon( 120 , true );
  } else {
    statHeartRateBig.setColorGradientIcon( myHRZones[0][1] , true );
  }

}

function showElements( screenNumber ) {
  
  // get current time
  let now = new Date();
  
  // show or hide the stat and clock elements according to the set state
  switch ( screenNumber ) {
      
    case 0:
  
        // stat elements
        statCalories.hide();
        statStairs.hide();
        statSteps.hide();
        statActive.hide();
        statDistance.hide();
        
        // HR elements
        statHeartRate.show();
        statHeartRateBig.hide();
        statHeartRateZoneText.style.display = "none";
      
        // clock elements, update before
        updateClock(now);
        myClock.style.display = "inline";
        myDate.style.display = "inline";
        myLnSec.style.display = "inline";
        myLnSecBG.style.display = "inline";
        myClockSmall.style.display = "none";
        myClockHeader.style.display = "none";
      
        break;
        
    case 1:     
  
        // update stats
        statCalories.setValue( activity.getCalories(), true );
        statStairs.setValue( activity.getElevationGain(), true  );
        statSteps.setValue( activity.getSteps(), true  );
        statActive.setValue( activity.getActiveMinutes(), true );
        statDistance.setValue( activity.getDistance(), true );
        
        // HR elements
        statHeartRate.show();
        statHeartRateBig.hide();
        statHeartRateZoneText.style.display = "none";
      
        // stat elements
        statCalories.show();
        statStairs.show();
        statSteps.show();
        statActive.show();
        statDistance.show();
        
        // clock elements, update before
        updateClock(now);
        myClock.style.display = "none";
        myDate.style.display = "none";
        myLnSec.style.display = "none";
        myLnSecBG.style.display = "none";
        myClockSmall.style.display = "inline";
        myClockHeader.style.display = "none";
      
        break;
        
    case 2:

        // stat elements
        statCalories.hide();
        statStairs.hide();
        statSteps.hide();
        statActive.hide();
        statDistance.hide();   
        
        // HR elements
        statHeartRate.hide();
        statHeartRateBig.show();
        statHeartRateZoneText.style.display = "inline";
        
        // clock elements, update before
        updateClock(now);
        myClock.style.display = "none";
        myDate.style.display = "none";
        myLnSec.style.display = "none";
        myLnSecBG.style.display = "none";
        myClockSmall.style.display = "none";
        myClockHeader.style.display = "inline";    
      
        break;
    
  }
  
  // refresh the battery display (on all screens identical)
  updateBattery();
  
}

// update the battery elements
function updateBattery() {
    
  // update value
  let batteryValue = { 
    raw: Math.floor( battery.chargeLevel ), 
    pretty: Math.floor( battery.chargeLevel ) + "%"};
    
  statBattery.setValue( batteryValue , false);
  statBattery.setColorGradient ( 50 , false );
  
}

// update the clock elements
function updateClock( inpDate ) {

  // Block variables --> now, hours, minutes (needed independently of which window is shown)
  let hours = inpDate.getHours();
  let mins = util.zeroPad(inpDate.getMinutes());
  let seconds = inpDate.getSeconds();
  
  // 12h or 24h format for hours (needed independently of which window is shown) 
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  
 // update clock, date and stat elements depending on which window is shown
  switch ( myScreens.activeScreen ) {
      
    case 0:
      
        // define seconds FG line
        let lnSecWidth = seconds * lnSecBGWidth / 60;
        let lnSecX = lnSecBGX + ( lnSecBGWidth / 2 ) - ( lnSecWidth / 2 );
        
        // output Time and Date
        myClock.text = `${hours}:${mins}`;
        myDate.text = localeUtil.getDateStringLocale( inpDate, true );
        myLnSec.width = lnSecWidth;
        myLnSec.x = lnSecX;      
        
        break;
        
    case 1:
    
        // output Time
        myClockSmall.text = `${hours}:${mins}`;
        
        break;
        
    case 2:
    
        // output Time
        myClockHeader.text = `${hours}:${mins}`;
        
        break;
  }

}

/* -------- SETTINGS -------- */
function settingsCallback(data) {
  if (!data) {
    return;
  }
  // HR screen toggled
  if (data.hasHRScreen) {
      myScreens.countScreens = 3;
  } else {
      myScreens.countScreens = 2;
  }
}
mySettings.initialize(settingsCallback);