// --- Tune these to taste ---

var TARGET_WORDS_BAG  = 250;   // words needed to earn the easiest tier (bag mode)
var TARGET_WORDS_WORK = 100;   // words needed to earn the easiest tier (work mode)
var SESSION_MINUTES   = 30;    // length of the typing interval
var SEND_EMAIL        = true;  // set false if you don't want an email ping when a session ends


// --- NORMAL On Fire thresholds (multiples of target) ---
var NORMAL_ON_FIRE_THRESHOLDS = [
  { ratio: 1.0,  name: 'On Fire',     italic: true,  bold: false, sizeDelta: 0,   color: null,              bgColor: null },
  { ratio: 1.5,  name: 'Blazing',     italic: true,  bold: true,  sizeDelta: 0,   color: null,              bgColor: null },
  { ratio: 2.0,  name: 'Inferno',     italic: true,  bold: true,  sizeDelta: 1,   color: null,              bgColor: '#FFF8E7' },
  { ratio: 2.5,  name: 'Nuclear',     italic: true,  bold: true,  sizeDelta: 2,   color: '#8B0000',         bgColor: '#FFE4E1' }
];

// --- "LET'S GO" mode thresholds (very low word counts for instant feedback) ---
var LETS_GO_THRESHOLDS = [
  { words: 5,   name: 'On Fire',     italic: true,  bold: false, sizeDelta: 0,   color: null,              bgColor: null },
  { words: 10,  name: 'Blazing',     italic: true,  bold: true,  sizeDelta: 0,   color: null,              bgColor: null },
  { words: 15,  name: 'Inferno',     italic: true,  bold: true,  sizeDelta: 1,   color: null,              bgColor: '#FFF8E7' },
  { words: 20,  name: 'Nuclear',     italic: true,  bold: true,  sizeDelta: 2,   color: '#8B0000',         bgColor: '#FFE4E1' }
];


// --- Desk circuit definitions (Work Mode) ---

var DESK_CIRCUITS = {
  easy: {
    name: 'Desk Reset',
    desc: 'Gentle mobilization plus a light push and squat to wake up the muscles.',
    rounds: '1 round, rest as needed between exercises',
    exercises: [
      { name: 'Neck rolls',        detail: 'Slow, controlled circles each direction', reps: '5 each side'      },
      { name: 'Shoulder rolls',    detail: 'Backwards then forwards',                 reps: '8 each direction' },
      { name: 'Desk pushups',      detail: 'Hands on desk edge, body straight',       reps: '8 reps'           },
      { name: 'Bodyweight squats', detail: 'Slow sit-back motion, full depth',        reps: '8 reps'           },
      { name: 'Hip circles',       detail: 'Hands on hips, slow wide circles',        reps: '8 each direction' }
    ]
  },
  moderate: {
    name: 'Standing Flow',
    desc: 'Standing movements with a light push and squat challenge.',
    rounds: '1 round, short rest between exercises',
    exercises: [
      { name: 'Arm circles',         detail: 'Extended arms, small to large',           reps: '10 each direction' },
      { name: 'Desk pushups',        detail: 'Controlled pace, chest to desk',          reps: '10 reps'           },
      { name: 'Bodyweight squats',   detail: 'Steady pace, knees track toes',           reps: '10 reps'           },
      { name: 'Standing leg cuts',  detail: 'Lift to the side, controlled return',     reps: '10 each leg'       },
      { name: 'Leg swings',          detail: 'Hold desk for balance, forward & back',   reps: '10 each leg'       },
      { name: 'Toe touches',         detail: 'Hinge at waist, slow reach',              reps: '8 reps'            }
    ]
  },
  hard: {
    name: 'Power Break',
    desc: 'Compound movements and higher reps — the most you can do without needing a shower.',
    rounds: '2 rounds, rest 30 sec between rounds',
    exercises: [
      { name: 'High knees',              detail: 'March in place with purpose',             reps: '20 reps'     },
      { name: 'Desk pushups',            detail: '3-second descent, explosive push',        reps: '12 reps'     },
      { name: 'Bodyweight squats',       detail: 'Pause 1 second at the bottom',            reps: '12 reps'     },
      { name: 'Gentle lunges',           detail: 'Alternating legs, knee at 90°',           reps: '8 each leg'  },
      { name: 'Windmill toe touches',    detail: 'Wide stance, cross-body reach',           reps: '10 each side'},
      { name: 'Chair dips',              detail: 'Hands on chair edge, legs extended',      reps: '8 reps'      }
    ]
  },
  vhard: {
    name: 'Full Send (Desk Edition)',
    desc: 'Max reps, slow tempos, and balance work. Hard without the cardio — you won\'t be gasping, but you\'ll feel it.',
    rounds: '2 rounds, rest 45 sec between rounds',
    exercises: [
      { name: 'Desk pushups',              detail: '4-second descent, full range — no half reps',    reps: '20 reps'     },
      { name: 'Bodyweight squats',         detail: '3-second descent, 2-second pause at bottom',     reps: '20 reps'     },
      { name: 'Forward lunge with twist',  detail: 'Lunge deep, torso rotates toward front leg',     reps: '10 each leg' },
      { name: 'Single leg deadlifts',      detail: 'Hinge forward slowly, free leg extends back',    reps: '8 each leg'  },
      { name: 'Windmill toe touches',      detail: 'Wide stance, full cross-body reach, hold 1 sec', reps: '12 each side'},
      { name: 'Standing pigeon stretch',   detail: 'Ankle on standing knee, hold squat position',    reps: '8 each side' },
      { name: 'Chair dips',                detail: 'Full range, 3-second descent',                   reps: '12 reps'     }
    ]
  }
};


