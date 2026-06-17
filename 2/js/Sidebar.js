/**********************************

SIDEBAR CODE

**********************************/

function Sidebar(loopy){

	const self = this;
	PageUI.call(self, document.getElementById("sidebar"));

	const sideBarSwitch = document.createElement("div");
	sideBarSwitch.id = "sidebarSwitch";
	sideBarSwitch.innerHTML = '❯';
	sideBarSwitch.onclick = function(){
		const sidebar = self.dom;
		const canvasses = document.getElementById("canvasses");
		let visible= false;
		if(!sidebar.style.right || sidebar.style.right==="0px") visible = true;
		if(visible) {
			sidebar.style.right = '-300px';
			sideBarSwitch.innerHTML = '❮';
			canvasses.style.right = '0px';
			sideBarSwitch.style.right = '0px';
		} else {
			sidebar.style.right = '0px';
			sideBarSwitch.innerHTML = '❯';
			canvasses.style.right = '300px';
			sideBarSwitch.style.right = '300px';
		}
		publish("resize");
	}
	self.dom.parentNode.appendChild(sideBarSwitch);

	// Edit
	self.edit = function(object){
		self.showPage(object._CLASS_);
		self.currentPage.edit(object);
	};

	// Go back to main when the thing you're editing is killed
	subscribe("kill",function(object){
		if(self.currentPage.target===object){
			self.showPage("Edit");
		}
	});

	////////////////////////////////////////////////////////////////////////////////////////////
	// ACTUAL PAGES ////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////

	// LoopyNode!
	(function(){
		const page = new SidebarPage();
		backToTopButton(self, page);
		injectPropsInSideBar(page,objTypeToTypeIndex("node"));
		page.onshow = ()=> page.getComponent("label").select(); // Focus on the label field
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("node"));
		deleteMeButton(self, page, "delete node");
		self.addPage("Node", page);
	})();

	// Edge!
	(function(){
		const page = new SidebarPage();
		backToTopButton(self, page);
		injectPropsInSideBar(page,objTypeToTypeIndex("edge"));
		page.onshow = ()=> page.getComponent("customLabel").select(); // Focus on the label field
		deleteMeButton(self, page, "delete arrow");
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("edge"));
		self.addPage("Edge", page);
	})();

	// Label!
	(function(){
		const page = new SidebarPage();
		backToTopButton(self, page);
		injectPropsInSideBar(page,objTypeToTypeIndex("label"));
		page.onshow = ()=> page.getComponent("text").select(); // Focus on the text field
		page.onhide = function(){
			// If you'd just edited it...
			const label = page.target;
			if(!page.target) return;
			// If text is "" or all spaces, DELETE.
			const text = label.text;
			if(/^\s*$/.test(text)){
				// that was all whitespace, KILL.
				page.target = null;
				label.kill();
			}
		};
		deleteMeButton(self, page, "delete label");
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("label"));
		self.addPage("Label", page);
	})();

	// Edit
	(function(){
		const page = new SidebarPage();
		page.target = loopy;
		injectPropsInSideBar(page,objTypeToTypeIndex("loopy"));
		page.onedit = ()=>injectPropsLabelInSideBar(page,objTypeToTypeIndex("loopy"));
		self.addPage("Edit", page);
	})();

	// Bibliography
	(function(){
		const page = new SidebarPage();

		// Back button
		backToTopButton(self, page);

		// Dynamic content container
		const container = document.createElement("div");
		container.className = "bib_sidebar_container";
		page.dom.appendChild(container);

		function formatAuthors(entry){
			return (entry.author||[]).map(a=>a.family||a.literal||"").filter(Boolean).join(", ");
		}
		function getYear(entry){
			return entry.issued && entry.issued["date-parts"] ? entry.issued["date-parts"][0][0] : "";
		}
		function getCitationCounts(){
			const usage = {};
			(loopy.bibliography||[]).forEach(e => usage[e.id] = 0);
			const scan = (items) => items.forEach(item => {
				if(!item.sources) return;
				try { JSON.parse(item.sources).forEach(id => { if(id in usage) usage[id]++; }); } catch(e){}
			});
			scan(loopy.model.nodes);
			scan(loopy.model.edges);
			return usage;
		}

		function renderBibliography(){
			container.innerHTML = "";
			const bib = loopy.bibliography || [];

			if(bib.length === 0){
				const empty = document.createElement("div");
				empty.className = "bib_sidebar_empty";
				empty.innerHTML = "No bibliography loaded.<br><br>Use <b>import bibliography</b> in the main panel to load a CSL-JSON file.";
				container.appendChild(empty);
				return;
			}

			const usage = getCitationCounts();
			const citedCount = bib.filter(e=>usage[e.id]>0).length;

			const summary = document.createElement("div");
			summary.className = "bib_sidebar_summary";
			summary.textContent = `${bib.length} references · ${citedCount} cited`;
			container.appendChild(summary);

			const sorted = [...bib].sort((a,b)=>(usage[b.id]||0)-(usage[a.id]||0)||(getYear(b)||0)-(getYear(a)||0));

			sorted.forEach(entry => {
				const div = document.createElement("div");
				div.className = "bib_sidebar_entry" + (usage[entry.id] > 0 ? " cited" : "");

				const topLine = document.createElement("div");
				topLine.className = "bib_sidebar_meta";
				const authors = formatAuthors(entry);
				const year = getYear(entry);
				topLine.textContent = [authors, year].filter(Boolean).join(" ");
				div.appendChild(topLine);

				const title = document.createElement("div");
				title.className = "bib_sidebar_title";
				title.textContent = entry.title || "(no title)";
				div.appendChild(title);

				if(entry["container-title"] || entry.publisher){
					const journal = document.createElement("div");
					journal.className = "bib_sidebar_journal";
					journal.textContent = entry["container-title"] || entry.publisher;
					div.appendChild(journal);
				}

				if(usage[entry.id] > 0){
					const badge = document.createElement("span");
					badge.className = "bib_sidebar_badge";
					badge.textContent = `cited ${usage[entry.id]}×`;
					div.appendChild(badge);
				}

				container.appendChild(div);
			});
		}

		page.onshow = renderBibliography;
		subscribe("bibliography/changed", () => { if(self.currentPage === page) renderBibliography(); });
		subscribe("model/changed",         () => { if(self.currentPage === page) renderBibliography(); });

		self.addPage("Bibliography", page);
	})();

	// Ctrl-S to SAVE
	subscribe("key/save",function(){
		if(Key.control){ // Ctrl-S or ⌘-S
			publish("modal",["save_link"]);
		}
	});

}
function backToTopButton(sidebar, page){
	page.addComponent(new ComponentButton({
		header: true,
		label: "back to top",
		onclick: function(){
			sidebar.showPage("Edit");
		}
	}));
}
function deleteMeButton(sidebar, page, label){
	page.addComponent(new ComponentButton({
		label: label,
		onclick: function(me){
			me.kill();
			sidebar.showPage("Edit");
		}
	}));
}

