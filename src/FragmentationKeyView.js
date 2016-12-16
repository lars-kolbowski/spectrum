//		a spectrum viewer
//
//      Copyright  2015 Rappsilber Laboratory, Edinburgh University
//
// 		Licensed under the Apache License, Version 2.0 (the "License");
// 		you may not use this file except in compliance with the License.
// 		You may obtain a copy of the License at
//
// 		http://www.apache.org/licenses/LICENSE-2.0
//
//   	Unless required by applicable law or agreed to in writing, software
//   	distributed under the License is distributed on an "AS IS" BASIS,
//   	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   	See the License for the specific language governing permissions and
//   	limitations under the License.
//
//		authors: Sven Giese, Colin Combe, Lars Kolbowski
//
//
//		PeptideFragmentationKeyView.js
var FragmentationKeyView = Backbone.View.extend({

	// events : {
	// 	'click #clearHighlights' : 'clearHighlights',
	// },

	initialize: function() {
		this.svg = d3.select(this.el.getElementsByTagName("svg")[0]);//d3.select(this.el).append("svg").style("width", "100%").style("height", "100%");
		this.fragKeyWrapper = this.svg.append("g");


		//this.model = model;
		this.margin = {
			"top":    20,
			"right":  20,
			"bottom": 40,
			"left":   40
		};
		this.highlights = this.fragKeyWrapper.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
		this.g =  this.fragKeyWrapper.append("g").attr("class", "fragKey").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
		this.listenTo(this.model, 'changed:Highlights', this.updateHighlights);
		this.listenTo(this.model, 'changed:ColorScheme', this.updateColors);
		this.listenTo(window, 'resize', _.debounce(this.resize));


	},

	render: function() {
		this.clear();
		if (this.model.JSONdata)
			this.setData();
		this.resize();
	},

	setData: function(){

		var self = this;

		var pepCount = self.model.peptides.length;
		this.linkPos = self.model.JSONdata.LinkSite;
		this.changeCL = false;
		this.changeMod = false;
		this.pepModsArray = [];
		this.peptideStrs = self.model.pepStrs;	//contains the aa sequences of the peptides in string form without modifications
		var fragments = self.model.JSONdata.fragments;
		this.annotations = [];
		this.peptides = [];
		for (var i = 0; i < this.peptideStrs.length; i++) {
			this.peptides[i] = this.peptideStrs[i];
		};
	    this.pepLetters = [];
	    this.pepLetterHighlights = [];
		this.modLetters = [];
		this.modLetterHighlights = [];
		this.pepoffset = [0,0];
		for(p=0; p < pepCount; p++){
			this.annotations[p] = [];
			for (var i = 0; i < self.model.peptides[p].sequence.length; i++) {
			var ions = {
				b : [],
				y : []
			};
				this.annotations[p].push(ions);
			};
			this.pepLetters[p] = [];
			this.modLetters[p] = [];
			this.pepLetterHighlights[p] = [];
			this.modLetterHighlights[p] = [];
			this.pepModsArray[p] = [];
			for(i = 0; i < self.model.peptides[p].sequence.length; i++){
				if (self.model.peptides[p].sequence[i].Modification != "")
					this.pepModsArray[p][i] = self.model.peptides[p].sequence[i].Modification;
			}
		}

		this.tooltip = d3.select(this.el).append("span")
			.html("Click to change cross-linker position")
			.style("font-size", "small")
			//.style("height", "20px")
			.style("padding", "0 5px")
			.style("border-radius", "6px")		
			.attr("class", "tooltip")
			.style("background-color", "black")
			.style("pointer-events", "none")
			.style("position", "absolute")				
			.style("opacity", 0);


		this.align_peptides_to_CL();


		/*
	    #==========================================================================
	    #  FRAGMENTATION KEY STARTS HERE
	    #==========================================================================
		*/


	    this.xStep = 22;

	    // the letters
	    this.drawPeptides();
		// this.drawPeptide( 0, 20, 5);
		// if(this.peptides[1])
			//this.drawPeptide( 1, 71, 83);


		//CL line svg elements
		if(this.linkPos.length > 0){
			var CLpos = this.linkPos[0].linkSite+1;
			if (this.linkPos[1].linkSite > this.linkPos[0].linkSite)
				CLpos = this.linkPos[1].linkSite+1;
			this.CL = this.g.append("g");
			//highlight
			this.CLlineHighlight = this.CL.append("line")
				.attr("x1", this.xStep * (CLpos - 1))
				.attr("y1", 25)
				.attr("x2", this.xStep * (CLpos - 1))
				.attr("y2", 55)
				.attr("stroke", self.model.highlightColour)
				.attr("stroke-width", 10)
				.attr("opacity", 0)
				.style("cursor", "pointer");
			// the the link line
			this.CLline = this.CL.append("line")
				.attr("x1", this.xStep * (CLpos - 1))
				.attr("y1", 25)
				.attr("x2", this.xStep * (CLpos - 1))
				.attr("y2", 55)
				.attr("stroke", "black")
				.attr("stroke-width", 1.5)
				.style("cursor", "pointer");

			this.CL.on("mouseover", function() {
				if (!self.changeMod  && !self.changeCL){
					self.CLlineHighlight.attr("opacity", 0.8);

					self.tooltip.transition()		
					    .duration(200)		
					    .style("opacity", .9);		
					self.tooltip.style("left", (d3.event.layerX + 15) + "px")		
					    .style("top", (d3.event.layerY) + "px");	
				}
			});

			this.CL.on("mouseout", function() {
				if (!self.changeMod  && !self.changeCL){
					self.CLlineHighlight.attr("opacity", 0);
					self.tooltip.transition()		
						.duration(500)		
						.style("opacity", 0);	
					}
			});

			this.CL.on("click", function() {
				if (!self.changeMod){
					self.tooltip.style("opacity", 0);
					self.CLlineHighlight.attr("opacity", 1);
					self.changeCL = self.linkPos;
					for (var i = 0; i < self.fraglines.length; i++) {
						self.fraglines[i].disableCursor();
					}
				}
			});
			//line for changing
			this.changeCLline = this.g.append("line")
				.attr("x1", this.xStep * (CLpos - 1))
				.attr("y1", 25)
				.attr("x2", this.xStep * (CLpos - 1))
				.attr("y2", 55)
				.attr("stroke", "black")
				.attr("stroke-width", 1.5)
				.attr("opacity", 0)
				.style("cursor", "pointer");

		}

		//change-mod svg element
	    this.changeModLetter = this.g.append("text")
	    	.attr("text-anchor", "middle")
			.style("font-size", "0.7em")
			.style("cursor", "default");

		this.fraglines = new Array();
		var self = this;

		if(fragments !== undefined){
			for (var i = 0; i < fragments.length; i++) {
				for (var r = 0; r < fragments[i].range.length; r++) {
					var pepId = fragments[i].range[r].peptideId;
					if (fragments[i].range[r].from != 0) //N-terminal fragment
						this.annotations[pepId][fragments[i].range[r].from-1].y.push(fragments[i]);
					if (fragments[i].range[r].to != this.peptideStrs[pepId].length-1) //C-terminal fragment
						this.annotations[pepId][fragments[i].range[r].to].b.push(fragments[i]);
				}
			};
			console.log(this.annotations);

		    this.drawFragmentationEvents(0);
			if(this.peptides[1])	
				this.drawFragmentationEvents(1);	
		}

	    this.drawFragmentationEvents(0);
		if(this.peptides[1])	
			this.drawFragmentationEvents(1);	

		//changeInfo
		//ToDo: make cleaner
		if(this.model.match !== undefined){
			if (this.model.match.oldLinkPos !== undefined){
			    var linkPos = [];
			    for (var i = 0; i < this.peptides.length; i++) {
			    	linkPos.push(this.model.match.oldLinkPos[i])
			    	var j = 0;
			    	while(this.peptides[i][j] == "#") {
			    			linkPos[i] += 1
			    			j++;
			    	}
			    }
			    this.origCL = this.g.append("g");
			    this.origCLHighlight = this.origCL.append("line")
					.attr("x1", this.xStep * (linkPos[0] - 1))
					.attr("y1", 25)
					.attr("x2", this.xStep * (linkPos[1] - 1))
					.attr("y2", 55)
					.attr("stroke", this.model.highlightColour)
					.attr("stroke-width", 5)
					.attr("opacity", 0)
					.style("cursor", "pointer");
			    this.origCLline = this.origCL.append("line")
					.attr("x1", this.xStep * (linkPos[0] - 1))
					.attr("y1", 25)
					.attr("x2", this.xStep * (linkPos[1] - 1))
					.attr("y2", 55)
					.attr("stroke", "lightgrey")
					.attr("opacity", 1)
					.style("cursor", "pointer");
				this.origCL.on("mouseover", function(){
					self.origCLHighlight.attr("opacity", 1);
				});
				this.origCL.on("mouseout", function(){
					self.origCLHighlight.attr("opacity", 0);
				});
				this.origCL.on("click", function(){
					self.model.changeLinkPos([self.model.match.oldLinkPos[0], self.model.match.oldLinkPos[1]]);
				});
				// //get position
				// var x = 0
				// for (var i = 0; i < this.pepLetters.length; i++) {
				// 		if(parseInt(this.pepLetters[i][this.pepLetters[i].length-1][0][0].getAttribute("x")) > x)
				// 			x = parseInt(this.pepLetters[i][this.pepLetters[i].length-1][0][0].getAttribute("x"));
				// }
				// this.changeInfo = this.g.append('g');
				// var scoreInfo = this.changeInfo.append('text')
				// 	.text("link was changed")
				// 	.attr("x", x+20);
			}
		}

	},

	align_peptides_to_CL: function(){
		if (this.linkPos.length > 0){
			function arrayOfHashes(n){
				var arr = [];
				for (var a = 0; a < n; a++) {arr.push("#")}
				return arr;
			}
		    // #==========================================================================
		    // #    account for crosslink shift
		    // #    this alings the peptide sequences at the cross-link site
		    // #==========================================================================
		    var shift = this.linkPos[0].linkSite - this.linkPos[1].linkSite;
		    var spaceArray = arrayOfHashes(Math.abs(shift));
		    if  (shift <= 0) {
		        this.peptides[0] = Array(Math.abs(shift) + 1).join("#") + this.peptideStrs[0];
		        this.pepoffset[0] = Math.abs(shift) - 0;
		    }
		    else {
		        this.peptides[1] = Array(shift + 1).join("#") + this.peptideStrs[1];
		        this.pepoffset[1] = shift - 0;
			}

		    var diff = this.peptideStrs[0].length - this.peptideStrs[1].length;
		    spaceArray = arrayOfHashes(Math.abs(diff));
		    if (diff <= 0) {
		        this.peptides[0] = this.peptides[0] + Array(Math.abs(diff) + 1).join("#");
			}
		    else {
		        this.peptides[1] = this.peptides[1] + Array(diff + 1).join("#");
			}
		}
	},

	drawFragmentationEvents: function(pepIndex){
		for (var i = 0; i < this.annotations[pepIndex].length; i++){
			var frag = this.annotations[pepIndex][i];
			if (frag.b.length != 0 || frag.y.length != 0) {
				//var x = (this.xStep * i) + (this.xStep / 2);
				this.fraglines.push(new KeyFragment(frag, i, this.pepoffset[pepIndex], pepIndex, this));
			}
		}
	},


	drawPeptides: function(){

		var self = this;

		var peptides = [
			{sequence: this.peptides[0], color: this.model.p1color, y: [20, 5], group: self.g.append('g').attr('class', 'peptide')},
		];
		if(this.peptides.length > 1)
			peptides.push({sequence: this.peptides[1], color: this.model.p2color, y: [71, 83], group: self.g.append('g').attr('class', 'peptide')})

		var pepIndex = 0;
		peptides.forEach(function(pep){
			
			var pep_data = []
			var pos = 0;
			for (var i = 0; i < pep.sequence.length; i++) {
				pep_data.push({aminoAcid: pep.sequence[i], pepIndex: pepIndex, pos: pos})
				if (pep.sequence[i] != "#")
					pos++;
			}

			var pepLettersG = pep.group.selectAll("g.pepLetterG").data (pep_data);

			var pepLetterG = pepLettersG.enter()
				.append('g')
				.attr('class', "pepLetterG")
				.on("click", function(d, i) {
					if(self.changeCL != false){
						changeCrossLink(d);
					}
					//if changeMod is active and the mod is from the same peptide and it's a valid modification for this aa
					if(self.changeMod !== false && self.validModChange && d.pepIndex == self.changeMod.pepIndex){	
						changeMod(d);
					}
				})
				.on("mouseover", function(d, i) {
					if(self.changeMod !== false && d.pepIndex == self.changeMod.pepIndex){	//if changeMod is active and the mod is from the same peptide
						var pepLetterHighlight = this.childNodes[0];
						pepLetterHighlight.setAttribute("opacity", 1);
						
						var offset = self.pepoffset[d.pepIndex];
						var highlight = self.modLetterHighlights[d.pepIndex][0][self.changeMod.pos-offset];
						var oldModLetters = self.modLetters[d.pepIndex][0][self.changeMod.pos-offset]
						var x = parseInt(this.childNodes[0].getAttribute("x"));
						var y = parseInt(oldModLetters.getAttribute("y"));
						//var modtext = oldModLetters.innerHTML;


						//check if it is a valid modification change
						if (self.model.checkForValidModification(self.changeMod.mod, d.aminoAcid)){
							self.validModChange = true;
						}
						else{
							self.validModChange = false;
							this.childNodes[0].setAttribute("style", "cursor:not-allowed");
							this.childNodes[1].setAttribute("style", "cursor:not-allowed");
						}
						//
						if (self.changeMod.pepIndex == 0)
							var color = self.model.p1color;
						else if (self.changeMod.pepIndex == 1)
							var color = self.model.p2color;
						oldModLetters.setAttribute("fill", "grey");
						highlight.setAttribute("x", x);
						highlight.setAttribute("y", y+1);
						highlight.setAttribute("opacity", 1)
						self.changeModLetter.attr("x", x)
							.text(self.changeMod.mod)
							.attr("y", y)
							.attr("fill", color)
							.attr("opacity", 1);	
					}

					if(self.changeCL != false){
						var pepLetterHighlight = this.childNodes[0];
						var pepLetter = this.childNodes[1];
							//set opacity of all letters of this highlight to zero
							for (var i = 0; i < self.pepLetterHighlights[d.pepIndex][0].length; i++) {
								if(typeof(self.pepLetterHighlights[d.pepIndex][0][i]) !== "undefined")
									self.pepLetterHighlights[d.pepIndex][0][i].setAttribute("opacity", 0);
							}
							
							self.CLline.attr("stroke", "grey");
							// update changeCL to the currently highlighted ones
							for (var i = 0; i < self.changeCL.length; i++) {
								if(self.changeCL[i].peptideId == d.pepIndex)
									self.changeCL[i].linkSite = d.pos;
							}						
							if (d.pepIndex == 0){		//pep1
								self.changeCLline
									.attr("x1", pepLetterHighlight.getAttribute("x"))
									.attr("opacity", 1);
								self.CLlineHighlight.attr("x1", pepLetterHighlight.getAttribute("x"));
							}
							else if (d.pepIndex == 1){
						 		self.changeCLline
						 			.attr("x2", pepLetterHighlight.getAttribute("x"))
						 			.attr("opacity", 1);
								self.CLlineHighlight.attr("x2", pepLetterHighlight.getAttribute("x"));
							}
						pepLetterHighlight.setAttribute("opacity", 1);
					}		
				})
				.on("mouseout", function(d) {
					var offset = self.pepoffset[d.pepIndex];
					if(self.changeMod !== false && d.pepIndex == self.changeMod.pepIndex){	//if changeMod is active and the mod is from the same peptide
						var pepLetterHighlight = self.pepLetterHighlights[d.pepIndex][0][d.pos+offset];
						var highlight =  self.modLetterHighlights[d.pepIndex][0][self.changeMod.pos-offset];
						pepLetterHighlight.setAttribute("opacity", 0);
						self.changeModLetter.attr("opacity", 0);
						highlight.setAttribute("opacity", 0);
					}
				})
			;
			pepLetterG.append("text")
				.attr("x", function(d, i){ 
					return self.xStep * i;
				})
				.attr("y", pep.y[0])
				.attr("text-anchor", "middle")
				.attr("fill", pep.color)
				.attr("class", 'pepLetterHighlight')
				.attr("stroke-width", "2px")
				.attr("stroke", self.model.highlightColour)
				.attr("opacity", 0)
				.style("cursor", "default")
				.text(function(d) {
					if (d.aminoAcid != "#")
						return d.aminoAcid;
				})
			;				
			pepLetterG.append("text")
				.attr("x", function(d, i){ 
					return self.xStep * i;
				})
				.attr("y", pep.y[0])
				.attr("text-anchor", "middle")
				.attr("fill", pep.color)
				.attr("class", 'pepLetter')
				.style("cursor", "default")
				.text(function(d) {
					if (d.aminoAcid != "#")
						return d.aminoAcid;
				})
			;

			function changeCrossLink(d){
				//self.linkPos[d.pepIndex].linkSite = d.pos; not necessary pos is already updated through mouseover
				var newlinkpos = new Array(self.linkPos[0].linkSite+1, self.linkPos[1].linkSite+1);
				self.model.changeLinkPos(newlinkpos);
			}

			function changeMod(d){
				var offset = self.pepoffset[d.pepIndex]
				var oldPos = self.changeMod.pos-offset;
				var newPos = d.pos;
				self.model.changeMod(oldPos, newPos, d.pepIndex);
			}

			//mods
			var mod_data = []

			for (var i = 0; i < self.pepModsArray[pepIndex].length; i++) {
				for (var shift = 0; shift < pep.sequence.length; shift++) {
					if (pep.sequence[shift] != "#")
						break;
				}
				mod_data.push({mod: self.pepModsArray[pepIndex][i], pepIndex: pepIndex, pos: shift+i})
			}

			var modLettersG = pep.group.selectAll("g.modLetterG").data (mod_data);
			
			var modLetterG = modLettersG.enter()
				.append('g')
				.attr('class', "modLetterG")
				.on("click", function(d) {
					if (self.changeCL == false){
						self.CLline.style("cursor", "not-allowed");
						self.CLlineHighlight.style("cursor", "not-allowed");
						
						var letters = this.childNodes[1];
						var highlight = this.childNodes[0];
						highlight.setAttribute("style","font-size:0.7em; cursor:default;");
						//set changeMod var to the clicked modification
						self.changeMod = d;
						highlight.setAttribute("opacity", 1);
						//disable fragBar cursor
						for (var i = 0; i < self.fraglines.length; i++) {
							self.fraglines[i].disableCursor();
						}
						//enable pepLetter cursor pointer
						self.pepLetters[d.pepIndex].style("cursor", "pointer");
					}
				})
			;
			modLetterG.append("text")
				.attr("x", function(d){ 
					return self.xStep * d.pos;
				})
				.attr("class", "modLetterHighlight")
				.attr("y", pep.y[1])
				.attr("text-anchor", "middle")
				.attr("stroke", self.model.highlightColour)
				.style("font-size", "0.7em")
				.style("cursor", "pointer")
				.text(function(d){ return d.mod; })
				.attr("stroke-width", "2px")
				.attr("opacity", 0)
			;				
			modLetterG.append("text")
				.attr("x", function(d){ 
					return self.xStep * d.pos;
				})
				.attr("class", "modLetter")
				.attr("y", pep.y[1])
				.attr("text-anchor", "middle")
				.attr("fill", pep.color)
				.style("font-size", "0.7em")
				.style("cursor", "pointer")
				.text(function(d){ return d.mod; })
			;

			// var mods = this.pepModsArray[i];
			// //check for what they are needed
			// var pepLetters = this.pepLetters[i];
			// var pepLetterHighlights = this.pepLetterHighlights[i];
			// var modLetters = this.pepModLetters[i];
			// var modLetterHighlights = this.pepModLetterHighlights[i];
			// //
			// var shift = 0;
			self.pepLetterHighlights[pepIndex] = pep.group.selectAll("text.pepLetterHighlight");
			self.pepLetters[pepIndex] = pep.group.selectAll("text.pepLetter");
			self.modLetterHighlights[pepIndex] = pep.group.selectAll("text.modLetterHighlight");
			self.modLetters[pepIndex] = pep.group.selectAll("text.modLetter");
			pepIndex++;

		})


	},


	// drawPeptide: function(pepIndex, y1, y2){
	// 	var self = this;

 //        var makeIdentityID = function (d) {
 //            return d.id;
 //        };

	// 	var pep = this.peptides[pepIndex];
	// 	var mods = this.pepModsArray[pepIndex];
	// 	if (pepIndex == 0)
	// 		var colour = this.model.p1color;
	// 	if (pepIndex == 1)
	// 		var colour = this.model.p2color;		
	// 	var pepLetters = this.pepLetters[pepIndex];
	// 	var pepLetterHighlights = this.pepLetterHighlights[pepIndex];
	// 	var modLetters = this.pepModLetters[pepIndex];
	// 	var modLetterHighlights = this.pepModLetterHighlights[pepIndex];
	// 	//var pepLettersG = this.g.append('g');
	// 	var shift = 0;
	// 			var pepLettersG = this.g.selectAll("g.pepLetterG").data (this.peptides[0], makeIdentityID);
	// 	for (var i = 0; i < pep.length; i++){
	// 		if (pep[i] != "#") {

	// 			var pepLetterG = pepLettersG.enter()
	// 				.append('g')
	// 				.attr('class', "pepLetterG")
	// 			;
	// 			pepLetterHighlights[i] = pepLetterG.append("text")
	// 				.attr("x", this.xStep * i)
	// 				.attr("y", y1)
	// 				.attr("text-anchor", "middle")
	// 				.attr("fill", colour)
	// 				.attr("stroke-width", "2px")
	// 				.attr("stroke", self.model.highlightColour)
	// 				.attr("opacity", 0)
	// 				.style("cursor", "default")
	// 				.text(pep[i]);				
	// 			pepLetters[i] = pepLetterG.append("text")
	// 				.attr("x", this.xStep * i)
	// 				.attr("y", y1)
	// 				.attr("text-anchor", "middle")
	// 				.attr("fill", colour)
	// 				.attr("pos", i-shift)
	// 				.attr("pep", pepIndex)
	// 				.style("cursor", "default")
	// 				.text(pep[i]);
	// 			pepLetterG
	// 				.on("click", function(d) {
	// 					if(self.changeCL){
	// 						for (var pepIndex = 0; pepIndex < self.pepLetterHighlights.length; pepIndex++) {
	// 							var offset = 0;
	// 							for (var j = 0; j < self.pepLetterHighlights[pepIndex].length; j++) {
	// 								if(self.pepLetterHighlights[pepIndex][j] === undefined)
	// 									offset += 1;
	// 								else{
	// 									if(self.pepLetterHighlights[pepIndex][j][0][0].getAttribute("opacity") == "1")
	// 										self.linkPos[pepIndex].linkSite = j-offset;
	// 								}
	// 							}
	// 						}
	// 						var newlinkpos = new Array(self.linkPos[0].linkSite+1, self.linkPos[1].linkSite+1);
	// 						self.model.changeLinkPos(newlinkpos);
	// 					}
	// 					//if changeMod is active and the mod is from the same peptide and it's a valid modification for this aa
	// 					if(self.changeMod !== false && self.validModChange && this.childNodes[1].getAttribute("pep") == self.changeMod[1].getAttribute("pep")){	
	// 						var oldPos = self.changeMod[0].getAttribute('pos');
	// 						var newPos = parseInt(this.childNodes[1].getAttribute("pos"));
	// 						var pepIndex = parseInt(this.childNodes[1].getAttribute("pep"));
	// 						self.model.changeMod(oldPos, newPos, pepIndex);
	// 					}
	// 				})
	// 				.on("mouseover", function() {
	// 					if(self.changeMod !== false && this.childNodes[1].getAttribute("pep") == self.changeMod[1].getAttribute("pep")){	//if changeMod is active and the mod is from the same peptide
	// 						var pepLetterHighlight = this.childNodes[0];
	// 						pepLetterHighlight.setAttribute("opacity", 1);
	// 						var highlight = self.changeMod[0];
	// 						var oldModLetters = self.changeMod[1];
	// 						var x = parseInt(this.childNodes[0].getAttribute("x"));
	// 						var y = parseInt(oldModLetters.getAttribute("y"));
	// 						var modtext = oldModLetters.innerHTML;
	// 						var aminoAcid = this.childNodes[1].innerHTML;
	// 						//check if it is a valid modification change
	// 						if (self.model.checkForValidModification(modtext, aminoAcid)){
	// 							self.validModChange = true;
	// 						}
	// 						else{
	// 							self.validModChange = false;
	// 							this.childNodes[0].setAttribute("style", "cursor:not-allowed");
	// 							this.childNodes[1].setAttribute("style", "cursor:not-allowed");
	// 						}
	// 						//
	// 						if (oldModLetters.getAttribute("pep") == 0)
	// 							var colour = self.model.p1color;
	// 						else if (oldModLetters.getAttribute("pep") == 1)
	// 							var colour = self.model.p2color;
	// 						oldModLetters.setAttribute("fill", "grey");
	// 						highlight.setAttribute("x", x);
	// 						highlight.setAttribute("y", y+1);
	// 						highlight.setAttribute("opacity", 1)
	// 						self.changeModLetter.attr("x", x)
	// 							.text(modtext)
	// 							.attr("y", y)
	// 							.attr("fill", colour)
	// 							.attr("opacity", 1);	
	// 					}

	// 					if(self.changeCL){
	// 						var pepLetterHighlight = this.childNodes[0];
	// 						var pepLetter = this.childNodes[1];
	// 						if (pepLetter.getAttribute("pep") == 0){		//pep1
	// 							//set opacity of all letters of this highlight to zero
	// 							for (var i = 0; i < self.pepLetterHighlights[0].length; i++) {
	// 								if(typeof(self.pepLetterHighlights[0][i]) !== "undefined")
	// 									self.pepLetterHighlights[0][i].attr("opacity", 0);
	// 							}
	// 							self.changeCLline.attr("x1", pepLetterHighlight.getAttribute("x"))
	// 								.attr("opacity", 1);
	// 							self.CLline.attr("stroke", "grey");
	// 							self.CLlineHighlight.attr("x1", pepLetterHighlight.getAttribute("x"));
	// 						}
	// 						else{											//pep2
	// 							//set opacity of all letters of this highlight to zero
	// 							for (var i = 0; i < self.pepLetterHighlights[1].length; i++) {
	// 								if(typeof(self.pepLetterHighlights[1][i]) !== "undefined")
	// 									self.pepLetterHighlights[1][i].attr("opacity", 0);
	// 							}								
	// 							self.changeCLline.attr("x2", pepLetterHighlight.getAttribute("x"))
	// 								.attr("opacity", 1);
	// 							self.CLline.attr("stroke", "grey");
	// 							self.CLlineHighlight.attr("x2", pepLetterHighlight.getAttribute("x"));
	// 						}
	// 						pepLetterHighlight.setAttribute("opacity", 1);
	// 					}		
	// 				})
	// 				.on("mouseout", function() {
	// 					if(self.changeMod !== false && this.childNodes[1].getAttribute("pep") == self.changeMod[1].getAttribute("pep")){	//if changeMod is active and the mod is from the same peptide
	// 						var pepLetterHighlight = this.childNodes[0];
	// 						var highlight = self.changeMod[0];
	// 						pepLetterHighlight.setAttribute("opacity", 0);
	// 						self.changeModLetter.attr("opacity", 0);
	// 						highlight.setAttribute("opacity", 0);
	// 					}
	// 				})
	// 			;



	// 			if(mods[i-shift]){
	// 				var modLetterG = pepLettersG.append('g');
	// 				modLetterHighlights[i] = modLetterG.append("text")
	// 					.attr("x", this.xStep * i)
	// 					.attr("y", y2)
	// 					.attr("text-anchor", "middle")
	// 					.attr("stroke", self.model.highlightColour)
	// 					.attr("pep", pepIndex)
	// 					.attr("pos", i-shift)
	// 					.style("font-size", "0.7em")
	// 					.style("cursor", "pointer")
	// 					.text(mods[i-shift])
	// 					.attr("stroke-width", "2px")
	// 					.attr("opacity", 0);				
	// 				modLetters[i] = modLetterG.append("text")
	// 					.attr("x", this.xStep * i)
	// 					.attr("y", y2)
	// 					.attr("text-anchor", "middle")
	// 					.attr("fill", colour)
	// 					.attr("pep", pepIndex)
	// 					.style("font-size", "0.7em")
	// 					.style("cursor", "pointer")
	// 					.text(mods[i-shift]);
	// 				modLetterG.on("click", function() {
	// 					var letters = this.childNodes[1];
	// 					var highlight = this.childNodes[0];
	// 					highlight.setAttribute("style","font-size:0.7em; cursor:default;");
	// 					//set changeMod var to the clicked modification
	// 					self.changeMod = this.childNodes;
	// 					highlight.setAttribute("opacity", 1);
	// 					//disable fragBar cursor
	// 					for (var i = 0; i < self.fraglines.length; i++) {
	// 						self.fraglines[i].disableCursor();
	// 					}
	// 					//enable pepLetter cursor pointer
	// 					i = parseInt(letters.getAttribute("pep"));
	// 					var letterCount = self.pepLetters[i].length;
	// 					for (j = 0; j < letterCount; j++){
	// 						if (self.pepLetters[i][j])
	// 							self.pepLetters[i][j].style("cursor", "pointer");			
	// 					}
	// 				});
	// 			};
	// 		}
	// 		else
	// 			shift++;
	// 	}
	// },

	updateHighlights: function(){

		var lines = this.fraglines;

		for(l = 0; l < lines.length; l++){
			var highlightFragments = _.intersection(lines[l].fragments, this.model.highlights);
			if(highlightFragments.length != 0){
				lines[l].highlight(true, highlightFragments);
			}
			else if(lines[l].fragments.length > 0)
				lines[l].highlight(false);
		}
		if(this.model.highlights.length == 0)
			this.colorLetters("all");

		else if(this.model.highlights.length == 1){
			this.greyLetters();
			this.colorLetters(this.model.highlights);
		}

		else{	
			var color = true;
			for(i = 1; i < this.model.highlights.length; i++){
				if(this.model.highlights[i].range != this.model.highlights[i-1].range)
					color = false;
			}

			//
			var duplicates = function(a) {
			    for(var i = 0; i <= a.length; i++) {
			        for(var j = i; j <= a.length; j++) {
			            if(i != j && a[i] == a[j]) {
			                return true;
			            }
			        }
			    }
			    return false;
			}
			//

			//check for overlap
			var arrays = [[],[]];
			for (var i = 0; i < this.model.highlights.length; i++) {
				for (var r = 0; r < this.model.highlights[i].range.length; r++) {
					var range = [];
					for (var j = this.model.highlights[i].range[r].from; j <= this.model.highlights[i].range[r].to; j++) {
						range.push(j);
					};
					arrays[this.model.highlights[i].range[r].peptideId] = arrays[this.model.highlights[i].range[r].peptideId].concat(range);
				};
			};
			if(!duplicates(arrays[0]) && !duplicates(arrays[1]))
				color = true;
			//
			if (color){
				this.greyLetters();
				this.colorLetters(this.model.highlights);
			}
		}	
	},

	greyLetters: function(){
		for (var i = 0; i < this.pepLetters.length; i++) {
			this.pepLetters[i].attr("fill", this.model.lossFragBarColour);
			this.modLetters[i].attr("fill", this.model.lossFragBarColour);
		}
	},

	colorLetters: function(fragments){
		var self = this;
		if (fragments == "all"){
			color(0, this.model.p1color, 0, this.pepLetters[0][0].length);
			if(this.peptides[1])
				color(1, this.model.p2color, 0, this.pepLetters[1][0].length);			
		}
		else{
			for (var f = 0; f < fragments.length; f++) {
				for (var i = 0; i < fragments[f].range.length; i++){
					if (fragments[f].range[i].peptideId == 0)
						color(0, this.model.p1color, fragments[f].range[i].from, fragments[f].range[i].to+1);
					if (fragments[f].range[i].peptideId == 1)
						color(1, this.model.p2color, fragments[f].range[i].from, fragments[f].range[i].to+1);
				};
			};
		}	

		function color(pep, pepColor, start, end){
			start += self.pepoffset[pep];
			end += self.pepoffset[pep];

			for (var i = start; i < end; i++){
				if (self.pepLetters[pep][0][i])
					self.pepLetters[pep][0][i].setAttribute("fill", pepColor)
				if (self.modLetters[pep][0][i-self.pepoffset[pep]])
					self.modLetters[pep][0][i-self.pepoffset[pep]].setAttribute("fill", pepColor);
			}	
		}
	},

	updateColors: function(){
		var lines = this.fraglines;
		for(l = 0; l < lines.length; l++){
			if (lines[l].peptideId == 0){
				if (lines[l].bText) lines[l].bText.style("fill", this.model.p1color);
				if (lines[l].yText) lines[l].yText.style("fill", this.model.p1color);
			}
			else if (lines[l].peptideId == 1){
				if (lines[l].bText) lines[l].bText.style("fill", this.model.p2color);
				if (lines[l].yText) lines[l].yText.style("fill", this.model.p2color);
			}
		}
		this.colorLetters("all");
	},

	resize: function(){
	    var parentDivWidth = $(this.el).width();
	    var fragKeyWidth = $(".fragKey")[0].getBBox().width;
		if (parentDivWidth < fragKeyWidth+40)
			this.fragKeyWrapper.attr("transform", "scale("+parentDivWidth/(fragKeyWidth+40)+")")
		else
			this.fragKeyWrapper.attr("transform", "scale(1)")
	},

	// clearHighlights: function(){
	// 	for (var f = 0; f < this.fraglines.length; f++) {
	// 		if (_.intersection(this.model.sticky, this.fraglines[f].fragments).length == 0) {
	// 			this.fraglines[f].highlight(false);
	// 		}
	// 	}
	// },

	clear: function(){
		this.pepoffset = [];
		this.linkPos = [];
		this.g.selectAll("*").remove();
		this.highlights.selectAll("*").remove();
	}	

});
