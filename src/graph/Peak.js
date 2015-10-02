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
	this.annotations = new PeakAnnotations(data, this);
}

Peak.prototype.init = function(){
	this.line = this.graph.peaks.append('line').attr("stroke-width","1");
	this.annotations.init();
	this.line.attr("stroke", this.annotations.colour);
	this.line.append("svg:title").text("m/z: " + this.x + ", i: " + this.y);	// easy tooltip
	if (this.annotations.isPrimaryMatch) {
		this.highlightLine = this.graph.highlights.append('line')
							.attr("stroke", SpectrumViewer.highlightColour)
							.attr("stroke-width", SpectrumViewer.highlightWidth)
							.attr("opacity","0");
		this.highlightLine.append("svg:title").text("m/z: " + this.x + " i: " + this.y);	// easy tooltip
		
		//set the dom events for it
		var self = this;
		var line = this.highlightLine[0][0];
		line.onmouseover = function(evt) {
			self.highlight(true);
		};
		line.onmouseout = function(evt) {
			self.highlight(false);
		};
		line.ontouchstart = function(evt) {
			self.highlight(true);
		};
		line.ontouchend = function(evt) {
			self.highlight(false);
		};
		//~ var highlightLine = this.highlightLine[0][0];
		//~ highlightLine.onmouseover = function(evt) {
			//~ self.highlight(true);
		//~ };
		//~ highlightLine.onmouseout = function(evt) {
			//~ self.highlight(false);
		//~ };
		//~ highlightLine.ontouchstart = function(evt) {
			//~ self.highlight(true);
		//~ };
		//~ highlightLine.ontouchend = function(evt) {
			//~ self.highlight(false);
		//~ };
	}
}

Peak.prototype.highlight = function(show){
	if (show == true) {
		this.highlightLine.attr("opacity","1");
		this.graph.highlightChanged.dispatch(this.annotations);
	} else {
		this.highlightLine.attr("opacity","0");
		this.graph.highlightChanged.dispatch([]);
	}
	//~ this.annotations.highlight(show);
		
}

Peak.prototype.update = function(){
	this.line.attr("x1", this.graph.x(this.x));
	this.line.attr("y1", this.graph.y(this.y));
	this.line.attr("x2", this.graph.x(this.x));
	this.line.attr("y2", this.graph.y(0));
	if (this.annotations.isPrimaryMatch) {
		this.highlightLine.attr("x1", this.graph.x(this.x));
		this.highlightLine.attr("y1", this.graph.y(this.y));
		this.highlightLine.attr("x2", this.graph.x(this.x));
		this.highlightLine.attr("y2", this.graph.y(0));
	}
	this.annotations.update();
}