function SidebarPage(){

	// TODO: be able to focus on next component with an "Enter".

	const self = this;
	self.target = null;

	// DOM
	self.dom = document.createElement("div");
	self.hide = function(){ self.dom.style.display="none"; self.onhide(); };
	self.show = function(){
		self.dom.style.display="block";
		//self.dom.classList.remove("compact");
		//if(self.dom.offsetHeight>innerHeight) self.dom.classList.add("compact");
		self.onshow();
	};

	// Components
	self.components = [];
	self.componentsByID = {};
	self.addComponent = function(propName, component){

		// One or two args
		if(!component){
			component = propName;
			propName = "";
		}

		component.page = self; // tie to self
		component.propName = propName; // tie to propName
		self.dom.appendChild(component.dom); // add to DOM

		// remember component
		self.components.push(component);
		self.componentsByID[propName] = component;

		// return!
		return component;

	};
	self.getComponent = function(propName){
		return self.componentsByID[propName];
	};

	// Edit
	self.edit = function(object){

		// New target to edit!
		self.target = object;

		// Show each property with its component
		for(let i=0;i<self.components.length;i++){
			self.components[i].show();
		}

		// Callback!
		self.onedit();

	};

	// TO IMPLEMENT: callbacks
	self.onedit = function(){};
	self.onshow = function(){};
	self.onhide = function(){};

	// Start hiding!
	self.hide();

}



