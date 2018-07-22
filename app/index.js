import clock from "clock";
import { preferences } from "user-settings";
import document from "document";
import * as util from "../common/utils";
import * as localeUtil from "../common/locales";
import { HeartRateSensor } from "heart-rate";
import { battery } from "power";
import { today } from "user-activity";
import { goals } from "user-activity";
import { StatsObject } from "../common/WidgetStats"
import { batteryIcon } from "../common/WidgetStats"
import { display } from "display";

var updateBattery = function () {
    
  // update value
  statBattery.setValue( Math.floor( battery.chargeLevel ) , false);
  statBattery.setColorGradient ( 50 , false );
  
}

// get handler to the BG window
var bgWindow = document.getElementById("bgWindow");
var bShowMainWindow = true;

// get the standard BG line width
var myLineBG = document.getElementById("lnHRBG");
var lnBGWidth = myLineBG.width;

// initialize all objects for the stat elements
var statHeartRate = new StatsObject("icnHR", "txtHeartRate", "lnHR", "lnHRBG", 50, 180, false,  0 );
var statBattery = new StatsObject("icnBattery", "txtBattery", "lnBattery", "lnBatteryBG", 0, 100, true, 0 );
statBattery.suffix = "%";
var statSteps = new StatsObject("icnSteps", "txtSteps", "lnSteps", "lnStepsBG", 0, goals.steps || 0, true, 1 );
var statStairs = new StatsObject("icnFloors", "txtFloors", "lnFloors", "lnFloorsBG", 0, goals.elevationGain || 0, true, 1 );
var statCalories = new StatsObject("icnCalories", "txtCalories", "lnCalories", "lnCaloriesBG", 0, goals.calories || 0, true, 1 );
var statDistance = new StatsObject("icnDistance", "txtDistance", "lnDistance", "lnDistanceBG", 0, goals.distance || 0, true, 1 );
statDistance.decimal = 1;
statDistance.factor = 1/1000;
statDistance.suffix = "k";
var statActive = new StatsObject("icnActiveMinutes", "txtActiveMinutes", "lnActiveMinutes", "lnActiveMinutesBG", 0, goals.activeMinutes || 0, true, 1 );

// Clock Elements
var myClock = document.getElementById("txtHourMin");
var myClockSmall = document.getElementById("txtHourMinSmall");
var myDate = document.getElementById("txtDate");
var myLnSec = document.getElementById("lnSec");
var myLnSecBG = document.getElementById("lnSecBG");
var lnSecBGWidth = myLnSecBG.width;
var lnSecBGX = myLnSecBG.x;

// Heart Rate Monitor
var hrm = new HeartRateSensor();

// *** SETTINGS / INITIALIZATIONS ***
// Update the clock every second
clock.granularity = "seconds";
// Begin monitoring the heart rate sensor
 hrm.start();
// initialize the battery
updateBattery();

// Update the UI elements every tick
clock.ontick = (evt) => {
  
  // Block variables --> now, hours, minutes (needed independently of which window is shown)
  let now = evt.date;
  let hours = now.getHours();
  let mins = util.zeroPad(now.getMinutes());
  
  // 12h or 24h format for hours (needed independently of which window is shown) 
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  
  // update clock, date and stat elements depending on which window is shown
  if ( bShowMainWindow ) { 
  
    // * Primary Window *
    // define seconds FG line
    let lnSecWidth = now.getSeconds() * lnSecBGWidth / 60;
    let lnSecX = lnSecBGX + ( lnSecBGWidth / 2 ) - ( lnSecWidth / 2 );   
    
    // output Time and Date
    myClock.text = `${hours}:${mins}`;
    myDate.text = localeUtil.getDateStringLocale( now, true );
    myLnSec.width = lnSecWidth;
    myLnSec.x = lnSecX;
    
  } else {
    
    // output Time
    myClockSmall.text = `${hours}:${mins}`;
    
    // update stats
    statCalories.setValue( today.local.calories, true );
    statStairs.setValue( today.local.elevationGain, true  );
    statSteps.setValue( today.local.steps, true  );
    statActive.setValue( today.local.activeMinutes, true );
    statDistance.setValue( today.local.distance, true );
    
  }
  
}

// read HR
hrm.onreading = function() {

  // update value
  statHeartRate.setValue( hrm.heartRate, false );
  statHeartRate.setColorGradientIcon( 120 , true );
  
}

// read Battery
battery.onchange = function() {
  
  updateBattery();
  
}

// click event for the Background Window
bgWindow.onclick = function() {
  
  // toggle global variable showing which elements shall be shown
  bShowMainWindow = !bShowMainWindow;
  
  // hide show the elements accordingly
  showElements ( bShowMainWindow );
  
}

display.onchange = function() {
  
  if ( display.on ) { hrm.start(); } else { hrm.stop(); }
  
}

var showElements = function ( isMainWindow ) {
  
  // show or hide the stat and clock elements according to the set state
  if ( isMainWindow === true ) {
    
    // stat elements
    statCalories.hide();
    statStairs.hide();
    statSteps.hide();
    statActive.hide();
    statDistance.hide();
    
    // clock elements
    myClock.style.display = "inline";
    myDate.style.display = "inline";
    myLnSec.style.display = "inline";
    myLnSecBG.style.display = "inline";
    myClockSmall.style.display = "none";
    
  } else {
    
    // update stats
    statCalories.setValue( today.local.calories, true );
    statStairs.setValue( today.local.elevationGain, true  );
    statSteps.setValue( today.local.steps, true  );
    statActive.setValue( today.local.activeMinutes, true );
    statDistance.setValue( today.local.distance, true );
    
    // stat elements
    statCalories.show();
    statStairs.show();
    statSteps.show();
    statActive.show();
    statDistance.show();
    
    // clock elements
    myClock.style.display = "none";
    myDate.style.display = "none";
    myLnSec.style.display = "none";
    myLnSecBG.style.display = "none";
    myClockSmall.style.display = "inline";
    
  }
  
  // refresh the battery display
  updateBattery();
  
}
