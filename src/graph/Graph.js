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
//		graph/Graph.js
//
//		see http://bl.ocks.org/stepheneb/1182434
//		and https://gist.github.com/mbostock/3019563

Graph = function(targetSvg, spectrumViewer, options) {
	this.spectrumViewer = spectrumViewer;
	this.options = options || {};
	this.margin = {
		"top":    this.options.title  ? 140 : 120,
		"right":  30,
		"bottom": this.options.xlabel ? 60 : 40,
		"left":   this.options.ylabel ? 120 : 100
	};
	this.g =  targetSvg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
};


Graph.prototype.setData = function(annotatedPeaks){
 	this.xmaxPrimary = d3.max(annotatedPeaks,
			function(d){
				return ((d.isprimarymatch == 1)? d.expmz - 0 : 0);
			}
		) + 50;
	this.xminPrimary = d3.min(annotatedPeaks, function(d){return ((d.isprimarymatch == 1)?  d.expmz - 0 : this.xmaxPrimary);}) - 50;

	var nested =  d3.nest()
		.key(function(d) { return d.expmz +'-'+ d.absoluteintensity; })
		.entries(annotatedPeaks);
	this.points = new Array();
	for (var i = 0; i < nested.length; i++){
		this.points.push(new Peak(nested[i].values, this));
	}

	//~ this.xmax = d3.max(this.points, function(d){return d.x;}) + 10;
	//~ this.xmin = d3.min(this.points, function(d){return d.x;}) - 10;

	this.xmax = this.xmaxPrimary;
	this.xmin = this.xminPrimary;


	this.ymax = d3.max(this.points, function(d){return d.y;});
	this.ymin = 0;//d3.min(this.points, function(d){return d.y;});

	this.resize();
}

Graph.prototype.resize = function() {
	var self = this;

	//see https://gist.github.com/mbostock/3019563
	var cx = self.g.node().parentNode.clientWidth;
	var cy = self.g.node().parentNode.clientHeight;
	self.g.attr("width", cx).attr("height", cy);
	self.g.attr("width", cx).attr("height", cy).selectAll("*").remove();
	// remove not needed if create groups in contructors and change attributes here
	// (i.e. this could be tidied up)

	var width = cx - self.margin.left - self.margin.right;
	var height = cy - self.margin.top  - self.margin.bottom;


	self.x = d3.scale.linear()
		.domain([self.xmin, self.xmax])
		.range([0, width]);

	//todo: don't recreate things, create them in constructor and change attributes here

	// y-scale (inverted domain)
	self.y = d3.scale.linear()
		.domain([0, self.ymax]).nice()
		.range([height, 0]).nice();

	self.g.append("g")
		.attr("class", "y axis")
		.call(d3.svg.axis().scale(self.y).orient("left"));

	self.xAxis = d3.svg.axis().scale(self.x).orient("bottom");
	self.xaxis = self.g.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(self.xAxis);

	self.plot = self.g.append("rect")
		.attr("width", width)
		.attr("height", height)
		.style("fill", "white")
		.attr("pointer-events", "all");

	self.innerSVG = self.g.append("g")//"svg") //make this svg to clip plot at axes
		.attr("top", 0)
		.attr("left", 0)
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", "0 0 "+width+" "+height)
		.attr("class", "line");


	self.peaks = self.innerSVG.append("g");
	self.annotations = self.innerSVG.append("g");
	for (var i = 0; i < self.points.length; i++){
		self.points[i].init();
	}
	self.zoom = d3.behavior.zoom().x(self.x).on("zoom", self.redraw());

	self.plot.call( d3.behavior.zoom().x(self.x).on("zoom", self.redraw()));
	self.innerSVG.call(self.zoom);

	  // add Chart Title
	  //~ if (self.options.title) {
		//~ self.title = self.vis.append("text")
			//~ .attr("class", "axis")
			//~ .text(self.options.title)
			//~ .attr("x", self.size.width/2)
			//~ .attr("dy","-0.8em")
			//~ .style("text-anchor","middle");
	  //~ }

	  self.redraw()();
}

Graph.prototype.redraw = function(){
	var self = this;
	return function (){
		//~ console.log(PeakAnnotation.colours.domain());
		//~ self.plot.call(self.zoom);
		//~ self.innerSVG.call(self.zoom);
		for (var i = 0; i < self.points.length; i++){
		  self.points[i].update();
		}
		self.xaxis.call( self.xAxis);//d3.behavior.zoom().x(self.x).on("zoom", self.redraw()));
		self.plot.call( d3.behavior.zoom().x(self.x).on("zoom", self.redraw()));
		self.innerSVG.call( d3.behavior.zoom().x(self.x).on("zoom", self.redraw()));
	};
}

Graph.prototype.clear = function(){
	this.points= [];
	this.g.selectAll("*").remove();
}

/*
Graph.prototype.highlightChanged = function(fragments){
	var callbackCount = this.highlightChangedCallbacks.length;
	for (var i = 0; i < callbackCount; i++) {
		this.highlightChangedCallbacks[i](fragments);
	}
}

Graph.prototype.setHighlight = function(fragments){
	//~ this.messageDiv.innerHTML = this.toString() + "<br>Hightlight:" + JSON.stringify(fragments);
}

Graph.prototype.resetScales = function(text) {
	  this.y = d3.scale.linear()
	  .domain([this.options.ymax, this.options.ymin])
	  .nice()
	  .range([0, this.size.height])
	  .nice();

	this.zoom.scale(1, 1);
	this.zoom.translate([0, 0]);
	this.redraw()();
};
*/