/////////////////////////////////////////////////////////////////////////////////////////////
// COMPONENTS ///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////

function Component(){
	const self = this;
	self.dom = null;
	self.page = null;
	self.propName = null;
	self.show = function(){
		// TO IMPLEMENT
	};
	self.getValue = function(){
		return self.page.target[self.propName];
	};
	self.setValue = function(value){
		
		// Model's been changed!
		publish("model/changed");

		// Edit the value!
		self.page.target[self.propName] = value;

		updateDocLink(self);
		self.page.onedit(); // callback!
		
	};
	self.setBGColor = function () {}
}
function updateDocLink(component) {
	let type = component.page.id;
	if(type==="Edit") type = 'Global';
	component.dom.querySelector('.docLink').href = `javascript:publish("modal",["doc","${type}/${component.propName}/${component.getValue()}"])`;
}

function ComponentInput(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: label + text input
	self.dom = document.createElement("div");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	const label = _createLabel(config.label);
	const className = config.textarea ? "component_textarea" : "component_input";
	const input = _createInput(className, config.textarea);
	input.addEventListener("keydown",(event)=>{
		if(event.code === "Delete" && !input.value){
			self.page.target.kill();
		}
	});
	input.oninput = function(){
		self.setValue(input.value);
		updateClassActiveDefault(self,config.defaultValue);
		injectPropsUpdateDefault(self,self.getValue());
		// Callback! (if any)
		if(config.oninput){
			config.oninput(self,self.getValue());
		}
	};
	self.dom.appendChild(label);
	self.dom.appendChild(input);

	// Show
	self.show = function(){
		input.value = self.getValue();
		updateClassActiveDefault(self,config.defaultValue);
		updateDocLink(self);
	};

	// Select
	self.select = function(){
		setTimeout(function(){ input.select(); },10);
	};

}
function advancedConditionalDisplay(self) {
	self.dom.classList.add('adv');
	const adv = document.createElement("div");
	adv.innerHTML = "Advanced feature in use : ";
	adv.setAttribute("class","adv_disclaimer");
	self.dom.appendChild(adv);
}
function colorLogicConditionalDisplay(self) {
	self.dom.classList.add('colorLogic');
	const adv = document.createElement("div");
	adv.innerHTML = "This feature need activated colorLogic !";
	adv.setAttribute("class","colorLogic_disclaimer");
	self.dom.appendChild(adv);
}
function simpleOnlyConditionalDisplay(self) {
	self.dom.classList.add('simpleOnly');
}
function updateClassActiveDefault(self, defaultValue) {
	if(self.getValue() === defaultValue)self.dom.classList.remove("active");
	else self.dom.classList.add("active");

	if(self.page.dom.querySelector('.adv.active')){
		const simpleOnly = self.page.dom.querySelectorAll('.simpleOnly');
		for(let so of simpleOnly) so.classList.add("inactive");
	} else {
		const simpleOnly = self.page.dom.querySelectorAll('.simpleOnly');
		for(let so of simpleOnly) so.classList.remove("inactive");
	}
}
function addBgImage(sliderDOM, className, imgName='', fileExtension='png') {
	const img = document.createElement("div");
	img.draggable = false;
	if(imgName) img.style.backgroundImage = `url(css/sliders/${imgName}.${fileExtension})`;
	img.classList.add(className);
	sliderDOM.appendChild(img);
	return img;
}
function addDynamicUIbgImage(sliderDOM,imgName, myClass, fileExtension='png') {
	return addBgImage(sliderDOM,`component_slider_graphic_${myClass}`,`${imgName}_${myClass}`,fileExtension);
}
function ComponentSlider(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// TODO: control with + / -, alt keys??

	// DOM: label + slider
	self.dom = document.createElement("div");
	self.dom.classList.add('not_in_play_mode');
	if(config.combineWithNext) self.dom.classList.add('combineWithNext');
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	const label = _createLabel(config.label);
	self.dom.appendChild(label);
	const sliderDOM = document.createElement("div");
	sliderDOM.classList.add("component_slider");
	self.dom.appendChild(sliderDOM);

	// Slider DOM: graphic + pointer

	const sliderBG = addBgImage(sliderDOM,'component_slider_graphic');
	const slider = addBgImage(sliderDOM,'component_slider_graphic',config.bg);
	//TODO: implement the following
	/*if(config.mergedPointer){
		sliderDOM.classList.add("pointerIncluded");
	}*/
	if(config.activeAtLeft) config.activeAtLeft = addDynamicUIbgImage(sliderDOM,config.bg,"activeAtLeft");
	if(config.activeAtRight) config.activeAtRight = addDynamicUIbgImage(sliderDOM,config.bg,"activeAtRight");
	if(config.activeOption) config.activeOption = addDynamicUIbgImage(sliderDOM,config.bg,"activeOption");
	/*if(config.hover){
		sliderDOM.appendChild(addDynamicUIbgImage(sliderDOM,config.bg,"hoverOption","gif"));
	}*/
	const pointer = addBgImage(sliderDOM,'component_slider_pointer');
	const clickCatcher = addBgImage(sliderDOM,'component_slider_clickCatcher');

	const movePointer = function() {
		const value = self.getValue();
		const optionIndex = config.options.indexOf(value);
		const x = (optionIndex + 0.5) * (250 / config.options.length);
		pointer.style.left = (x - 7.5) + "px";
		let active = 0;
		if (config.activeOption) {
			active=1;
			const x = - optionIndex * (250 / config.options.length);
			const left = optionIndex * (250 / config.options.length);
			config.activeOption.style.left = `${left}px`;
			config.activeOption.style.width = `${250 / config.options.length}px`;
			config.activeOption.style.backgroundPosition = `${x}px 0`;
		}
		if (config.activeAtLeft) {
			const x = (optionIndex + 1 - active) * (250 / config.options.length);
			config.activeAtLeft.style.width = `${x}px`;
			slider.style.right = `0px`;
			slider.style.backgroundPosition = `${- (optionIndex + 1) * (250 / config.options.length)}px`
			slider.style.width = `${250 - (optionIndex + 1) * (250 / config.options.length)}px`
		}
		if (config.activeAtRight) {
			const x = - (optionIndex + active) * (250 / config.options.length);
			const size = 250 - (optionIndex + active) * (250 / config.options.length);
			config.activeAtRight.style.width = `${size}px`;
			config.activeAtRight.style.backgroundPosition = `${x}px 0`;
			slider.style.width = `${optionIndex * (250 / config.options.length)}px`
		}
	};
	// On click... (or on drag)
	let isDragging = false;
	const onmousedown = function(event){
		isDragging = true;
		sliderInput(event);
	};
	const onmouseup = function(){
		isDragging = false;
	};
	const onmousemove = function(event){
		if(isDragging) sliderInput(event);
	};
	const sliderInput = function(event){

		// What's the option?
		const index = event.x/250;
		const optionIndex = Math.floor(index*config.options.length);
		const option = config.options[optionIndex];
		if(option===undefined) return;
		self.setValue(option);

		updateClassActiveDefault(self,config.defaultValue);

		// Callback! (if any)
		injectPropsUpdateDefault(self,option);
		if(config.oninput){
			config.oninput(self,option);
		}

		// Move pointer there.
		movePointer();

	};
	_addMouseEvents(sliderDOM, onmousedown, onmousemove, onmouseup);

	// Show
	self.show = function(){
		updateClassActiveDefault(self,config.defaultValue);
		updateDocLink(self);
		movePointer();
	};

	// BG Color!
	self.setBGColor = function(color){
		sliderBG.style.backgroundColor = color;
	};

}

