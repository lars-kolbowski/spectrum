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

	events : {
		'click #clearHighlights' : 'clearHighlights',
	},

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

		//create peptide frag key
		//this.peptideFragKey = new PeptideFragmentationKey(this.fragKeyWrapper, this.model);

		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
		this.listenTo(this.model, 'changed:Highlights', this.updateHighlights);
		this.listenTo(this.model, 'changed:ColorScheme', this.updateColors);
		this.listenTo(window, 'resize', _.debounce(this.resize));


	},

	render: function() {
		this.clear()
		if (this.model.JSONdata)
			this.setData();
		this.resize();
	},

	setData: function(){

		var self = this;

		var pepCount = self.model.peptides.length;
		this.linkPos = self.model.JSONdata.LinkSite;
		this.changeCL = false;
		var pepModsArray = [];
		this.peptideStrs = self.model.pepStrs;
		var fragments = self.model.JSONdata.fragments;
		var annotations = [];
		this.peptides = [];
		for (var i = 0; i < this.peptideStrs.length; i++) {
			this.peptides[i] = this.peptideStrs[i];
		};
	    this.pepLetters = [];
		this.pepModLetters = [];
		this.pepoffset = [0,0];
		for(p=0; p < pepCount; p++){
			annotations[p] = [];
			for (var i = 0; i < self.model.peptides[p].sequence.length; i++) {
			var ions = {
				b : [],
				y : []
			};
				annotations[p].push(ions);
			};
			this.pepLetters[p] = [];
			this.pepModLetters[p] = [];
			pepModsArray[p] = [];
			for(i = 0; i < self.model.peptides[p].sequence.length; i++){
				if (self.model.peptides[p].sequence[i].Modification != "")
					pepModsArray[p][i] = self.model.peptides[p].sequence[i].Modification;
			}
		}



		if (pepCount > 1){
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
		    var linkPos;
		    if  (shift <= 0) {
		        this.peptides[0] = Array(Math.abs(shift) + 1).join("#") + this.peptideStrs[0];
		        linkPos = this.linkPos[1].linkSite+1;
		        this.pepoffset[0] = Math.abs(shift) - 0;
		    }
		    else {
		        this.peptides[1] = Array(shift + 1).join("#") + this.peptideStrs[1];
		        linkPos = this.linkPos[0].linkSite+1;
		        this.pepoffset[1] = shift - 0;
			}

			console.log("linkpos: "+ linkPos);

		    var diff = this.peptideStrs[0].length - this.peptideStrs[1].length;
		    spaceArray = arrayOfHashes(Math.abs(diff));
		    if (diff <= 0) {
		        this.peptides[0] = this.peptides[0] + Array(Math.abs(diff) + 1).join("#");
			}
		    else {
		        this.peptides[1] = this.peptides[1] + Array(diff + 1).join("#");
			}
		}
		/*
	    #==========================================================================
	    #  FRAGMENTATION KEY STARTS HERE
	    #==========================================================================
		*/

	    var xStep = 20;
	    // the letters
		drawPeptide( this.peptides[0], pepModsArray[0], 20, 5, this.model.p1color, this.pepLetters[0], this.pepModLetters[0]);
		if(this.peptides[1])
	    	drawPeptide( this.peptides[1], pepModsArray[1], 71, 83, this.model.p2color, this.pepLetters[1], this.pepModLetters[1]);

		function drawPeptide( pep, mods, y1, y2, colour, pepLetters, modLetters) {
			var l = pep.length;
			var shift = 0;
			for (var i = 0; i < l; i++){
				if (pep[i] != "#") {
					pepLetters[i] = self.g.append("text")
						.attr("x", xStep * i)
						.attr("y", y1)
						.attr("text-anchor", "middle")
						.attr("fill", colour)
						.attr("pos", i-shift)
						.style("cursor", "default")
						.text(pep[i]);
					pepLetters[i][0][0].onclick = function() {
						if(self.changeCL){
							//get y attribute to see which peptide
							if (this.getAttribute("y") == "20"){		//pep1
								self.linkPos[0].linkSite = this.getAttribute("pos");
								self.CLline.attr("x1", this.getAttribute("x"));
								self.CLlineHighlight.attr("x1", this.getAttribute("x"));
							}
							else{
								self.linkPos[1].linkSite = this.getAttribute("pos");
								self.CLline.attr("x2", this.getAttribute("x"))
								self.CLlineHighlight.attr("x2", this.getAttribute("x"));	
							}
							var newlinkpos1 = parseInt(self.linkPos[0].linkSite)+1;
							var newlinkpos2 = parseInt(self.linkPos[1].linkSite)+1;
							self.model.changeLink(newlinkpos1, newlinkpos2);
						}
					};
					
					if(mods[i-shift]){
						modLetters[i] = self.g.append("text")
							.attr("x", xStep * i)
							.attr("y", y2)
							.attr("text-anchor", "middle")
							.attr("fill", colour)
							.style("font-size", "0.7em")
							.text(mods[i-shift]);
					}
				}
				else
					shift++;
			}
		}
		if(this.peptides[1]){
			this.CL = self.g.append("g");
			//highlight
			this.CLlineHighlight = this.CL.append("line")
				.attr("x1", xStep * (linkPos - 1))
				.attr("y1", 25)
				.attr("x2", xStep * (linkPos - 1))
				.attr("y2", 55)
				.attr("stroke", "yellow")
				.attr("stroke-width", 10)
				.style("opacity", 0)
				.style("cursor", "pointer");
			// the the link line
			this.CLline = this.CL.append("line")
				.attr("x1", xStep * (linkPos - 1))//the one...
				.attr("y1", 25)
				.attr("x2", xStep * (linkPos - 1))//the one...
				.attr("y2", 55)
				.attr("stroke", "black")
				.attr("stroke-width", 1.5)
				.style("cursor", "pointer");


			this.CL[0][0].onclick = function() {
				self.CLlineHighlight.style("opacity", 1)
				self.changeCL = true;
				for (i=0; i < self.pepLetters.length; i++){
					var letterCount = self.pepLetters[i].length;
					for (j = 0; j < letterCount; j++){
						if (self.pepLetters[i][j])
							self.pepLetters[i][j].style("cursor", "pointer");			
					}
				}
			};

		}

		this.fraglines = new Array();
		var self = this;


		for (var i = 0; i < fragments.length; i++) {
			for (var r = 0; r < fragments[i].range.length; r++) {
				var pepId = fragments[i].range[r].peptideId;
				if (fragments[i].range[r].from != 0) //N-terminal fragment
					annotations[pepId][fragments[i].range[r].from-1].y.push(fragments[i]);
				if (fragments[i].range[r].to != this.peptideStrs[pepId].length-1) //C-terminal fragment
					annotations[pepId][fragments[i].range[r].to].b.push(fragments[i]);
			}
		};


	/*	for (var i = 0; i < fragments.length; i++) {
			for (var r = 0; r < fragments[i].range.length; r++) {
				if(fragments[i].range[r].peptideId == fragments[i].peptideId){
					if (fragments[i].range[r].from == 0){	//a,b,c-ion

						//End
						var index = fragments[i].range[r].to;
						annotations[fragments[i].peptideId][index].b.push(fragments[i]);
					}
					else{	//x,y,z-ion
						//check for double fragmentation
						
						//End
						var index = fragments[i].range[r].from - 1;
						annotations[fragments[i].peptideId][index].y.push(fragments[i]);
					}
				}
			}
		};*/

		console.log(annotations);

	    drawFragmentationEvents(annotations[0], self.pepoffset[0], 0);
		if(this.peptides[1])	
			drawFragmentationEvents(annotations[1], self.pepoffset[1], 1);	

		function drawFragmentationEvents(fragAnno, offset, peptideId) {
			//var l = self.peptides[0].length; // shouldn't matter which pep you use
			for (var i = 0; i < fragAnno.length; i++){
				var frag = fragAnno[i];
				if (frag.b.length != 0 || frag.y.length != 0) {
					//var x = (xStep * i) + (xStep / 2);
					self.fraglines.push(new KeyFragment(frag, i, offset, peptideId, self));
				}
			}
		}

	},

	clearHighlights: function(){
		this.clearHighlights();
	},

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
		for (i=0; i < this.pepLetters.length; i++){
			var letterCount = this.pepLetters[i].length;
			for (j = 0; j < letterCount; j++){
				if (this.pepLetters[i][j])
					this.pepLetters[i][j].attr("fill", this.model.lossFragBarColour);
				if (this.pepModLetters[i][j])
					this.pepModLetters[i][j].attr("fill", this.model.lossFragBarColour);				
			}
		}
	},

	colorLetters: function(fragments){
		var self = this;
		if (fragments == "all"){
			color(0, this.model.p1color, 0, this.pepLetters[0].length);
			if(this.peptides[1])
				color(1, this.model.p2color, 0, this.pepLetters[1].length);			
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
				if (self.pepLetters[pep][i])
					self.pepLetters[pep][i].attr("fill", pepColor);
				if (self.pepModLetters[pep][i])
					self.pepModLetters[pep][i].attr("fill", pepColor);
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

	clearHighlights: function(){
		for (var f = 0; f < this.fraglines.length; f++) {
			if (_.intersection(this.model.sticky, this.fraglines[f].fragments).length == 0) {
				this.fraglines[f].highlight(false);
			}
		}
	},

	clear: function(){
		this.pepoffset = [];
		this.linkPos = [];
		this.g.selectAll("*").remove();
		this.highlights.selectAll("*").remove();
	}	

});
