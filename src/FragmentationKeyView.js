//		a spectrum viewer
//
//	  Copyright  2015 Rappsilber Laboratory, Edinburgh University
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
//		FragmentationKeyView.js

//TODO: find a better place for this?
d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

var FragmentationKeyView = Backbone.View.extend({

	initialize: function(viewOptions) {
		var defaultOptions = {
			invert: false,
			hidden: false,
			disabled: false,
			accentuateCLcontainingFragments: false,
		};
		this.options = _.extend(defaultOptions, viewOptions);

		this.margin = {
			"top":	25,
			"right":  25,
			// "bottom": 40,
			"left":   25
		};

		this.svg = d3.select(this.el);
		this.fragKeyWrapper = this.svg.append("g").attr("class", "fragKey").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

		this.xStep = 23;

		this.scaleSvgGroup = this.fragKeyWrapper.append("g").attr("class", "scaleSvgGroup");

		if(this.options.hidden) this.fragKeyWrapper.attr("visibility", "hidden");


		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
		this.listenTo(this.model, 'changed:Highlights', this.updateHighlights);
		this.listenTo(this.model, 'changed:ColorScheme', this.updateColors);
		this.listenTo(this.model, 'change:highlightColor', this.updateColors);
		this.listenTo(window, 'resize', _.debounce(this.resize));
		this.listenTo(xiSPEC.vent, 'resize:spectrum', this.resize);
		this.listenTo(xiSPEC.vent, 'butterflyToggle', this.butterflyToggle);
		this.listenTo(xiSPEC.vent, 'butterflySwap', this.butterflySwap);
		this.listenTo(xiSPEC.vent, 'AccentuateCrossLinkContainingFragments', this.accentuateCLcontainingToggle);

		this.tooltip = d3.select("body").append("span")
			.attr("class", "xispec_tooltip")
		;

	},

	render: function() {

		if(this.options.hidden){
			this.hide();
			return this;
		}
		else{
			this.show();
		}

		this.clear();
		if (this.model.get("JSONdata"))
			this.setData();
		this.resize();
	},

	setData: function(){

		var self = this;

		this.cursor = this.options.disabled ? 'default' : 'pointer';

		var pepCount = self.model.peptides.length;
		this.linkPos = self.model.get("JSONdata").LinkSite;
		this.changeCL = false;
		this.changeMod = false;
		this.pepModsArray = [];
		this.peptideStrs = self.model.pepStrs;	//contains the aa sequences of the peptides in string form without modifications
		var fragments = self.model.fragments;
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

		this.tooltip.style("opacity", 0);

		this.align_peptides_to_CL();

		/*
		#==========================================================================
		#  FRAGMENTATION KEY STARTS HERE
		#==========================================================================
		*/
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

			this.drawFragmentationEvents(0);
			if(this.peptides[1])
				this.drawFragmentationEvents(1);
		}

		// the letters
		this.drawPeptides();

		//CL line svg elements
		if(this.linkPos.length > 0){
			var CLpos = this.linkPos[0].linkSite+1;
			if (this.linkPos[1].linkSite > this.linkPos[0].linkSite)
				CLpos = this.linkPos[1].linkSite+1;

			this.CL = this.scaleSvgGroup.append("g");

			//highlight
			this.CLlineHighlight = this.CL.append("line")
				.attr("x1", this.xStep * (CLpos - 1))
				.attr("y1", 25)
				.attr("x2", this.xStep * (CLpos - 1))
				.attr("y2", 55)
				.attr("stroke", self.model.get('highlightColor'))
				.attr("stroke-width", 10)
				.attr("opacity", 0)
				.style("cursor", this.cursor);

			// the the link line
			this.CLline = this.CL.append("line")
				.attr("x1", this.xStep * (CLpos - 1))
				.attr("y1", 25)
				.attr("x2", this.xStep * (CLpos - 1))
				.attr("y2", 55)
				.attr("stroke", "black")
				.attr("stroke-width", 2.3)
				.style("cursor", this.cursor);

			//line for changing
			this.changeCLline = this.CL.append("line")
				.attr("x1", this.xStep * (CLpos - 1))
				.attr("y1", 25)
				.attr("x2", this.xStep * (CLpos - 1))
				.attr("y2", 55)
				.attr("stroke", "black")
				.attr("stroke-width", 2.3)
				.attr("opacity", 0)
				.style("cursor", this.cursor);

			this.CL.on("mouseover", function() {
				if (!self.options.disabled && !self.changeMod  && !self.changeCL){
					self.CLlineHighlight.attr("opacity", 0.8);
					self.tooltip.text("Cross-link: Click to change position");
					self.tooltip.transition()
							.duration(200)
							.style("opacity", .9);
					self.tooltip.style("left", (d3.event.pageX + 15) + "px")
							.style("top", (d3.event.pageY) + "px");
				}
			});

			this.CL.on("mouseout", function() {
				if (!self.options.disabled && !self.changeMod  && !self.changeCL){
					self.CLlineHighlight.attr("opacity", 0);
					self.tooltip.transition()
						.duration(500)
						.style("opacity", 0);
					}
			});

			this.CL.on("click", function() {
				if(self.options.disabled)
					return;
				self.tooltip.text("Now click on an amino acid to complete");
				self.tooltip.transition()
					.duration(200)
					.style("opacity", .9);
				self.tooltip.style("left", (d3.event.pageX + 15) + "px")
					.style("top", (d3.event.pageY) + "px");
				if (!self.changeMod){
					self.tooltip.style("opacity", 0);
					self.CLlineHighlight.attr("opacity", 1);
					self.changeCL = jQuery.extend(true, [], self.linkPos);
					for (var i = 0; i < self.fraglines.length; i++) {
						self.fraglines[i].disableCursor();
					};
					for (var i = 0; i < self.pepLetters.length; i++){
						self.pepLetters[i].style("cursor", "pointer");
					};
				}
			});

		}

		//change-mod svg element
		// var changeModLetterG = this.scaleSvgGroup.append("g");
		var changeModLetterG = this.scaleSvgGroup.append("g");
		this.changeModLetterHighlight = changeModLetterG.append("text")
			.attr("text-anchor", "middle")
			.attr("stroke", self.model.get('highlightColor'))
			.style("font-size", "0.7em")
			.attr("stroke-width", "2px")
		this.changeModLetter = changeModLetterG.append("text")
			.attr("text-anchor", "middle")
			.style("font-size", "0.7em")
			.style("cursor", "default");

	},

	align_peptides_to_CL: function(){
		if (this.linkPos.length > 0){

			function arrayOfHashes(n){
				var arr = [];
				for (var a = 0; a < n; a++) {arr.push("#")}
				return arr;
			}

			// #==========================================================================
			// #	account for crosslink shift
			// #	this alings the peptide sequences at the cross-link site
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
			var frags = this.annotations[pepIndex][i];
			if (frags.b.length != 0 || frags.y.length != 0) {
				this.fraglines.push(new KeyFragment(frags, i, this.pepoffset[pepIndex], pepIndex, this));
			}
		}
	},


	drawPeptides: function(){

		var self = this;

		var pep1SvgGroup = self.scaleSvgGroup
			.append('g')
			.attr('class', 'peptide')
		;

		var peptides = [{
			sequence: this.peptides[0],
			color: this.model.p1color,
			y: [20, 5],
			group: pep1SvgGroup
		}];

		if(this.peptides.length > 1){
			var pep2SvgGroup = self.scaleSvgGroup
				.append('g')
				.attr('class', 'peptide')
			;

			peptides.push({
				sequence: this.peptides[1],
				color: this.model.p2color,
				y: [71, 83],
				group: pep2SvgGroup
			});
		}

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
						self.tooltip.transition()
							.duration(500)
							.style("opacity", 0);
						self.model.changeLinkPos(self.changeCL);
					}
					//change the mod if changeMod is active and it's a valid modification for this aa
					if(self.changeMod !== false && self.validModChange){
						self.tooltip.transition()
							.duration(500)
							.style("opacity", 0);
						changeMod(d);
					}
				})
				.on("mouseover", function(d, i) {
					if(self.changeMod !== false || self.changeCL !== false){
						self.tooltip.style("left", (d3.event.pageX + 15) + "px")
							.style("top", (d3.event.pageY) + "px");
						if(self.changeMod !== false){	//if changeMod is active
							changeModStartHighlight(this, d);
						};

						if(self.changeCL != false){
							changeCLHighlight(this, d);
						}
					}
				})
				.on("mouseout", function(d) {
					// if(self.changeMod !== false){	//if changeMod is active
					// 	changeModEndHighlight(d);
					// }
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
				.attr("stroke-width", 3)
				.attr("stroke", self.model.get('highlightColor'))
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

			function changeMod(d){
				var offset = self.pepoffset[self.changeMod.pepIndex];
				var oldPos = self.changeMod.pos - offset;
				var newPos = d.pos;
				if (oldPos == newPos && self.changeMod.pepIndex == d.pepIndex)
					self.render();
				else
					self.model.changeMod(oldPos, newPos, self.changeMod.pepIndex, d.pepIndex);
			};

			function changeModStartHighlight(pepLetterG, pepLetterData){

				clearHighlights();

				var pepLetterHighlight = d3.select(pepLetterG).select(".pepLetterHighlight");
				var pepLetter = d3.select(pepLetterG).select(".pepLetter");
				pepLetterHighlight.style("opacity", 1);
				pepLetter.style("cursor","pointer");

				var offset = self.pepoffset[self.changeMod.pepIndex];
				var highlight = self.modLetterHighlights[self.changeMod.pepIndex][0][self.changeMod.pos-offset];
				var oldModLetters = self.modLetters[self.changeMod.pepIndex][0][self.changeMod.pos-offset];

				var x = parseInt(pepLetterHighlight[0][0].getAttribute("x"));
				if (pepLetterData.pepIndex == 0)
					var y = 5;
				else if (pepLetterData.pepIndex == 1)
					var y = 83;

				//check if it is a valid modification change
				if (self.model.checkForValidModification(self.changeMod.fullMod, pepLetterData.aminoAcid)){
					self.validModChange = true;
					pepLetterHighlight.style("cursor","pointer");
					pepLetter.style("cursor","pointer");
				}
				else{
					self.validModChange = false;
					pepLetterHighlight.style("cursor","not-allowed");
					pepLetter.style("cursor","not-allowed");
				}
				if (pepLetterData.pepIndex == 0)
					var color = self.model.p1color;
				else if (pepLetterData.pepIndex == 1)
					var color = self.model.p2color;
				oldModLetters.setAttribute("fill", "grey");
				// highlight.setAttribute("x", x);
				// highlight.setAttribute("y", y+1);
				highlight.setAttribute("opacity", 0)

				self.changeModLetter.attr("x", x)
					.text(self.changeMod.fullMod)
					.attr("y", y)
					.attr("fill", color)
					.attr("opacity", 1);
				self.changeModLetterHighlight.attr("x", x)
					.text(self.changeMod.fullMod)
					.attr("y", y)
					.attr("fill", color)
					.attr("opacity", 1);
			};

			// function changeModEndHighlight(pepLetterData){
			// 	var offset = self.pepoffset[pepLetterData.pepIndex];
			// 	var pepLetterHighlight = self.pepLetterHighlights[pepLetterData.pepIndex][0][pepLetterData.pos+offset];
			// 	var highlight =  self.modLetterHighlights[pepLetterData.pepIndex][0][self.changeMod.pos-offset];
			// 	pepLetterHighlight.setAttribute("opacity", 0);
			// 	self.changeModLetter.attr("opacity", 0);
			// 	highlight.setAttribute("opacity", 0);
			// };

			function clearHighlights(){
				self.pepLetterHighlights.forEach(function(peptide){
					peptide.style("opacity", 0);
				});
			};

			function changeCLHighlight(pepLetterG, pepLetterData){
				var pepLetterHighlight = pepLetterG.childNodes[0];
				var pepLetter = pepLetterG.childNodes[1];
				clearHighlights();

				self.CLline.attr("stroke", "grey");
				// update changeCL to the currently highlighted ones
				for (var i = 0; i < self.changeCL.length; i++) {
					if(self.changeCL[i].peptideId == pepLetterData.pepIndex)
						self.changeCL[i].linkSite = pepLetterData.pos;
				}
				if (pepLetterData.pepIndex == 0){		//pep1
					self.changeCLline
						.attr("x1", pepLetterHighlight.getAttribute("x"))
						.attr("opacity", 1);
					self.CLlineHighlight.attr("x1", pepLetterHighlight.getAttribute("x"));
				}
				else if (pepLetterData.pepIndex == 1){
					self.changeCLline
						.attr("x2", pepLetterHighlight.getAttribute("x"))
						.attr("opacity", 1);
					self.CLlineHighlight.attr("x2", pepLetterHighlight.getAttribute("x"));
				}
				pepLetterHighlight.setAttribute("opacity", 1);
			};

			//mods
			var mod_data = []

			for (var i = 0; i < self.pepModsArray[pepIndex].length; i++) {
				for (var shift = 0; shift < pep.sequence.length; shift++) {
					if (pep.sequence[shift] != "#")
						break;
				}
				mod_data.push({
					fullMod: self.pepModsArray[pepIndex][i],
					shortMod: short_modname(self.pepModsArray[pepIndex][i]),
					pepIndex: pepIndex,
					pos: shift+i,
					modMass: get_mod_mass(self.pepModsArray[pepIndex][i])
				})
			}

			function short_modname(fullModName){
				if (fullModName === undefined)
					return;
				if (fullModName.length > 5)
					return fullModName.substr(0,3) + "..";
				return fullModName;
			};

			function get_mod_mass(fullModName){
				if (fullModName === undefined)
					return;
				var mod = self.model.get("JSONdata").annotation.modifications.filter(function(m){
					return m.id == fullModName;
				});
				if (mod.length < 1){
					console.log('error finding modification');
					return;
				}
				return mod[0].massDifference.toFixed(6);
			};

			var modLettersG = pep.group.selectAll("g.modLetterG").data (mod_data);
			var modLetterG = modLettersG.enter()
				.append('g')
				.attr('class', "modLetterG")
				.style("cursor", self.cursor)
				.on("mouseover", function() {
					if (!self.changeMod  && !self.changeCL){
						//highlight pepLetter
						var pepIndex = this.__data__.pepIndex;
						var pos = this.__data__.pos;
						var modMass = this.__data__.modMass;
						var tooltipHTML = "";
						if (modMass !== undefined)
							tooltipHTML += "Modification mass: " + modMass + "</br>";
						if (!self.options.disabled)
							tooltipHTML += "Click to change the position";

						d3.select(self.pepLetterHighlights[pepIndex][0][pos]).style("opacity", 1);
						d3.select(this).select("text.modLetterHighlight").style("opacity", 1); //highlight modLetter
						d3.select(this).moveToFront();
						self.tooltip.html(tooltipHTML);
						self.tooltip.transition()
							.duration(200)
							.style("opacity", .9);
						self.tooltip.style("left", (d3.event.pageX + 15) + "px")
							.style("top", (d3.event.pageY) + "px");
						d3.select(this).selectAll("text")
							.text(function(d){return d.fullMod});
					}
				})
				.on("mouseout", function() {
					if (!self.changeMod  && !self.changeCL){
						d3.selectAll("text.pepLetterHighlight").style("opacity", 0);
						if (!_.isUndefined(self.CLlineHighlight))
							self.CLlineHighlight.attr("opacity", 0);
						self.tooltip.transition()
							.duration(500)
							.style("opacity", 0);
					}

					d3.selectAll("text.modLetterHighlight").style("opacity", 0);
					d3.select(this).selectAll("text")
						.text(function(d){return d.shortMod});

				})
				.on("click", function(d) {
					if(self.options.disabled)
						return;
					self.tooltip.text("Now click on an amino acid to complete");
					self.tooltip.style("left", (d3.event.pageX + 15) + "px")
							.style("top", (d3.event.pageY) + "px");

					d3.selectAll("text.pepLetterHighlight").style("opacity", 0);
					d3.selectAll("g.modLetterG").style("cursor", "default");
					if (!self.changeMod  && !self.changeCL){

						if (!_.isUndefined(self.CLline))
							self.CLline.style("cursor", "not-allowed");
						if (!_.isUndefined(self.CLlineHighlight))
							self.CLlineHighlight.style("cursor", "not-allowed");


						var highlight = d3.select(this).select(".modLetterHighlight");
						highlight.style("font-size","0.7em").style("cursor","default");
						//set changeMod var to the clicked modification
						self.changeMod = d;
						highlight.style("opacity", 1);
						//disable fragBar cursor
						for (var i = 0; i < self.fraglines.length; i++) {
							self.fraglines[i].disableCursor();
						};
						var pepIndex = this.__data__.pepIndex;
						var pos = this.__data__.pos;
						pepLetterG = self.pepLetters[pepIndex][0][pos].parentNode;
						pepLetterData = self.pepLetters[pepIndex][0][pos].__data__;
						changeModStartHighlight(pepLetterG, pepLetterData);
					}
				})
			;
			modLetterG.append("text")
				.attr("x", function(d){ return self.xStep * d.pos; })
				.attr("class", "modLetterHighlight")
				.attr("y", pep.y[1])
				.attr("text-anchor", "middle")
				.attr("stroke", self.model.get('highlightColor'))
				.style("font-size", "0.7em")
				.text(function(d){ return d.shortMod;})
				.attr("stroke-width", "2px")
				.attr("opacity", 0)
			;
			modLetterG.append("text")
				.attr("x", function(d){ return self.xStep * d.pos; })
				.attr("class", "modLetter")
				.attr("y", pep.y[1])
				.attr("text-anchor", "middle")
				.attr("fill", pep.color)
				.style("font-size", "0.7em")
				.text(function(d){ return d.shortMod;})
				.attr("data-ShortModName", function(d){ return d.shortMod;})
				.attr("data-FullModName", function(d){ return d.fullMod;})
			;

			self.pepLetterHighlights[pepIndex] = pep.group.selectAll("text.pepLetterHighlight");
			self.pepLetters[pepIndex] = pep.group.selectAll("text.pepLetter");
			self.modLetterHighlights[pepIndex] = pep.group.selectAll("text.modLetterHighlight");
			self.modLetters[pepIndex] = pep.group.selectAll("text.modLetter");
			pepIndex++;

		})
	},

	updateHighlights: function(){

		var lines = this.fraglines;

		for(l = 0; l < lines.length; l++){
			var highlightFragments = _.intersection(lines[l].fragments, this.model.highlights);

			if(lines[l].fragments.length > 0)
				lines[l].highlight(false);
			if(highlightFragments.length != 0){
				lines[l].highlight(true, highlightFragments);
			}
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
				if(JSON.stringify(this.model.highlights[i].range) !== JSON.stringify(this.model.highlights[i-1].range))
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
			this.pepLetters[i].attr("fill", this.model.get('peakColor'));
			this.modLetters[i].attr("fill", this.model.get('peakColor'));
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
// 		var lines = this.fraglines;
// 		for(l = 0; l < lines.length; l++){
// 			if (lines[l].peptideId == 0){
// 				if (lines[l].bText) lines[l].bText.style("fill", this.model.p1color);
// 				if (lines[l].yText) lines[l].yText.style("fill", this.model.p1color);
// 			}
// 			else if (lines[l].peptideId == 1){
// 				if (lines[l].bText) lines[l].bText.style("fill", this.model.p2color);
// 				if (lines[l].yText) lines[l].yText.style("fill", this.model.p2color);
// 			}
// 		}
// 		this.colorLetters("all");
		this.render();
		this.updateHighlights();
	},

// 	updateHighlightColors: function(){

// 		for (var i = 0; i < this.fraglines.length; i++) {

// 			if (this.fraglines[i].bHighlight !== undefined)
// 				this.fraglines[i].bHighlight.attr("stroke", this.model.get('highlightColor'));
// 			if (this.fraglines[i].yHighlight !== undefined)
// 				this.fraglines[i].yHighlight.attr("stroke", this.model.get('highlightColor'));
// 		}

// 	},

	resize: function(){

		var $el = $(this.el)
		var parentWidth = $el.width();
		var parentHeight = $el.height();

		var fragKeyWidth, fragKeyHeight;
		try {
			fragKeyWidth = this.scaleSvgGroup.node().getBBox().width;
			fragKeyHeight = this.scaleSvgGroup.node().getBBox().height;
		} catch (e) {
			fragKeyWidth = 0;
			fragKeyHeight = 0;
		}

		var scale = 1;
		if(parentWidth < fragKeyWidth + this.margin.left + this.margin.right){
			scale = parentWidth / (fragKeyWidth + this.margin.left + this.margin.right)
		}
		this.scaleSvgGroup.attr("transform", "scale(" + scale + ")");

		var top = (this.options.invert) ? parentHeight - fragKeyHeight - 15 + this.margin.top : this.margin.top;
		this.fragKeyWrapper.attr("transform", "translate("+this.margin.left+"," + top + ")");

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
		this.scaleSvgGroup.selectAll("*").remove();
		//this.highlights.selectAll("*").remove();
	},

	butterflyToggle: function(toggle){
		// this.graph.options.butterfly = toggle;
		if(this.options.invert){
			this.options.hidden = !toggle;
			this.render();
		}
		this.resize();
	},

	butterflySwap: function(){
		this.options.invert = !this.options.invert;
		this.render();
	},

	accentuateCLcontainingToggle: function(toggle){
		this.options.accentuateCLcontainingFragments = toggle;
		this.render();
	},

	hide: function(){
		this.fragKeyWrapper.attr("visibility", "hidden");
	},

	show: function(){
		this.fragKeyWrapper.attr("visibility", "visible");
	}

});