function ComponentButton(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: just a button
	self.dom = document.createElement("div");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	const button = _createButton(config.label, function(){
		config.onclick(self.page.target);
	});
	self.dom.appendChild(button);

	// Unless it's a HEADER button!
	if(config.header){
		button.setAttribute("header","yes");
	}

}

function ComponentHTML(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// just a div
	self.dom = document.createElement("div");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	self.dom.innerHTML = config.html;

}

function ComponentSourcePicker(config){

	const self = this;
	Component.apply(self);

	self.dom = document.createElement("div");
	self.dom.className = "source_picker";

	const label = _createLabel(config.label);
	self.dom.appendChild(label);

	const tagsArea = document.createElement("div");
	tagsArea.className = "source_picker_tags";
	self.dom.appendChild(tagsArea);

	const searchInput = document.createElement("input");
	searchInput.className = "source_picker_search component_input";
	searchInput.placeholder = "Search bibliography…";
	self.dom.appendChild(searchInput);

	const resultsList = document.createElement("div");
	resultsList.className = "source_picker_results";
	self.dom.appendChild(resultsList);

	function getSelected(){
		const raw = self.getValue();
		if(!raw) return [];
		try { return JSON.parse(raw); } catch(e){ return []; }
	}

	function setSelected(arr){
		self.setValue(arr.length ? JSON.stringify(arr) : "");
		render();
	}

	function formatEntry(entry){
		const authors = (entry.author||[]).map(a=>a.family||a.literal||"").filter(Boolean).join(", ");
		const year = entry.issued && entry.issued["date-parts"] ? entry.issued["date-parts"][0][0] : "";
		const title = entry.title || entry.id;
		return `${authors}${year?" ("+year+")":""} — ${title}`;
	}

	function shortLabel(entry){
		const a = entry.author && entry.author[0];
		const family = a ? (a.family || a.literal || "") : "";
		const year = entry.issued && entry.issued["date-parts"] ? entry.issued["date-parts"][0][0] : "";
		return family ? `${family}${year?" "+year:""}` : (entry.id || "?");
	}

	function renderResults(query, selected){
		resultsList.innerHTML = "";
		const bib = loopy.bibliography || [];
		if(bib.length === 0){
			const msg = document.createElement("div");
			msg.className = "source_picker_empty";
			msg.textContent = "No bibliography loaded — import a CSL-JSON file from the main panel.";
			resultsList.appendChild(msg);
			return;
		}
		const q = query.toLowerCase();
		const filtered = bib.filter(e => !q || formatEntry(e).toLowerCase().includes(q)).slice(0,12);
		if(filtered.length === 0){
			const msg = document.createElement("div");
			msg.className = "source_picker_empty";
			msg.textContent = "No matches.";
			resultsList.appendChild(msg);
			return;
		}
		filtered.forEach(entry => {
			const item = document.createElement("div");
			item.className = "source_picker_item" + (selected.includes(entry.id) ? " selected" : "");
			item.textContent = formatEntry(entry);
			item.onclick = () => {
				const cur = getSelected();
				setSelected(cur.includes(entry.id) ? cur.filter(s=>s!==entry.id) : [...cur, entry.id]);
			};
			resultsList.appendChild(item);
		});
	}

	function render(){
		const selected = getSelected();
		const bib = loopy.bibliography || [];

		tagsArea.innerHTML = "";
		selected.forEach(id => {
			const entry = bib.find(e=>e.id===id);
			const tag = document.createElement("span");
			tag.className = "source_picker_tag";
			tag.textContent = entry ? shortLabel(entry) : id;
			const rm = document.createElement("span");
			rm.className = "source_picker_tag_remove";
			rm.textContent = "×";
			rm.onclick = () => setSelected(getSelected().filter(s=>s!==id));
			tag.appendChild(rm);
			tagsArea.appendChild(tag);
		});

		renderResults(searchInput.value, selected);
	}

	searchInput.oninput = () => renderResults(searchInput.value, getSelected());
	subscribe("bibliography/changed", () => { if(self.page.target) render(); });

	self.show = function(){
		updateDocLink(self);
		render();
	};

}

function ComponentOutput(config){

	// Inherit
	const self = this;
	Component.apply(self);

	// DOM: just a readonly input that selects all when clicked
	self.dom = _createInput("component_output");
	if(config.advanced) advancedConditionalDisplay(self);
	if(config.colorLogic) colorLogicConditionalDisplay(self);
	if(config.simpleOnly) simpleOnlyConditionalDisplay(self);
	self.dom.setAttribute("readonly", "true");
	self.dom.onclick = function(){
		self.dom.select();
	};

	// Output the string!
	self.output = function(string){
		self.dom.value = string;
	};

}