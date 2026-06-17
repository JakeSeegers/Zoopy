// Loopy global features
/*injectProperty("loopy", "LoopyNode._UID",{
    defaultValue:0, // bool
    persist:0, // reserved
});*/
injectProperty("loopy", "loopyMode",{
    defaultValue:0,
    persist:1,
    sideBar:{
        index: 1,
        options: [ 0, 1], // Simple || Advanced
        label: "Zoopy mode :",
        oninput: factorySwitchMode("simple","advanced")
    }
});
injectProperty("loopy", "colorLogic",{
    defaultValue:0,
    persist:2,
    sideBar:{
        index: 2,
        options: [ 0, 1],
        labelFunc: (v)=>v?"Color : significant for logic":"Color : only aesthetic",
        advanced: true,
        oninput: factorySwitchMode("colorAestheticMode","colorLogicMode")
    }
});
injectProperty("loopy", "cameraMode",{
    defaultValue:0,
    persist:3,
    sideBar:{
        index: 3,
        options: [0,1,2],
        labelFunc: (v)=>`Camera : ${[
            "resize to scene", // scene cam
            "follow signals", // signal cam
            "user controllable", // free cam
        ][v]}`,
        advanced: true
    }
});
/*injectProperty("loopy", "embed",{
    defaultValue:0, // bool
    persist:3, // reserved
});*/
injectProperty("loopy", "beforeAll",{
    sideBar:{
        index: 0,
        html:`<div class="globalLoopyFirstItem"></div><b style='font-size:1.4em'>Zoopy</b> (v2.0)
        <br>a tool for thinking in systems
        <br>
        <br><span class='mini_button' onclick='publish("modal",["examples"])'>see examples</span>
            <span class='mini_button' onclick='publish("modal",["howto"])'>how to</span>
            <span class='mini_button' onclick='publish("modal",["credits"])'>credits</span>
        <br><hr class="not_in_play_mode"/>`
    }
});
injectProperty("loopy", "afterAll",{
    sideBar:{
        index: 99,
        html: `<hr/>
        <span class='mini_button' onclick='publish("modal",["save_link"])' title="Ctrl-S">save as link (Ctrl-S)</span>
        <br>
        <br><span class='mini_button' onclick='publish("export/file")'>save as file</span>
            <span class='mini_button' onclick='publish("load/file")'>load from file</span>
        <br>
        <span class='mini_button' onclick='publish("modal",["embed"])' title="embed in a blog or website">embed</span>
        <br>
        <hr/>
        <span class='mini_button' onclick='publish("load/bibliography")'>import bibliography (CSL-JSON)</span>
        <br>
        <br><span class='mini_button' onclick='publish("modal",["bibliography"])'>view bibliography</span>
        <br>
        <div class="adv">
            <hr/>
            <span class='mini_button' onclick='publish("export/json")'>json export</span>
                <span class='mini_button' onclick='publish("modal",["urlRemoteFile"])'>load from url</span>
            <br>
            <br><span class='mini_button' onclick='publish("import/file")'>import extra file</span>
            <br>
        </div>
        <hr/>
        <span style='font-size:0.85em'>Click any <a href='javascript:publish("modal",["doc"])'>?</a> in the sidebar for help on that feature.</span>
        `
    }
});
function factorySwitchMode(disabledClass,activatedClass){
    return function(self, value){
        let apply;
        if(value) apply = function(page){
            page.dom.classList.add(activatedClass);
            page.dom.classList.remove(disabledClass);
        };
        else apply = function(page){
            page.dom.classList.add(disabledClass);
            page.dom.classList.remove(activatedClass);
        };
        loopy.sidebar.pages.forEach(apply);
    }
}
