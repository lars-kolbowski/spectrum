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
//		author: Colin Combe
//
//		graph/Peak.js

function Peak (data, graph){
	//var this.graph.model = graph.spectrumViewer;
	this.x = data[0].expmz - 0;
	this.y = data[0].absolute_intensity - 0;
	this.charge = data[0].charge - 0;
	this.graph = graph;

	//make fragments
	var notLossyFragments = [];
	var lossyFragments = [];
	var fragCount = data.length;
	for (var f = 0; f < fragCount; f++) {
		//check if the Peak is a fragment or not and if create a new Fragment
		if (data[f].fragment_name.trim() != "") {
			var frag = new Fragment (data[f]);
			if (frag.lossy === false) {
				notLossyFragments.push(frag);
			} else {
				lossyFragments.push(frag);
			}
		}
	}
	this.fragments = notLossyFragments.concat(lossyFragments); //merge arrays

	//make tooltip
	var tooltip = "";
	var fragCount = this.fragments.length;
	for (var f = 0; f < fragCount; f++){
		if (f > 0) {
			tooltip += ", ";
		}
		tooltip += this.fragments[f].sequence;
	}
	this.tooltip = tooltip + " m/z: " + this.x + ", i: " + this.y

	//svg elements
	this.g = this.graph.peaks.append('g');
	this.g.append("svg:title").text(this.tooltip);	// easy tooltip
	if (this.fragments.length > 0) {
		this.highlightLine = this.g.append('line')
							.attr("stroke", this.graph.model.highlightColour)
							.attr("stroke-width", this.graph.model.highlightWidth)
							.attr("opacity","0");
		//this.highlightLine.append("svg:title").text(this.tooltip);	// easy tooltip
		this.highlightLine.attr("x1", 0);
		this.highlightLine.attr("x2", 0);
				
		//set the dom events for it
		var self = this;
		var group = this.g[0][0];
		group.onmouseover = function(evt) {
			startHighlight();
		};
		group.onmouseout = function(evt) {
			endHighlight();
		};
		group.ontouchstart = function(evt) {
			startHighlight();
		};
		group.ontouchend = function(evt) {
			endHighlight();
		};

		function startHighlight(){
			self.graph.greyPeaks();
			self.graph.clearLabels();
			self.highlight(true);
			self.graph.highlightChanged.dispatch(self.fragments);
		}
		function endHighlight(){
			self.highlight(false);
			self.graph.highlightChanged.dispatch([]);
			self.graph.colourPeaks();
			self.graph.showLabels();
		}

	  	//create frag labels
		this.labels = []; // will be array of d3 selections
		this.labelHighlights = []; // will be array of d3 selections
		var fragCount = this.fragments.length;
		for (var f = 0; f < fragCount; f++){
			var frag = this.fragments[f];
			var labelHighlight, label;
			if (frag.lossy === false){
				labelHighlight  = this.graph.annotations.append('text');
				label = this.graph.annotations.append('text');
			} else {
				labelHighlight  = this.graph.lossyAnnotations.append('text');
				label = this.graph.lossyAnnotations.append('text');
			}
			labelHighlight.text(frag.name)
					.attr("x", 0)
					.attr("text-anchor", "middle")
					.style("stroke-width", "5px")
					.style("font-size", "0.8em")
					.attr("stroke", this.graph.model.highlightColour);
			label.text(frag.name)
					.attr("x", 0)
					.attr("text-anchor", "middle")
					.style("font-size", "0.8em")
					.attr("class", "peakAnnot");
					
			label[0][0].onmouseover = function(evt) {
				startHighlight();
			};
			label[0][0].onmouseout = function(evt) {
				endHighlight();
			};
			label[0][0].ontouchstart = function(evt) {
				startHighlight();
			};
			label[0][0].ontouchend = function(evt) {
				endHighlight();
			};
			labelHighlight[0][0].onmouseover = function(evt) {
				startHighlight();
			};
			labelHighlight[0][0].onmouseout = function(evt) {
				endHighlight();
			};
			labelHighlight[0][0].ontouchstart = function(evt) {
				startHighlight();
			};
			labelHighlight[0][0].ontouchend = function(evt) {
				endHighlight();
			};
			
			var c = "pink";//colour for annotation
			var matchedPeptide = frag.peptide;
			var pep;
			if (this.graph.pep1 == matchedPeptide){
				pep = "p1";
			}
			else{
				pep = "p2";
			}
			if (frag.name.indexOf("_") == -1){ //is not lossi
				c = this.graph.model[pep + "color"];
			} else { // is lossy
				c = this.graph.model[pep + "color_loss"]; //javascript lets you do this...
			}
			label.attr("fill", c);
			this.labels.push(label);
			this.labelHighlights.push(labelHighlight);
		}
		this.highlight(false);
	}
	this.line = this.g.append('line').attr("stroke-width","1");
	this.line.attr("x1", 0);
	this.line.attr("x2", 0);
	this.colour = this.graph.model.lossFragBarColour;
	if (this.fragments.length > 0){
		if (this.fragments[0].peptide === this.graph.pep1
				&& this.fragments[0].lossy === false) {
			this.colour = this.graph.model.p1color;
		}
		else if (this.fragments[0].peptide === this.graph.pep2
				&& this.fragments[0].lossy === false) {
			this.colour = this.graph.model.p2color;
		}
		else if (this.fragments[0].peptide === this.graph.pep1
				&& this.fragments[0].lossy === true) {
			this.colour = this.graph.model.p1color_loss;
		}
		else if (this.fragments[0].peptide === this.graph.pep2
				&& this.fragments[0].lossy === true) {
			this.colour = this.graph.model.p2color_loss;
		}
	}
	this.line.attr("stroke", this.colour);
	
	this.removeLabels();
	this.showLabels();
}