var BAG_WORKOUTS = {
  easy:     { workSeconds: 30,  restSeconds: 30, roundsCount: 6 },
  moderate: { workSeconds: 40,  restSeconds: 20, roundsCount: 8 },
  hard:     { workSeconds: 60,  restSeconds: 15, roundsCount: 8 },
  vhard:    { workSeconds: 180, restSeconds: 30, roundsCount: 4 }
};


// -------------------------------------------------------

function onOpen() {
  var props = PropertiesService.getDocumentProperties();
  var mode = props.getProperty('workoutMode') || 'bag';
  var modeLabel = mode === 'work' ? 'Mode: Desk Work ✓' : 'Mode: Heavy Bag ✓';

  var letsGoEnabled = props.getProperty('letsGoMode') === 'true';
  var letsGoLabel = letsGoEnabled ? '✓ Let\'s Go Mode (Easy Thresholds)' : 'Enable Let\'s Go Mode';

  DocumentApp.getUi()
    .createMenu('Typing Workout')
    .addItem('Start Typing Workout', 'startTypingWorkout')
    .addItem('Check Progress', 'checkProgress')
    .addItem('Show Last Result', 'showLastResult')
    .addItem('Cancel Typing Workout', 'cancelTypingWorkout')
    .addSeparator()
    .addItem('Switch to Heavy Bag Mode', 'setBagMode')
    .addItem('Switch to Desk Work Mode', 'setWorkMode')
    .addItem(modeLabel, 'showCurrentMode')
    .addSeparator()
    .addItem(letsGoLabel, 'toggleLetsGoMode')
    .addItem('Update On Fire Style (New Text Only)', 'updateOnFireStyle')
    .addItem('Reset On Fire Style', 'resetOnFireStyle')
    .addToUi();
}


// -------------------------------------------------------
// LET'S GO MODE TOGGLE
// -------------------------------------------------------

function toggleLetsGoMode() {
  var props = PropertiesService.getDocumentProperties();
  var currentlyEnabled = props.getProperty('letsGoMode') === 'true';

  if (currentlyEnabled) {
    props.deleteProperty('letsGoMode');
    DocumentApp.getUi().alert('Let\'s Go Mode disabled.\n\nNormal thresholds restored (based on % of target).');
  } else {
    props.setProperty('letsGoMode', 'true');
    DocumentApp.getUi().alert(
      'Let\'s Go Mode ENABLED!\n\n' +
      'Styling now triggers at very low word counts:\n' +
      '• 5 words → Italic\n' +
      '• 10 words → Italic + Bold\n' +
      '• 15 words → Italic + Bold + Slightly Bigger\n' +
      '• 20 words → Italic + Bold + Bigger + Dark Red\n\n' +
      'Perfect for testing and instant satisfaction!'
    );
  }

  // Refresh the menu
  onOpen();
}


