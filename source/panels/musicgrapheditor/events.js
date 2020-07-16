
export const events = [
  'node-end',
  'time-passed',
  'random-target',
  'parent-node-destroyed'
];

[
  'text-clear-none',
  'text-clear-single',
  'text-clear-double',
  'text-clear-triple',
  'text-clear-quad',
  'text-t-spin',
  'text-spike',
  /*
    Single-player mode doesn't have the b2b combo counter so there's
    no way to tell once a b2b ends, so we use a seperate event
  */
  'text-b2b',
  'text-b2b-reset',
  'text-b2b-combo',
  'text-combo',
  'board-height'
].forEach(sfx => {
  events.push(sfx + '-player');
  events.push(sfx + '-enemy');
});

[
  "allclear","applause","boardappear","btb_1","btb_2","btb_3","btb_break",
  "clearbtb","clearline","clearquad","clearspin","clutch","combo_1_power",
  "combo_1","combo_10_power","combo_10","combo_11_power","combo_11",
  "combo_12_power","combo_12","combo_13_power","combo_13","combo_14_power",
  "combo_14","combo_15_power","combo_15","combo_16_power","combo_16",
  "combo_2_power","combo_2","combo_3_power","combo_3","combo_4_power",
  "combo_4","combo_5_power","combo_5","combo_6_power","combo_6",
  "combo_7_power","combo_7","combo_8_power","combo_8","combo_9_power",
  "combo_9","combobreak","countdown1","countdown2","countdown3","countdown4",
  "countdown5","counter","damage_alert","damage_large","damage_medium",
  "damage_small","death","detonate1","detonate2","detonated","elim","exchange",
  "failure","finessefault","finish","fire","floor","gameover",
  "garbage_in_large","garbage_in_medium","garbage_in_small","garbage_out_large",
  "garbage_out_medium","garbage_out_small","garbagerise","garbagesmash","go",
  "harddrop","hit","hold","hyperalert","i","impact","j","l","level1","level10",
  "level100","level500","levelup","losestock","maintenance","matchintro",
  "menuback","menuclick","menuconfirm","menuhit1","menuhit2","menuhit3",
  "menuhover","menutap","mission_free","mission_league","mission_versus",
  "mission","mmstart","move","no","notify","o","offset","personalbest",
  "ranklower","rankraise","ratinglower","ratingraise","ribbon_off","ribbon_on",
  "ribbon_tap","ribbon","rotate","rsg_go","rsg","s","scoreslide_in",
  "scoreslide_out","shatter","showscore","sidehit","softdrop","spin","spinend",
  "t","target","thunder1","thunder2","thunder3","thunder4","thunder5",
  "thunder6","timer1","timer2","topout","userjoin","userleave","victory",
  "warning","worldrecord","z"
].forEach(sfx => {
  events.push('sfx-' + sfx + '-player');
  events.push('sfx-' + sfx + '-enemy');
});

export const eventValueStrings = {
  'time-passed': 'Seconds',
  'text-b2b-combo': 'B2Bs performed',
  'text-spike': 'Min spike',
  'text-combo': 'Combo',
  'board-height-player': 'Rows high',
  'board-height-enemy': 'Rows high'
};

// Events that use the 'value' and 'valueOperator' fields
export const eventValueExtendedModes = {
  'text-spike': true,
  'text-combo': true,
  'board-height-player': true,
  'board-height-enemy': true
}

export const eventHasTarget = {
  'fork': true,
  'goto': true,
  'kill': false,
  'random': false
}