Peak.prototype.highlight = function(show){
	var labelCount = this.labels.length;
	if (show == true) {
		this.highlightLine.attr("opacity","1");
		for (var a = 0; a < labelCount; a++){
			this.labelHighlights[a].attr("opacity", 1);
		}
		this.graph.peaks[0][0].appendChild(this.g[0][0]);
		this.line.attr("stroke", this.colour);
		this.showLabels();
	} else {
		this.highlightLine.attr("opacity",0);
		for (var a = 0; a < labelCount; a++){
			this.labelHighlights[a].attr("opacity", 0);
		}
	}
}

Peak.prototype.update = function(){
	this.updateX();
	this.updateY();
}

Peak.prototype.updateX = function(){
	this.g.attr("transform", "translate("+this.graph.x(this.x)+",0)");
	var xDomain = this.graph.x.domain();
	if (this.x > xDomain[0] && this.x < xDomain[1]){
		this.g.attr("display","inline");
	} else {
		this.g.attr("display","none");
	}	
	if (this.fragments.length > 0) {
		var labelCount = this.labels.length;
		for (var a = 0; a < labelCount; a++){
			this.labels[a].attr("x", this.graph.x(this.x));
			this.labelHighlights[a].attr("x", this.graph.x(this.x));
			if ((this.x > xDomain[0] && this.x < xDomain[1])
					&& (this.graph.lossyShown === true || this.fragments[a].lossy === false)){
				this.labels[a].attr("display","inline");
				this.labelHighlights[a].attr("display","inline");
			} else {
				this.labels[a].attr("display","none");
				this.labelHighlights[a].attr("display","none");
			}	
		}
	}

}

Peak.prototype.updateY = function(){
	this.line.attr("y1", this.graph.y(this.y));
	this.line.attr("y2", this.graph.y(0));

	if (this.fragments.length > 0) {
		this.highlightLine.attr("y1", this.graph.y(this.y));
		this.highlightLine.attr("y2", this.graph.y(0));
		var yStep = 15;
		var labelCount = this.labels.length;
		for (var a = 0; a < labelCount; a++){
			var label = this.labels[a];
			label.attr("y", this.graph.y(this.y) - 5 - (yStep * a));
			this.labelHighlights[a].attr("y", this.graph.y(this.y) - 5 - (yStep * a));
		}
	}
}

Peak.prototype.removeLabels = function(){
	if (this.fragments.length > 0) {
		var labelCount = this.labels.length;
		for (var a = 0; a < labelCount; a++){
			this.labels[a].attr("display", "none");
			this.labelHighlights[a].attr("display", "none");
		}
	}
}

Peak.prototype.showLabels = function(lossyOverride){
	var xDomain = this.graph.x.domain();
	if (this.fragments.length > 0) {
		var labelCount = this.labels.length;
		for (var a = 0; a < labelCount; a++){
			if ((this.x > xDomain[0] && this.x < xDomain[1])
					&& (this.graph.lossyShown === true || this.fragments[a].lossy === false || lossyOverride == true)) {
				this.labels[a].attr("display", "inline");
				this.labelHighlights[a].attr("display", "inline");
			}
		}
	}
}