function isLetsGoMode() {
  return PropertiesService.getDocumentProperties().getProperty('letsGoMode') === 'true';
}


// -------------------------------------------------------

function setBagMode() {
  PropertiesService.getDocumentProperties().setProperty('workoutMode', 'bag');
  DocumentApp.getUi().alert('Heavy Bag Mode set.\nTarget: ' + TARGET_WORDS_BAG + ' words.\nReload the doc to update the menu label.');
}

function setWorkMode() {
  PropertiesService.getDocumentProperties().setProperty('workoutMode', 'work');
  DocumentApp.getUi().alert('Desk Work Mode set.\nTarget: ' + TARGET_WORDS_WORK + ' words.\nReload the doc to update the menu label.');
}

function showCurrentMode() {
  var mode = PropertiesService.getDocumentProperties().getProperty('workoutMode') || 'bag';
  var target = mode === 'work' ? TARGET_WORDS_WORK : TARGET_WORDS_BAG;
  var letsGo = isLetsGoMode();

  var message = 'Current mode: ' + (mode === 'work' ? 'Desk Work' : 'Heavy Bag') +
                '\nWord target: ' + target;

  if (letsGo) {
    message += '\n\nLet\'s Go Mode is ENABLED (easy thresholds)';
  }

  DocumentApp.getUi().alert(message);
}


// -------------------------------------------------------

function getWordCount() {
  var text = DocumentApp.getActiveDocument().getBody().getText();
  var words = text.trim().split(/\s+/).filter(function(w) { return w.length > 0; });
  return words.length;
}

function getTarget(mode) {
  return mode === 'work' ? TARGET_WORDS_WORK : TARGET_WORDS_BAG;
}

function getTierKey(wordsTyped, mode) {
  var target = getTarget(mode);
  var productivity = Math.min(1, Math.max(0, wordsTyped / target));
  var punishment = 1 - productivity;

  if (punishment <= 0.25) return 'easy';
  if (punishment <= 0.5)  return 'moderate';
  if (punishment <= 0.75) return 'hard';
  return 'vhard';
}

function tierLabel(key) {
  return { easy: 'Easy', moderate: 'Moderate', hard: 'Hard', vhard: 'Very Hard' }[key];
}


// -------------------------------------------------------
// ON FIRE MODE - NEW TEXT ONLY + LET'S GO SUPPORT
// -------------------------------------------------------

function recordSessionStartPosition() {
  var body = DocumentApp.getActiveDocument().getBody();
  var props = PropertiesService.getDocumentProperties();
  props.setProperty('sessionStartCharCount', String(body.getText().length));
}

function getNewTextRange() {
  var body = DocumentApp.getActiveDocument().getBody();
  var fullText = body.getText();
  var props = PropertiesService.getDocumentProperties();

  var startCount = Number(props.getProperty('sessionStartCharCount') || '0');
  var currentLength = fullText.length;

  var start = Math.max(0, Math.min(startCount, currentLength));
  var end = currentLength;

  return { start: start, end: end, hasNewText: end > start };
}

/**
 * Returns the active threshold set based on whether Let's Go mode is enabled.
 */
function getActiveThresholds() {
  if (isLetsGoMode()) {
    return LETS_GO_THRESHOLDS;
  } else {
    return NORMAL_ON_FIRE_THRESHOLDS;
  }
}

/**
 * Applies the appropriate "On Fire" styling ONLY to text added during the current session.
 * In Let's Go mode this works without an active workout session so you can test instantly.
 */
