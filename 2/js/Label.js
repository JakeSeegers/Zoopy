/**********************************

LABEL!

**********************************/
Label.COLORS = {
	"-1":"#000000", // black
	0: "#880000", // red
	1: "#885533", // orange
	2: "#888800", // yellow
	3: "#558800", // green
	4: "#446688", // blue
	5: "#664488", // purple
};
Label.FONTSIZE = 40;
Label._CLASS_ = "Label";

function Label(model, config){

	const self = this;
	self._CLASS_ = "Label";

	// Mah Parents!
	self.loopy = model.loopy;
	self.model = model;
	self.config = config;

	// Default values...
	const defaultProperties = {
		x: 0,
			y: 0,
	};
	injectedDefaultProps(defaultProperties,objTypeToTypeIndex("label"));
	_configureProperties(self, config, defaultProperties);

	// Draw
	self.draw = function(ctx){

		if(self.visibility===1 && self.loopy.mode===Loopy.MODE_PLAY) return;
		// cursor: pointer if clickable
		if(self.loopy.mode===Loopy.MODE_PLAY && self.href && self.isPointInLabel(Mouse.x, Mouse.y)) Mouse.showCursor("pointer");

		// Retina
		const x = self.x*2;
		const y = self.y*2;

		// DRAW HIGHLIGHT???
		if(self.loopy.sidebar.currentPage.target === self){
			const bounds = self.getBounds();
			ctx.save();
			ctx.scale(2,2); // RETINA
			ctx.beginPath();
			ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
			ctx.fillStyle = HIGHLIGHT_COLOR;
			ctx.fill();
			ctx.restore();
		}

		// LEADER LINE: connect a parked blurb back to the zone it describes.
		// Drawn before the text so the text always sits on top of its own line.
		if(self.leader){
			const bounds = self.getBounds();
			// Nearest point on the label box toward the target, so the line
			// meets the blurb's edge instead of stabbing through the text.
			const start = _closestPointOnBox(self.arrowX, self.arrowY, bounds);
			ctx.save();
			ctx.scale(2,2); // RETINA (bounds & target are in model space)
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(self.arrowX, self.arrowY);
			ctx.strokeStyle = Label.COLORS[self.textColor];
			ctx.globalAlpha = 0.45;
			ctx.lineWidth = 1.5;
			ctx.stroke();
			// Little dot pinning the target zone.
			ctx.beginPath();
			ctx.arc(self.arrowX, self.arrowY, 4, 0, Math.PI*2);
			ctx.fillStyle = Label.COLORS[self.textColor];
			ctx.fill();
			ctx.restore();
		}

		// Translate!
		ctx.save();
		ctx.translate(x,y);

		// Text!
		ctx.font = "100 "+Label.FONTSIZE+"px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = Label.COLORS[self.textColor];

		// ugh new lines are a PAIN.
		const lines = self.breakText();
		ctx.translate(0, -(Label.FONTSIZE*lines.length)/2);
		for(let i=0; i<lines.length; i++){
			const line = lines[i];
			ctx.fillText(line, 0, 0);
			ctx.translate(0, Label.FONTSIZE);
		}

		// Restore
		ctx.restore();

	};

	//////////////////////////////////////
	// KILL LABEL /////////////////////////
	//////////////////////////////////////

	self.kill = function(){

		// Remove from parent!
		model.removeLabel(self);

		// Killed!
		publish("kill",[self]);

	};

	//////////////////////////////////////
	// HELPER METHODS ////////////////////
	//////////////////////////////////////

	self.breakText = function(){
		const lines = self.text.split(/\n/);
		if(self.href) lines[0] = `🔗 ${lines[0]}`;
		if(self.loopy.mode===Loopy.MODE_EDIT && self.loopy.loopyMode){
			if(!self.visibility) lines.unshift('👁'); // '👁 ⯈'
		}
		return lines;
	};

	self.getBounds = function(){

		const ctx = self.model.context;

		// Get MAX width...
		const lines = self.breakText();
		let maxWidth = 0;
		for(let i=0; i<lines.length; i++){
			const line = lines[i];
			const w = (ctx.measureText(line).width + 10)*2;
			if(maxWidth<w) maxWidth=w;
		}

		// Dimensions, then:
		const w = maxWidth;
		const h = (Label.FONTSIZE*lines.length)/2;

		// Bounds, then:
		return {
			x: self.x-w/2,
			y: self.y-h/2-Label.FONTSIZE/2,
			width: w,
			height: h+Label.FONTSIZE/2
		};

	};
	subscribe("mouseclick",function(){

		if(self.loopy.mode!==Loopy.MODE_PLAY) return;
		if(!self.href) return;

		// Did you click on a label? If so, edit THAT label.
		const clickedLabel = self.isPointInLabel(Mouse.x, Mouse.y);
		if(clickedLabel){
			open(self.href,'_blank');
		}
	});

	self.isPointInLabel = function(x, y){
		return _isPointInBox(x,y, self.getBounds());
	};

	self.getBoundingBox = function(){
		const bounds = self.getBounds();
		return {
			left: bounds.x,
			top: bounds.y,
			right: bounds.x + bounds.width,
			bottom: bounds.y + bounds.height
		};
	};

}

// Nearest point on a label's box {x,y,width,height} to an external target.
function _closestPointOnBox(tx, ty, box){
	const left = box.x, right = box.x+box.width;
	const top = box.y, bottom = box.y+box.height;
	return {
		x: Math.max(left, Math.min(tx, right)),
		y: Math.max(top,  Math.min(ty, bottom))
	};
}