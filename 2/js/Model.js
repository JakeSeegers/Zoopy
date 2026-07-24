/**********************************

MODEL!

**********************************/

function Model(loopy){

	const self = this;
	self.loopy = loopy;

	// Properties
	self.speed = 0.05;

	// Create canvas & context
	const canvas = _createCanvas();
	const ctx = canvas.getContext("2d");
	self.canvas = canvas;
	self.context = ctx;



	///////////////////
	// NODES //////////
	///////////////////

	// Nodes
	self.nodes = [];
	self.getNode = function(id){
		return self.nodes[id];
	};

	// Remove LoopyNode
	self.addNode = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add LoopyNode
		const node = new LoopyNode(self,config);
		self.nodes.push(node);
		if(!node.id || node.id !== self.nodes.length-1) node.id = self.nodes.length-1;
		applyInitialPropEffects(node);
		self.update();
		return node;

	};

	// Remove LoopyNode
	self.removeNode = function(node){

		// Model's been changed!
		publish("model/changed");

		// Remove from array
		self.nodes.splice(self.nodes.indexOf(node),1);
		self.nodes.forEach((n,i)=>n.id = i);

		// Remove all associated TO and FROM edges
		for(let i=0; i<self.edges.length; i++){
			const edge = self.edges[i];
			if(edge.to===node || edge.from===node){
				edge.kill();
				i--; // move index back, coz it's been killed
			}
		}

	};


	///////////////////
	// EDGES //////////
	///////////////////

	// Edges
	self.edges = [];

	// Remove edge
	self.addEdge = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add Edge
		const edge = new Edge(self,config);
		self.edges.push(edge);
		applyInitialPropEffects(edge);
		self.update();
		return edge;
	};

	// Remove edge
	self.removeEdge = function(edge){

		// Model's been changed!
		publish("model/changed");

		// Remove edge
		self.edges.splice(self.edges.indexOf(edge),1);

	};

	// Get all edges with start node
	self.getEdgesByStartNode = function(startNode){
		return self.edges.filter(function(edge){
			return(edge.from===startNode);
		});
	};
	// Get all edges with start node
	self.getEdgesByEndNode = function(endNode){
		return self.edges.filter(function(edge){
			return(edge.to===endNode);
		});
	};




	///////////////////
	// LABELS /////////
	///////////////////

	// Labels
	self.labels = [];

	// Remove label
	self.addLabel = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add label
		const label = new Label(self,config);
		self.labels.push(label);
		applyInitialPropEffects(label);
		self.update();
		return label;
	};

	// Remove label
	self.removeLabel = function(label){

		// Model's been changed!
		publish("model/changed");

		// Remove label
		self.labels.splice(self.labels.indexOf(label),1);

	};

	// Box helpers shared by the layout code. Overlap of two
	// {left,top,right,bottom} boxes grown by `pad`, or null when clear.
	const _boxOverlap = (a,b,pad)=>{
		const ox = Math.min(a.right,b.right) - Math.max(a.left,b.left) + pad;
		const oy = Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) + pad;
		return (ox>0 && oy>0) ? {ox,oy} : null;
	};
	const _bcx = box => (box.left+box.right)/2;
	const _bcy = box => (box.top+box.bottom)/2;

	// Approximate on-canvas box of an edge's label (the +/− glyph or the
	// customLabel citation). labelX/labelY are set by Edge.update at the arc
	// midpoint; the edge font is 60px retina ≈ 30px in model space.
	self.edgeLabelBox = function(edge){
		if(!edge.label) return null;
		const ctx = self.context;
		ctx.font = "30px sans-serif";
		const lines = String(edge.label).split("\n");
		let wmax = 0;
		for(const t of lines){ const w = ctx.measureText(t).width; if(w>wmax) wmax=w; }
		const halfW = wmax/2 + 8;
		const halfH = (lines.length*34)/2;
		return {left:edge.labelX-halfW, right:edge.labelX+halfW,
		        top:edge.labelY-halfH, bottom:edge.labelY+halfH};
	};

	// Declutter the whole diagram on import.
	//
	// Phase 1 — UNIFORM EXPANSION (systems-safe). Node names and edge/arrow
	// labels are fixed pixel sizes pinned to the geometry, so the only way to
	// give them room without distorting the model is to scale the whole figure.
	// Scaling every node position AND every arc by the same factor about the
	// centroid is a *similar figure*: each edge's length — and therefore its
	// signal-traversal time (signalSpeed = speed / arrowLength) — scales by the
	// same factor, so all RELATIVE dynamics are preserved exactly (only a global
	// tempo change, which the auto-fit camera hides). We pick the smallest
	// factor that clears the crowding.
	//
	// Phase 2 — FREE-LABEL RELAXATION. Free blurbs then resist each other and
	// the (now roomier) node + edge-label boxes, held near home by a weak
	// spring. Only label positions move here; the topology never changes.
	self.autoLayout = function(){

		const labels = self.labels;
		self.context.font = "100 "+Label.FONTSIZE+"px sans-serif";

		// ---- Phase 1: uniform expansion ------------------------------------
		if(self.nodes.length >= 2){
			let cx=0, cy=0;
			self.nodes.forEach(n=>{ cx+=n.x; cy+=n.y; });
			cx/=self.nodes.length; cy/=self.nodes.length;

			// Anchor boxes (node circles + edge labels) as centre-offset + size.
			const anchors = [];
			self.nodes.forEach(n=>{ const b=n.getBoundingBox();
				anchors.push({bx:_bcx(b), by:_bcy(b), hw:(b.right-b.left)/2, hh:(b.bottom-b.top)/2}); });
			self.edges.forEach(e=>{ const b=self.edgeLabelBox(e); if(b)
				anchors.push({bx:e.labelX, by:e.labelY, hw:(b.right-b.left)/2, hh:(b.bottom-b.top)/2}); });

			const MARGIN = 16; // demand real breathing room, not a bare miss
			const overlapsAt = (F)=>{
				let count=0;
				const bx = anchors.map(a=>({
					l:cx+F*(a.bx-cx)-a.hw-MARGIN, r:cx+F*(a.bx-cx)+a.hw+MARGIN,
					t:cy+F*(a.by-cy)-a.hh-MARGIN, b:cy+F*(a.by-cy)+a.hh+MARGIN }));
				for(let i=0;i<bx.length;i++) for(let j=i+1;j<bx.length;j++){
					const A=bx[i],B=bx[j];
					if(Math.min(A.r,B.r)>Math.max(A.l,B.l) && Math.min(A.b,B.b)>Math.max(A.t,B.t)) count++;
				}
				return count;
			};

			const base = overlapsAt(1);
			if(base>0){
				const goal = Math.floor(base*0.1); // clear ~90% of collisions
				let F = 3.0;                        // cap the zoom-out
				for(let f=1.1; f<=3.0001; f+=0.1){
					if(overlapsAt(f) <= goal){ F=f; break; }
				}
				// Apply the similar-figure scale: nodes, arcs, and free labels
				// (plus any leader targets, so leaders keep pointing true).
				self.nodes.forEach(n=>{ n.x=cx+F*(n.x-cx); n.y=cy+F*(n.y-cy); });
				self.edges.forEach(e=>{ e.arc*=F; });
				labels.forEach(l=>{
					l.x=cx+F*(l.x-cx); l.y=cy+F*(l.y-cy);
					if(l.leader){ l.arrowX=Math.round(cx+F*(l.arrowX-cx)); l.arrowY=Math.round(cy+F*(l.arrowY-cy)); }
				});
				self.update(); // recompute edge labelX/labelY at new positions
			}
		}

		// ---- Phase 1.5: fan out crowded edge labels via arc -----------------
		// An arrow label can't leave its arrow, but its ONE free axis is the
		// arc: raising |arc| slides the label out along the edge's perpendicular
		// without moving a single node. So we let edge labels repel each other
		// and translate that push into arc changes — clamped to [0.4, 2.5]× the
		// original |arc| so each edge's length (and its signal timing) only
		// shifts modestly. Self-loops keep their arc (it sets the loop size).
		(function fanEdgeLabels(){
			const fannable = self.edges.filter(e=>e.from!==e.to && e.label);
			if(fannable.length < 2) return;
			const arc0 = new Map(fannable.map(e=>[e, e.arc]));
			const nodeBoxes = self.nodes.map(n=>n.getBoundingBox());
			const perpOf = e=>{
				const ang = Math.atan2(e.to.y-e.from.y, e.to.x-e.from.x) - Math.PI/2;
				return {x:Math.cos(ang), y:Math.sin(ang)};
			};
			const EPAD = 26, ESTEP = 0.6, EITERS = 120;
			for(let it=0; it<EITERS; it++){
				const boxes = fannable.map(e=>self.edgeLabelBox(e));
				const dArc = new Array(fannable.length).fill(0);
				let moved = false;
				for(let i=0; i<fannable.length; i++){
					const pi = perpOf(fannable[i]);
					// repel other edge labels
					for(let j=i+1; j<fannable.length; j++){
						const o = _boxOverlap(boxes[i],boxes[j],EPAD);
						if(!o) continue;
						moved = true;
						let dx=_bcx(boxes[i])-_bcx(boxes[j]), dy=_bcy(boxes[i])-_bcy(boxes[j]);
						if(!dx && !dy){ dx=Math.random()-0.5; dy=Math.random()-0.5; }
						const len=Math.hypot(dx,dy)||1, mag=Math.min(o.ox,o.oy)*0.5;
						const fvx=dx/len*mag, fvy=dy/len*mag;
						// project each edge's share onto its own perpendicular:
						// dLabel ≈ dArc · perpUnit, so dArc = force · perpUnit.
						const pj=perpOf(fannable[j]);
						dArc[i] += fvx*pi.x + fvy*pi.y;
						dArc[j] -= fvx*pj.x + fvy*pj.y;
					}
					// also push the label off any node it sits on
					for(const nb of nodeBoxes){
						const o = _boxOverlap(boxes[i],nb,EPAD);
						if(!o) continue;
						moved = true;
						let dx=_bcx(boxes[i])-_bcx(nb), dy=_bcy(boxes[i])-_bcy(nb);
						if(!dx && !dy){ dx=Math.random()-0.5; dy=Math.random()-0.5; }
						const len=Math.hypot(dx,dy)||1, mag=Math.min(o.ox,o.oy);
						dArc[i] += (dx/len*mag)*pi.x + (dy/len*mag)*pi.y;
					}
				}
				if(!moved) break;
				for(let i=0; i<fannable.length; i++){
					const e = fannable[i];
					const a0 = arc0.get(e), sign = a0<0?-1:1;
					const lo = Math.abs(a0)*0.3, hi = Math.abs(a0)*4.0;
					let m = Math.abs(e.arc + dArc[i]*ESTEP);
					e.arc = sign*Math.max(lo, Math.min(hi, m)); // keep side, bound length
				}
				self.update(); // refresh labelX/labelY for the next pass
			}
		})();

		if(labels.length === 0) return;

		// ---- Phase 2: free-label force relaxation --------------------------
		const PAD = 14;      // breathing room baked into every box
		const SPRING = 0.03; // pull back toward authored position (weak)
		const STEP = 0.5;    // integration step
		const ITERS = 400;

		// Immovable obstacles: node circles AND edge-label boxes.
		const obstacles = self.nodes.map(n=>n.getBoundingBox());
		self.edges.forEach(e=>{ const b=self.edgeLabelBox(e); if(b) obstacles.push(b); });

		const home = labels.map(l=>({x:l.x, y:l.y}));

		for(let iter=0; iter<ITERS; iter++){
			const fx = new Array(labels.length).fill(0);
			const fy = new Array(labels.length).fill(0);

			// label vs label (both move)
			for(let i=0; i<labels.length; i++){
				const a = labels[i].getBoundingBox();
				for(let j=i+1; j<labels.length; j++){
					const b = labels[j].getBoundingBox();
					const o = _boxOverlap(a,b,PAD);
					if(!o) continue;
					let dx = _bcx(a)-_bcx(b), dy = _bcy(a)-_bcy(b);
					if(!dx && !dy){ dx = Math.random()-0.5; dy = Math.random()-0.5; }
					const len = Math.hypot(dx,dy)||1;
					const mag = Math.min(o.ox,o.oy)*0.5;
					fx[i]+=dx/len*mag; fy[i]+=dy/len*mag;
					fx[j]-=dx/len*mag; fy[j]-=dy/len*mag;
				}
			}

			// label vs obstacle (only the label feels it)
			for(let i=0; i<labels.length; i++){
				const a = labels[i].getBoundingBox();
				for(const ob of obstacles){
					const o = _boxOverlap(a,ob,PAD);
					if(!o) continue;
					let dx = _bcx(a)-_bcx(ob), dy = _bcy(a)-_bcy(ob);
					if(!dx && !dy){ dx = Math.random()-0.5; dy = Math.random()-0.5; }
					const len = Math.hypot(dx,dy)||1;
					const mag = Math.min(o.ox,o.oy);
					fx[i]+=dx/len*mag; fy[i]+=dy/len*mag;
				}
			}

			// spring home, integrate, measure convergence
			let maxMove = 0;
			for(let i=0; i<labels.length; i++){
				fx[i] += (home[i].x - labels[i].x)*SPRING;
				fy[i] += (home[i].y - labels[i].y)*SPRING;
				const mvx = fx[i]*STEP, mvy = fy[i]*STEP;
				labels[i].x += mvx; labels[i].y += mvy;
				maxMove = Math.max(maxMove, Math.abs(mvx)+Math.abs(mvy));
			}
			if(maxMove < 0.25) break; // settled
		}

		// Fallback: any blurb still stuck on a node gets parked clear with a
		// leader pointing at the zone it covered (unless already aimed).
		const nodeBoxes = self.nodes.map(n=>n.getBoundingBox());
		const inside = (x,y,box)=> x>=box.left && x<=box.right && y>=box.top && y<=box.bottom;
		for(const lbl of labels){
			const collided = nodeBoxes.find(nb=>_boxOverlap(lbl.getBoundingBox(),nb,PAD));
			if(!collided) continue;
			const originX = lbl.x, originY = lbl.y;
			const onNode = nodeBoxes.some(nb=>inside(originX,originY,nb));
			let dx = originX-_bcx(collided), dy = originY-_bcy(collided);
			if(!dx && !dy){ dx=1; dy=0; }
			const len = Math.hypot(dx,dy)||1; dx/=len; dy/=len;
			let guard=0;
			while(guard++<300 && nodeBoxes.some(b=>_boxOverlap(lbl.getBoundingBox(),b,PAD))){
				lbl.x += dx*18; lbl.y += dy*18;
			}
			if(!lbl.leader && onNode){
				lbl.leader = 1;
				lbl.arrowX = Math.round(originX);
				lbl.arrowY = Math.round(originY);
			}
		}
	};





	///////////////////
	// GROUPS /////////
	///////////////////

	// Groups
	self.groups = [];

	// Remove label
	self.addGroup = function(config){

		// Model's been changed!
		publish("model/changed");

		// Add label
		const group = new Group(self,config);
		self.groups.push(group);
		applyInitialPropEffects(group);
		self.update();
		return group;
	};

	// Remove group
	self.removeGroup = function(group){

		// Model's been changed!
		publish("model/changed");

		// Remove label
		self.groups.splice(self.groups.indexOf(group),1);

	};



	///////////////////
	// UPDATE & DRAW //
	///////////////////

	let _canvasDirty = false;

	self.update = function(){

		// Update edges THEN nodes
		for(let i=0;i<self.edges.length;i++) self.edges[i].update(self.speed);
		for(let i=0;i<self.nodes.length;i++) self.nodes[i].update(self.speed);

		// Dirty!
		_canvasDirty = true;

	};

	// SHOULD WE DRAW?
	const drawCountdownFull = 7*60; // two-second buffer!
	let drawCountdown = drawCountdownFull;

	// ONLY IF MOUSE MOVE / CLICK
	subscribe("mousemove", function(){ drawCountdown=drawCountdownFull; });
	subscribe("mousedown", function(){ drawCountdown=drawCountdownFull; });

	// OR INFO CHANGED
	subscribe("model/changed", function(){
		if(self.loopy.mode===Loopy.MODE_EDIT) drawCountdown=drawCountdownFull;
	});

	// OR RESIZE or RESET
	subscribe("resize",function(){ drawCountdown=drawCountdownFull; });
	subscribe("model/reset",function(){ drawCountdown=drawCountdownFull; });
	subscribe("loopy/mode",function(){
		if(loopy.mode===Loopy.MODE_PLAY){
			drawCountdown=drawCountdownFull*2;
		}else{
			drawCountdown=drawCountdownFull;
		}
	});

	self.draw = function(){

		// SHOULD WE DRAW?
		// ONLY IF ARROW-SIGNALS ARE MOVING
		for(let i=0;i<self.edges.length;i++){
			if(self.edges[i].signals.length>0){
				drawCountdown = drawCountdownFull;
				break;
			}
		}

		// DRAW???????
		drawCountdown--;
		if(drawCountdown<=0) return;

		// Also only draw if last updated...
		if(!_canvasDirty) return;
		_canvasDirty = false;

		if(self.loopy.mode===Loopy.MODE_PLAY && loopy.cameraMode===0){
			self.smoothCameraMove(self.getBounds()); // 0.1
		}
		if(self.loopy.mode===Loopy.MODE_PLAY && loopy.cameraMode===1){
			const bounds = self.getSignalsBounds();
			if(bounds.strict.weight>0) {
				bounds.large.cx = bounds.strict.cx;
				bounds.large.cy = bounds.strict.cy;
				bounds.large.weight = bounds.strict.weight;
				delete bounds.strict.cx;
				delete bounds.strict.cy;
				delete bounds.strict.weight;
				self.smoothCameraMove(bounds.large,bounds.strict); // 0.1
			}
			else self.smoothCameraMove(self.getBounds()); //0.02
		}

		// Clear!
		ctx.clearRect(0,0,self.canvas.width,self.canvas.height);

		// Translate
		ctx.save();
		applyZoomTransform(ctx);

		// Draw edges THEN nodes THEN labels.
		// Labels (free-text blurbs) render LAST so their text sits on the
		// front layer, on top of nodes and edges, and stays readable.
		for(let i=0;i<self.edges.length;i++) self.edges[i].draw(ctx);
		for(let i=0;i<self.nodes.length;i++) self.nodes[i].draw(ctx);
		for(let i=0;i<self.labels.length;i++) self.labels[i].draw(ctx);

		// Restore
		ctx.restore();

	};



	//////////////////
	// import Model //
	//////////////////


	self.importModel = (newModel, mergeWithCurrent= false)=>{
		if(mergeWithCurrent) newModel = bumpIdsToAvoidMergeCollision(newModel);
		else self.clear();

		if(newModel.bibliography) {
			loopy.bibliography = newModel.bibliography;
			publish("bibliography/changed");
		}

		for(let key in newModel.globals)loopy[key] = newModel.globals[key];
		if(loopy.embed) loopy.embedded = 1;
		applyInitialPropEffects(loopy);
		// refresh sidebar
		const globalEditPage = loopy.sidebar.pages[3];
		injectPropsLabelInSideBar(globalEditPage,objTypeToTypeIndex("loopy"));

		// import entities data.
		newModel.nodes.forEach((n)=>self.addNode(n));
		newModel.edges.forEach((n)=>self.addEdge(n));
		newModel.labels.forEach((n)=>self.addLabel(n));
		//newModel.groups.forEach((n,i)=>self.addGroup(n));

		// Declutter text on import: uniformly expand the whole diagram just
		// enough to give node names and edge labels room (a similar figure, so
		// the system's relative dynamics are preserved), then let free labels
		// resist each other into the gaps.
		self.autoLayout();

		setTimeout(()=>{
			const need = self.getBounds();
			const available = document.getElementById("canvasses");
			if(need.left<0 || need.top<0 || need.right>available.clientWidth || need.bottom>available.clientHeight) self.center(true);
			else self.center(false);
		},0); // do it when loopy is fully load, else it's sheety
	}

	self.clear = function(){

		// Just kill ALL nodes.
		while(self.nodes.length>0){
			self.nodes[0].kill();
		}

		// Just kill ALL labels.
		while(self.labels.length>0){
			self.labels[0].kill();
		}
	};


	////////////////////
	// HELPER METHODS //
	////////////////////

	self.getNodeByPoint = function(x,y,buffer){
		//var result;
		for(let i=self.nodes.length-1; i>=0; i--){ // top-down
			const node = self.nodes[i];
			if(node.isPointInNode(x,y,buffer)) return node;
		}
		return null;
	};

	//self.getEdgeByPoint = function(x, y, wholeArrow){
	self.getEdgeByPoint = function(x, y){
		// TODO: wholeArrow option?
		//var result;
		for(let i=self.edges.length-1; i>=0; i--){ // top-down
			const edge = self.edges[i];
			if(edge.isPointOnLabel(x,y)) return edge;
		}
		return null;
	};

	self.getLabelByPoint = function(x, y){
		//var result;
		for(let i=self.labels.length-1; i>=0; i--){ // top-down
			const label = self.labels[i];
			if(label.isPointInLabel(x,y)) return label;
		}
		return null;
	};

	// Click to edit!
	subscribe("mouseclick",function(){

		// ONLY WHEN EDITING (and NOT erase)
		if(self.loopy.mode!==Loopy.MODE_EDIT) return;
		if(self.loopy.tool===Loopy.TOOL_ERASE) return;

		// Placing a leader-line target? The next click sets the blurb's arrow
		// to wherever you clicked, then we drop back to normal.
		if(loopy.pendingLeaderTarget != null){
			const lbl = loopy.pendingLeaderTarget;
			lbl.leader = 1;
			lbl.arrowX = Math.round(Mouse.x);
			lbl.arrowY = Math.round(Mouse.y);
			loopy.pendingLeaderTarget = null;
			publish("model/changed");
			publish("leader_target/set");
			return;
		}

		// Shift+click while a citation/note is pending → place it on the nearest edge
		if(Mouse.shift && loopy.pendingEdgeLabel != null){
			// Try label area first, then fall back to nearest edge midpoint
			let target = self.getEdgeByPoint(Mouse.x, Mouse.y);
			if(!target){
				let best = Infinity;
				self.edges.forEach(edge => {
					const mb = edge.getBoundingBox();
					const cx = (mb.left+mb.right)/2, cy = (mb.top+mb.bottom)/2;
					const d = (cx-Mouse.x)**2 + (cy-Mouse.y)**2;
					if(d < best){ best = d; target = edge; }
				});
			}
			if(target){
				target.customLabel = loopy.pendingEdgeLabel;
				loopy.pendingEdgeLabel = null;
				publish("pending_edge_label/cleared");
				publish("model/changed");
				return;
			}
		}

		// Did you click on a node? If so, edit THAT node.
		const clickedNode = self.getNodeByPoint(Mouse.x, Mouse.y);
		if(clickedNode){
			loopy.sidebar.edit(clickedNode);
			return;
		}

		// Did you click on a label? If so, edit THAT label.
		const clickedLabel = self.getLabelByPoint(Mouse.x, Mouse.y);
		if(clickedLabel){
			loopy.sidebar.edit(clickedLabel);
			return;
		}

		// Did you click on an edge label? If so, edit THAT edge.
		const clickedEdge = self.getEdgeByPoint(Mouse.x, Mouse.y);
		if(clickedEdge){
			loopy.sidebar.edit(clickedEdge);
			return;
		}

		// If the tool LABEL? If so, TRY TO CREATE LABEL.
		if(self.loopy.tool===Loopy.TOOL_LABEL){
			loopy.label.tryMakingLabel();
			return;
		}

		// Otherwise, go to main Edit page.
		loopy.sidebar.showPage("Edit");

	});
	subscribe("mousewheel",function(mouse){
		// ONLY WHEN EDITING (or MODE_PLAY in freeCam)
		if(self.loopy.mode===Loopy.MODE_EDIT || (self.loopy.mode===Loopy.MODE_PLAY && loopy.cameraMode===2)){
			const oldOffsetScale = loopy.offsetScale;
			if(mouse.wheel<0) loopy.offsetScale*=1.1;
			if(mouse.wheel>0) loopy.offsetScale*=0.9;
			const old_m2M = mouseToMouse(mouse.x,mouse.y,oldOffsetScale,loopy.offsetX,loopy.offsetY);
			const new_m2M = mouseToMouse(mouse.x,mouse.y,loopy.offsetScale,loopy.offsetX,loopy.offsetY);
			loopy.offsetX +=  (new_m2M.x - old_m2M.x);
			loopy.offsetY +=  (new_m2M.y - old_m2M.y);
		}
	});
	// Centering & Scaling
	self.getSignalsBounds = function(includeInstant=true){
		let strictBounds = {};
		let largeBounds = {};
		for(let i=0; i<self.nodes.length; i++){
			const node = self.nodes[i];
			if(node.hidden===true) continue;
			if(!node.aggregate) continue;
			largeBounds = mergeBounds(largeBounds,node.getBoundingBox()); // signal in aggregator
			strictBounds = mergeBounds(strictBounds,node.getBoundingBox()); // signal in aggregator
		} //TODO: handle instant/lightning edges
		for(let i=0; i<self.edges.length; i++){
			const edge = self.edges[i];
			if(edge.hidden===true) continue;
			if(edge.signals.length === 0) continue;
			largeBounds = mergeBounds(largeBounds,edge.getBoundingBox(), edge.from.getBoundingBox(), edge.to.getBoundingBox());
			edge.signals.forEach((s)=>strictBounds = mergeBounds(strictBounds,edge.getSignalBoundingBox(s)));
		}
		return {strict:strictBounds,large:largeBounds};
	};
	// Centering & Scaling
	self.getBounds = function(visible=true){
		// If no nodes & no labels, forget it.
		if(self.nodes.length===0 && self.labels.length===0) return;

		let bounds = {};
		// Get bounds of ALL objects...
		const _testObjects = function(objects){
			for(let i=0; i<objects.length; i++){
				const obj = objects[i];
				if(obj.hide===true) continue;
				bounds = mergeBounds(bounds,obj.getBoundingBox());
			}
		};
		_testObjects(self.nodes);
		_testObjects(self.edges);
		_testObjects(self.labels);
		// Edge bounding boxes cover the arc, not the label text — include the
		// label extents so wide/fanned citation labels aren't clipped by the
		// auto-fit camera.
		for(let i=0; i<self.edges.length; i++){
			if(self.edges[i].hide===true) continue;
			const b = self.edgeLabelBox(self.edges[i]);
			if(b) bounds = mergeBounds(bounds, b);
		}
		return bounds;
	};
	self.fitBounds = function(size){
		const bounds = self.getBounds();
		let addX = 0;
		let addY = 0;
		let ratio = 1;
		if(bounds.left<0) addX -= bounds.left;
		if(bounds.top<0) addY -= bounds.top;
		if(bounds.right>size || bounds.right-bounds.left>size){
			addX -= bounds.left;
			ratio = Math.min(ratio,size/(bounds.right-bounds.left));
		}
		if(bounds.bottom>size || bounds.bottom-bounds.top>size){
			addY -= bounds.top;
			ratio = Math.min(ratio,size/(bounds.bottom-bounds.top));
		}
		self.nodes.forEach(n=>{n.x = (n.x+addX)*ratio;n.y = (n.y+addY)*ratio});
		self.labels.forEach(n=>{n.x = (n.x+addX)*ratio;n.y = (n.y+addY)*ratio});
		//self.groups.forEach(n=>{n.x = (n.x+addX)*ratio;n.y = (n.y+addY)*ratio});
	};
	function offsetToBounds(offset,fitBounds){
		const calc = (side,oppositeSide,offset,scale)=>{
			const c = (fitBounds[side]+fitBounds[oppositeSide])/2;
			const sideDelta = fitBounds[side]-c;
			return sideDelta/scale+c-offset-_PADDING/2;
		}
		return {
			left: calc("left","right",offset.offsetX,offset.offsetScale),
			right: calc("right","left",offset.offsetX,offset.offsetScale),
			top: calc("top","bottom",offset.offsetY,offset.offsetScale),
			bottom: calc("bottom","top",offset.offsetY,offset.offsetScale),
		}
	}

	self.smoothCameraMove = function(targetBounds,mustKeepInRangeBounds={},speedSetting = new SpeedSettings(),extraPadding=0){
		const old = {offsetScale:loopy.offsetScale, offsetX:loopy.offsetX,offsetY:loopy.offsetY};
		if(!self.olderOffset) self.olderOffset = old;
		const fitBounds = fitToBounds();
		/**
		 * on tente de centrer sur le cx/cy du target
		 * si le targetbounds n'est pas entièrement inclu dans ce cadrage, on ajoute ce qui manque en maintenant le centre.
		 * Avec ça, on a notre cadrage idéal au quel on applique le ratio de vitesse.
		 *
		 * avec le cadrage pondéré vitesse, on regarde s'il y a un centre strict.
		 * Si oui, on recentre et on étend au cadrage strict à partir de l'actuel, en maintenant le centre.
		 * Si non, on étend au cadrage strict si nécessaire
		 * //NOP enfin, on élargie le cadrage d'extraPadding (en % si entre 0 et 1, en absolu si >1)
		 *
		 * C'est bon, adjugé !
		 */

		let targetOffset;
		if(targetBounds.weight) targetOffset = scaleTo(targetBounds,fitBounds,true);
		else targetOffset = scaleTo(targetBounds,fitBounds);

		const calcDelta = (offsetType,speedType)=>{
			let oldDelta = old[offsetType]-self.olderOffset[offsetType];
			const fullDelta = targetOffset[offsetType]-old[offsetType];
			if(offsetType=== "offsetScale" && Math.abs(fullDelta)<0.001) return 0;
			if(offsetType=== "offsetScale" && Math.abs(oldDelta)<0.001) oldDelta = fullDelta>0?0.001:-0.001;
			const idealDelta = fullDelta*speedType.speedMaxPercent;
			let delta = idealDelta;
			delta = oldDelta*speedType.inertia + delta*(1-speedType.inertia);
			if(oldDelta>0){
				if(oldDelta+oldDelta*speedType.accelerationMax<delta) delta = oldDelta+oldDelta*speedType.accelerationMax;
				if(oldDelta-oldDelta*speedType.accelerationMax>delta) delta = oldDelta-oldDelta*speedType.accelerationMax;
			} else {
				if(oldDelta-oldDelta*speedType.accelerationMax<delta) delta = oldDelta-oldDelta*speedType.accelerationMax;
				if(oldDelta+oldDelta*speedType.accelerationMax>delta) delta = oldDelta+oldDelta*speedType.accelerationMax;
			}
			if(offsetType!== "offsetScale" && Math.abs(idealDelta)>1 && Math.abs(delta)<1) delta = idealDelta>0?1:-1;
			if(offsetType!== "offsetScale" && Math.abs(fullDelta)<_PADDING/4) delta = 0;
			return delta;
		}
		let instantTargetOffset = {
			offsetX: old.offsetX + calcDelta("offsetX",speedSetting.translate),
			offsetY: old.offsetY + calcDelta("offsetY",speedSetting.translate),
			offsetScale: Math.abs(old.offsetScale + calcDelta("offsetScale",targetOffset.offsetScale>old.offsetScale?speedSetting.zoomIn:speedSetting.zoomOut)),
		}
		const instantTarget = offsetToBounds(instantTargetOffset, fitBounds);
		// Does this include strict bounds ?
		// if not, include them
		let strictOffset;
		if(mustKeepInRangeBounds.weight) strictOffset = scaleTo(mustKeepInRangeBounds,fitBounds,true);
		else strictOffset = scaleTo(mustKeepInRangeBounds,fitBounds);
		const strictBounds = offsetToBounds(strictOffset,fitBounds);
		const mergedBounds = mergeBounds(strictBounds,instantTarget);
		let mergedOffset;
		if(mustKeepInRangeBounds.weight){
			mergedBounds.cx = mustKeepInRangeBounds.cx;
			mergedBounds.cy = mustKeepInRangeBounds.cy;
			mergedBounds.weight = mustKeepInRangeBounds.weight;
			mergedOffset = scaleTo(mergedBounds,fitBounds,true);
		} else mergedOffset = scaleTo(mergedBounds,fitBounds);

		loopy.offsetX = mergedOffset.offsetX;
		loopy.offsetY = mergedOffset.offsetY;
		loopy.offsetScale = mergedOffset.offsetScale;
		self.olderOffset = old;
	}
	self.center = function(andScale){

		// If no nodes & no labels, forget it.
		if(self.nodes.length===0 && self.labels.length===0) return;

		// Get bounds of ALL objects...
		const bounds = self.getBounds();
		const left = bounds.left;
		const top = bounds.top;
		const right = bounds.right;
		const bottom = bounds.bottom;

		// Re-center!
		const canvasses = document.getElementById("canvasses");
		const fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
		const fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
		const cx = (left+right)/2;
		const cy = (top+bottom)/2;
		loopy.offsetX = (_PADDING+fitWidth)/2 - cx;
		loopy.offsetY = (_PADDING+fitHeight)/2 - cy;

		// SCALE.
		if(andScale){

			const w = right-left;
			const h = bottom-top;

			// Wider or taller than screen?
			const modelRatio = w/h;
			const screenRatio = fitWidth/fitHeight;
			let scaleRatio;
			if(modelRatio > screenRatio){
				// wider...
				scaleRatio = fitWidth/w;
			}else{
				// taller...
				scaleRatio = fitHeight/h;
			}

			// Loopy, then!
			loopy.offsetScale = scaleRatio;

		}

	};

}
function offsetToRealOffset(scale,offsetX,offsetY) {
	const canvasses = document.getElementById("canvasses");
	const CW = canvasses.clientWidth - _PADDING - _PADDING;
	const CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
	//const tx = offsetX*2*scale + canvasses.clientWidth*(1 - scale) - _PADDING*(2 + scale)
	let translateX = offsetX*2;
	let translateY = offsetY*2;
	translateX -= CW+_PADDING;
	translateY -= CH+_PADDING;
	translateX = scale*translateX;
	translateY = scale*translateY;
	translateX += CW+_PADDING;
	translateY += CH+_PADDING;
	if(loopy.embedded){
		translateX += _PADDING; // dunno why but this is needed
		translateY += _PADDING; // dunno why but this is needed
	}
	return {scale,translateX,translateY};
}
function applyZoomTransform(ctx){
	// Translate to center, (translate, scale, translate) to expand to size
	const real = offsetToRealOffset(loopy.offsetScale,loopy.offsetX,loopy.offsetY);
	//console.log(tx, ty);
	ctx.setTransform(real.scale, 0, 0, real.scale, real.translateX, real.translateY);

}
// camera misc
function fitToBounds() {
	const canvasses = document.getElementById("canvasses");
	const fitWidth = canvasses.clientWidth - _PADDING - _PADDING;
	const fitHeight = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;
	return {
		left:  _PADDING,
		top:   _PADDING,
		right: fitWidth+_PADDING,
		bottom:fitHeight+_PADDING,
		cx:    (_PADDING+fitWidth)/2,
		cy:    (_PADDING+fitHeight)/2,
	}
}
function calcWidthHeight(bounds) {
	bounds.width = bounds.right-bounds.left;
	bounds.height = bounds.bottom-bounds.top;
}
function calcCenteredWidthHeight(bounds) {
	if(typeof bounds.cx === "undefined" || typeof bounds.cy === "undefined"){
		bounds.cx = (bounds.right+bounds.left)/2;
		bounds.cy = (bounds.bottom+bounds.top)/2;
	}
	bounds.width = 2*Math.max(bounds.right-bounds.cx,bounds.cx-bounds.left);
	bounds.height = 2*Math.max(bounds.bottom-bounds.cy,bounds.cy-bounds.top);
}
function scaleTo(makeTheseBounds,fitInTheseBounds,alignCenter=false){
	let scaleRatio;
	calcWidthHeight(fitInTheseBounds);
	if(alignCenter) calcCenteredWidthHeight(makeTheseBounds);
	else calcWidthHeight(makeTheseBounds);
	scaleRatio = Math.min(fitInTheseBounds.width/makeTheseBounds.width,fitInTheseBounds.height/makeTheseBounds.height);
	const cx = (makeTheseBounds.right+makeTheseBounds.left)/2;
	const cy = (makeTheseBounds.bottom+makeTheseBounds.top)/2;
	return {
		offsetX: fitInTheseBounds.cx - cx,
		offsetY: fitInTheseBounds.cy - cy,
		offsetScale: scaleRatio
	}
}
function SpeedSettings(){
	const self = this;
	self.translate = {
		inertia:0.8,
		speedMaxPercent:0.05,
		accelerationMax: 2,
	};
	self.zoomIn = {
		inertia:0.8,
		speedMaxPercent:0.03,
		accelerationMax: 0.2,
	};
	self.zoomOut = {
		inertia:0.8,
		speedMaxPercent:0.05,
		accelerationMax: 2.5,
	};
	return self;
}