function applyOnFireStyling() {
  var props = PropertiesService.getDocumentProperties();
  var isLetsGo = isLetsGoMode();

  // Normal mode requires an active session. Let's Go mode can run freely for instant feedback.
  if (!isLetsGo && props.getProperty('workoutRunning') !== 'true') {
    return;
  }

  var mode = props.getProperty('workoutMode') || 'bag';
  var startCount = Number(props.getProperty('workoutStartCount') || '0');
  var currentCount = getWordCount();
  var wordsTyped = Math.max(0, currentCount - startCount);

  var thresholds = getActiveThresholds();
  var activeLevel = null;

  if (isLetsGo) {
    // Let's Go mode: threshold is absolute word count typed this session
    for (var i = 0; i < thresholds.length; i++) {
      if (wordsTyped >= thresholds[i].words) {
        activeLevel = thresholds[i];
      } else {
        break;
      }
    }
  } else {
    // Normal mode: threshold is ratio of target
    var target = getTarget(mode);
    if (!target || target <= 0) return;

    var ratio = wordsTyped / target;

    for (var j = 0; j < thresholds.length; j++) {
      if (ratio >= thresholds[j].ratio) {
        activeLevel = thresholds[j];
      } else {
        break;
      }
    }
  }

  if (!activeLevel) {
    return; // Not past any on-fire threshold yet
  }

  var range = getNewTextRange();
  if (!range.hasNewText) {
    return;
  }

  var body = DocumentApp.getActiveDocument().getBody();
  var text = body.editAsText();
  var attrs = {};

  if (activeLevel.italic) {
    attrs[DocumentApp.Attribute.ITALIC] = true;
  }
  if (activeLevel.bold) {
    attrs[DocumentApp.Attribute.BOLD] = true;
  }
  if (activeLevel.sizeDelta > 0) {
    var currentSize = text.getFontSize(range.start) || 11;
    attrs[DocumentApp.Attribute.FONT_SIZE] = currentSize + activeLevel.sizeDelta;
  }
  if (activeLevel.color) {
    attrs[DocumentApp.Attribute.FOREGROUND_COLOR] = activeLevel.color;
  }
  if (activeLevel.bgColor) {
    attrs[DocumentApp.Attribute.BACKGROUND_COLOR] = activeLevel.bgColor;
  }

  if (Object.keys(attrs).length > 0) {
    text.setAttributes(range.start, range.end - 1, attrs);
  }
}


function updateOnFireStyle() {
  var props = PropertiesService.getDocumentProperties();
  var isLetsGo = isLetsGoMode();

  // In Let's Go mode, seed the start position from current doc state if no session is running,
  // so the user can test styling without having to formally start a workout.
  if (isLetsGo && props.getProperty('workoutRunning') !== 'true') {
    if (!props.getProperty('sessionStartCharCount')) {
      recordSessionStartPosition();
    }
    if (!props.getProperty('workoutStartCount')) {
      props.setProperty('workoutStartCount', String(getWordCount()));
    }
  }

  if (!isLetsGo && props.getProperty('workoutRunning') !== 'true') {
    DocumentApp.getUi().alert('No session is currently running.\n\nUse "Start Typing Workout" to begin one, then type some words before updating the style.');
    return;
  }

  applyOnFireStyling();

  var message = 'On Fire style updated!\n\n' +
    'Only text added since the session started (or since Let\'s Go mode was activated) was styled.\n\n';

  if (isLetsGo) {
    message += 'Let\'s Go Mode active (word-count based):\n' +
      '• 5 words → Italic\n' +
      '• 10 words → Italic + Bold\n' +
      '• 15 words → Italic + Bold + Slightly Bigger\n' +
      '• 20 words → Italic + Bold + Bigger + Dark Red';
  } else {
    message += 'Normal thresholds (percentage of target):\n' +
      '• 100%+ target → Italic\n' +
      '• 150%+ target → Italic + Bold\n' +
      '• 200%+ target → Italic + Bold + Slightly Bigger\n' +
      '• 250%+ target → Italic + Bold + Bigger + Dark Red';
  }

  DocumentApp.getUi().alert(message);
}


