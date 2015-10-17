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
	this.x = data[0].expmz - 0;
	this.y = data[0].absolute_intensity - 0;
	this.graph = graph;	
	this.notLossyFragments = [];
	this.lossyFragments = [];
	
	var fragCount = data.length;
	for (var f = 0; f < fragCount; f++) {
		if (data[f].fragment_name.trim() != "") {
			var frag = new Fragment (data[f]);
			if (frag.lossy === false) {
				this.notLossyFragments.push(frag);
			} else {
				this.lossyFragments.push(frag);
			}
		}		
	}
	
	this.fragments = this.notLossyFragments.concat(this.lossyFragments);
	
	var tooltip = "";
	var fragCount = this.fragments.length;
	for (var f = 0; f < fragCount; f++){
		if (f > 0) {
			tooltip += ", ";
		}
		tooltip += this.fragments[f].sequence;
	}
	this.tooltip = tooltip + " m/z: " + this.x + ", i: " + this.y
}

Peak.prototype.init = function(){
	this.line = this.graph.peaks.append('line').attr("stroke-width","1");
	this.line.append("svg:title").text(this.tooltip);	// easy tooltip
	if (this.fragments.length > 0) {
		if (this.fragments[0].peptide === this.graph.spectrumViewer.pep1 
				&& this.fragments[0].lossy === false) {
			this.line.attr("stroke", SpectrumViewer.p1color);
		}
		else if (this.fragments[0].peptide === this.graph.spectrumViewer.pep2 
				&& this.fragments[0].lossy === false) {
			this.line.attr("stroke", SpectrumViewer.p2color);
		}
		else if (this.fragments[0].peptide === this.graph.spectrumViewer.pep1 
				&& this.fragments[0].lossy === true) {
			this.line.attr("stroke", SpectrumViewer.p1color_loss);
		}
		else if (this.fragments[0].peptide === this.graph.spectrumViewer.pep2 
				&& this.fragments[0].lossy === true) {
			this.line.attr("stroke", SpectrumViewer.p2color_loss);
		}
		this.highlightLine = this.graph.highlights.append('line')
							.attr("stroke", SpectrumViewer.highlightColour)
							.attr("stroke-width", SpectrumViewer.highlightWidth)
							.attr("opacity","0");
		this.highlightLine.append("svg:title").text(this.tooltip);	// easy tooltip
		
		//set the dom events for it
		var self = this;
		var line = this.line[0][0];
		line.onmouseover = function(evt) {
			self.highlight(true);
			self.graph.highlightChanged.dispatch(self.fragments);
		};
		line.onmouseout = function(evt) {
			self.highlight(false);
			self.graph.highlightChanged.dispatch([]);
		};
		line.ontouchstart = function(evt) {
			self.highlight(true);
			self.graph.highlightChanged.dispatch(self.fragments);
		};
		line.ontouchend = function(evt) {
			self.highlight(false);
			self.graph.highlightChanged.dispatch([]);
		};
		line = this.highlightLine[0][0];
		line.onmouseover = function(evt) {
			self.highlight(true);
			self.graph.highlightChanged.dispatch(self.fragments);
		};
		line.onmouseout = function(evt) {
			self.highlight(false);
			self.graph.highlightChanged.dispatch([]);
		};
		line.ontouchstart = function(evt) {
			self.highlight(true);
			self.graph.highlightChanged.dispatch(self.fragments);
		};
		line.ontouchend = function(evt) {
			self.highlight(false);
			self.graph.highlightChanged.dispatch([]);
		};
	
	
		
	  	//create frag labels
		this.labels = []; // will be array of d3 selections
		var fragCount = this.fragments.length;
		//~ var unlossiFound = false;
		for (var f = 0; f < fragCount; f++){
			var frag = this.fragments[f];
			var label = this.graph.annotations.append('text')
					.text(frag.name)
					.attr("text-anchor", "middle")
					.attr("class", "peakAnnot");
			
			var c = "pink";//colour for annotation
			var matchedPeptide = frag.peptide;
			var pep; 
			if (this.graph.spectrumViewer.pep1 == matchedPeptide){
				pep = "p1";
			}
			else{
				pep = "p2";
			}
			if (frag.name.indexOf("_") == -1){ //is not lossi
				c = SpectrumViewer[pep + "color"];	
			} else { // is lossy
				c = SpectrumViewer[pep + "color_loss"]; //javascript lets you do this...
			}		
			label.attr("fill", c);	
			label.append("svg:title").text(this.tooltip);	// easy tooltip
			this.labels.push(label);
		}
	}
	else { //no fragment annotations for this peak
		this.line.attr("stroke", "#777777");
	}
}

Peak.prototype.highlight = function(show){
	if (show == true) {
		this.highlightLine.attr("opacity","1");
	} else {
		this.highlightLine.attr("opacity","0");
	}
	this.highlighted = show;
}

Peak.prototype.update = function(){
	var xDomain = this.graph.x.domain();
	//~ console.log(">" + xDomain);
		this.line.attr("x1", this.graph.x(this.x));
		this.line.attr("y1", this.graph.y(this.y));
		this.line.attr("x2", this.graph.x(this.x));
		this.line.attr("y2", this.graph.y(0));
		if (this.fragments.length > 0) {
			this.highlightLine.attr("x1", this.graph.x(this.x));
			this.highlightLine.attr("y1", this.graph.y(this.y));
			this.highlightLine.attr("x2", this.graph.x(this.x));
			this.highlightLine.attr("y2", this.graph.y(0));	
			var yStep = 15;
			var labelCount = this.labels.length;
			for (var a = 0; a < labelCount; a++){
				var label = this.labels[a];
				label.attr("x", this.graph.x(this.x));
				label.attr("y", this.graph.y(this.y) - 5 - (yStep * a));
			}	
		}
	if (this.x > xDomain[0] && this.x < xDomain[1]){
		this.line.attr("display","inline");
		if (this.fragments.length > 0) {this.highlightLine.attr("display","inline");}
		this.showLabels();
	} else {
		this.line.attr("display","none");
		if (this.fragments.length > 0) {this.highlightLine.attr("display","none");}
		this.removeLabels();
	}
}

Peak.prototype.removeLabels = function(){
	if (this.fragments.length > 0) {
		var labelCount = this.labels.length;
		for (var a = 0; a < labelCount; a++){
			var label = this.labels[a];
			label.attr("display", "none");
		}
	}	
}

Peak.prototype.showLabels = function(){
	if (this.fragments.length > 0) {
		var labelCount = this.labels.length;
		for (var a = 0; a < labelCount; a++){
			if (this.graph.spectrumViewer.lossyShown === true || this.fragments[a].lossy === false || this.highlighted === true) {
				var label = this.labels[a];
				label.attr("display", "inline");
			}
		}	
	}	
}
