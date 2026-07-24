
// Label features
injectProperty("label", "x",{persist:{index:0,binFunc:factoryRatioForXY(),serializeFunc:v=>Math.round(v)}});
injectProperty("label", "y",{persist:{index:1,binFunc:factoryRatioForXY(),serializeFunc:v=>Math.round(v)}});
injectProperty("label", "textColor",{
    defaultValue:-1,
    persist:4,
    sideBar:{
        index: 1,
        options: [-1,0,1,2,3,4,5],
        label: "Text color :",
        advanced: true
    }
});
injectProperty("label", "visibility",{
    defaultValue:0,
    persist:3,
    sideBar:{
        index: 2,
        options: [0,1],
        labelFunc: (v)=>`Show : ${v===1?'only in edit mode':'always'}`,
        advanced: true
    }
});
injectProperty("label", "text",{
    defaultValue:"...",
    immutableDefault:true,
    persist:{
        index:2,
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 3,
        label: "Label :",
        textarea:true
    }
});
injectProperty("label", "href",{
    defaultValue:"",
    immutableDefault:true,
    persist:{
        index:5,
        deserializeFunc:decodeURIComponent
    },
    sideBar:{
        index: 4,
        label: "Clickable ? Add an Url :",
        advanced: true
    }
});
// --- Leader line (Zoopy only) ---------------------------------------------
// A blurb can be parked off to the side and point back to the zone it
// describes with a thin connector line. Set `leader` to 1 and give the target
// point in the same coordinate space as x/y via arrowX/arrowY.
// Persisted JSON-only so binary/URL sharing is unaffected (see persist.js).
injectProperty("label", "leader",{
    defaultValue:0,
    persist:{index:6, jsonOnly:true}
});
injectProperty("label", "arrowX",{
    defaultValue:0,
    persist:{index:7, jsonOnly:true, serializeFunc:v=>Math.round(v)}
});
injectProperty("label", "arrowY",{
    defaultValue:0,
    persist:{index:8, jsonOnly:true, serializeFunc:v=>Math.round(v)}
});