function resetOnFireStyle() {
  var body = DocumentApp.getActiveDocument().getBody();
  var text = body.editAsText();
  var range = getNewTextRange();

  if (range.hasNewText) {
    var resetAttrs = {};
    resetAttrs[DocumentApp.Attribute.ITALIC] = false;
    resetAttrs[DocumentApp.Attribute.BOLD] = false;
    resetAttrs[DocumentApp.Attribute.FONT_SIZE] = null;
    resetAttrs[DocumentApp.Attribute.FOREGROUND_COLOR] = null;
    resetAttrs[DocumentApp.Attribute.BACKGROUND_COLOR] = null;

    text.setAttributes(range.start, range.end - 1, resetAttrs);
  }

  DocumentApp.getUi().alert('On Fire styling has been removed from the session text.');
}


// -------------------------------------------------------

function buildBagMessage(wordsTyped, tierKey, startCount, endCount) {
  var spec = BAG_WORKOUTS[tierKey];
  var totalSeconds = (spec.roundsCount * spec.workSeconds) + ((spec.roundsCount - 1) * spec.restSeconds);
  return 'Words typed: ' + wordsTyped + ' (target: ' + TARGET_WORDS_BAG + ')\n' +
         '(raw counts: started at ' + startCount + ', ended at ' + endCount + ')\n' +
         'Tier: ' + tierLabel(tierKey) + '\n\n' +
         'Workout: ' + spec.roundsCount + ' rounds, ' +
         formatTime(spec.workSeconds) + ' work / ' + formatTime(spec.restSeconds) + ' rest\n' +
         'Total bag time: ' + formatTime(totalSeconds);
}


function buildDeskMessage(wordsTyped, tierKey, startCount, endCount) {
  var circuit = DESK_CIRCUITS[tierKey];
  var lines = [
    'Words typed: ' + wordsTyped + ' (target: ' + TARGET_WORDS_WORK + ')',
    '(raw counts: started at ' + startCount + ', ended at ' + endCount + ')',
    'Tier: ' + tierLabel(tierKey),
    '',
    'Circuit: ' + circuit.name,
    circuit.desc,
    'Structure: ' + circuit.rounds,
    ''
  ];
  circuit.exercises.forEach(function(ex, i) {
    lines.push((i + 1) + '. ' + ex.name + ' — ' + ex.reps);
    lines.push('   ' + ex.detail);
  });
  return lines.join('\n');
}


function buildProgressMessage(wordsTyped, tierKey, remainingSeconds, mode) {
  var target = getTarget(mode);
  var previewLines;

  if (mode === 'work') {
    var circuit = DESK_CIRCUITS[tierKey];
    previewLines = [
      'Circuit: ' + circuit.name + ' (' + tierLabel(tierKey) + ')',
      circuit.rounds
    ];
  } else {
    var spec = BAG_WORKOUTS[tierKey];
    var totalSeconds = (spec.roundsCount * spec.workSeconds) + ((spec.roundsCount - 1) * spec.restSeconds);
    previewLines = [
      'Tier: ' + tierLabel(tierKey),
      spec.roundsCount + ' rounds, ' + formatTime(spec.workSeconds) + ' work / ' + formatTime(spec.restSeconds) + ' rest',
      'Total bag time: ' + formatTime(totalSeconds)
    ];
  }

  return 'Time left: ' + formatTime(remainingSeconds) + '\n' +
         'Words typed so far: ' + wordsTyped + ' (target: ' + target + ')\n\n' +
         'If the session ended right now:\n' +
         previewLines.join('\n');
}


// -------------------------------------------------------

function startTypingWorkout() {
  var props = PropertiesService.getDocumentProperties();

  if (props.getProperty('workoutRunning') === 'true') {
    DocumentApp.getUi().alert('A session is already running. Use "Check Progress" to see where you stand, or "Cancel Typing Workout" to stop it early.');
    return;
  }

  var mode = props.getProperty('workoutMode') || 'bag';
  var startCount = getWordCount();

  props.setProperty('workoutStartCount', String(startCount));
  props.setProperty('sessionStartTime', String(Date.now()));
  props.setProperty('workoutRunning', 'true');
  props.deleteProperty('lastResult');

  recordSessionStartPosition();

  deleteEndTriggers();
  ScriptApp.newTrigger('endTypingWorkout')
    .timeBased()
    .after(SESSION_MINUTES * 60 * 1000)
    .create();

  var target = getTarget(mode);
  var isLetsGo = isLetsGoMode();

  var alertMsg = 'Session started (' + (mode === 'work' ? 'Desk Work' : 'Heavy Bag') + ' Mode).\n' +
    'Target: ' + target + ' words in ' + SESSION_MINUTES + ' minutes.\n\n' +
    'You can close this tab — the timer runs on Google\'s side.\n' +
    'Use "Check Progress" any time, and "Show Last Result" once time is up.\n\n' +
    'On Fire styling will only affect text you type during this session.';

  if (isLetsGo) {
    alertMsg += '\n\nLet\'s Go Mode is active — styling will trigger very quickly!';
  }

  DocumentApp.getUi().alert(alertMsg);
}


function checkProgress() {
  var props = PropertiesService.getDocumentProperties();
  var ui = DocumentApp.getUi();

  if (props.getProperty('workoutRunning') !== 'true') {
    ui.alert('No session is currently running. Use "Start Typing Workout" to begin one.');
    return;
  }

  var mode = props.getProperty('workoutMode') || 'bag';
  var startCount = Number(props.getProperty('workoutStartCount'));
  var sessionStartTime = Number(props.getProperty('sessionStartTime'));
  var wordsTyped = Math.max(0, getWordCount() - startCount);

  var remainingMs = (SESSION_MINUTES * 60 * 1000) - (Date.now() - sessionStartTime);
  var remainingSeconds = Math.max(0, Math.round(remainingMs / 1000));

  var tierKey = getTierKey(wordsTyped, mode);
  var msg = buildProgressMessage(wordsTyped, tierKey, remainingSeconds, mode);

  if (remainingSeconds === 0) {
    msg += '\n\n(Time is technically up — check "Show Last Result" shortly.)';
  }

  applyOnFireStyling();

  ui.alert('Progress check', msg, ui.ButtonSet.OK);
}


function endTypingWorkout() {
  var props = PropertiesService.getDocumentProperties();

  if (props.getProperty('workoutRunning') !== 'true') {
    deleteEndTriggers();
    return;
  }

  var mode = props.getProperty('workoutMode') || 'bag';
  var startCount = Number(props.getProperty('workoutStartCount'));
  var endCount = getWordCount();
  var wordsTyped = Math.max(0, endCount - startCount);
  var tierKey = getTierKey(wordsTyped, mode);

  applyOnFireStyling();

  var msg = mode === 'work'
    ? buildDeskMessage(wordsTyped, tierKey, startCount, endCount)
    : buildBagMessage(wordsTyped, tierKey, startCount, endCount);

  props.setProperty('workoutRunning', 'false');
  props.setProperty('lastResult', msg);
  deleteEndTriggers();

  if (SEND_EMAIL) {
    try {
      MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Workout assigned', msg);
    } catch (e) {}
  }

  try {
    DocumentApp.getUi().alert('Workout assigned', msg, DocumentApp.getUi().ButtonSet.OK);
  } catch (e) {}
}


function showLastResult() {
  var props = PropertiesService.getDocumentProperties();
  var result = props.getProperty('lastResult');

  if (!result) {
    if (props.getProperty('workoutRunning') === 'true') {
      DocumentApp.getUi().alert('Session still running. Use "Check Progress" to see where you stand.');
    } else {
      DocumentApp.getUi().alert('No result yet. Run "Start Typing Workout" first.');
    }
    return;
  }

  DocumentApp.getUi().alert('Workout assigned', result, DocumentApp.getUi().ButtonSet.OK);
}


function cancelTypingWorkout() {
  var props = PropertiesService.getDocumentProperties();

  if (props.getProperty('workoutRunning') !== 'true') {
    DocumentApp.getUi().alert('No session is currently running.');
    return;
  }

  props.setProperty('workoutRunning', 'false');
  deleteEndTriggers();
  DocumentApp.getUi().alert('Session cancelled.');
}


function deleteEndTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'endTypingWorkout') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}


function formatTime(totalSeconds) {
  var m = Math.floor(totalSeconds / 60);
  var s = totalSeconds % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}
