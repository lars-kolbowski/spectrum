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
	this.x = d3.scale.linear();
	this.y = d3.scale.linear();
	this.highlightChanged = new signals.Signal();
	this.spectrumViewer = spectrumViewer;
	
	this.margin = {
		"top":    options.title  ? 130 : 110,
		"right":  10,
		"bottom": options.xlabel ? 50 : 20,
		"left":   options.ylabel ? 60 : 30
	};
	this.g =  targetSvg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	
	this.xaxis = this.g.append("g")
		.attr("class", "x axis");
		//~ 
	/*
	 * -webkit-user-select: none;
			-khtml-user-select: none;
			-moz-user-select: -moz-none;
			-o-user-select: none;
			user-select: none;*/
	//brush
	this.brush = d3.svg.brush()
		.x(this.x)
		//~ .extent([15, 25])
		.on("brushstart", brushstart)
		.on("brush", brushmove)
		.on("brushend", brushend);
	this.xaxisRect = this.g.append("rect")
					.attr("height", "25")
					.attr("opacity", 0)
					.attr("pointer-events", "all")
					.style("cursor", "crosshair");
	this.xaxisRect.call(this.brush);	
	//~ this	
		
	this.yaxis = this.g.append("g")
		.attr("class", "y axis");
	this.plot = this.g.append("rect")
		.style("fill", "white")
		.attr("pointer-events", "all");
	this.innerSVG = this.g.append("g")
		.attr("top", 0)
		.attr("left", 0)
		.attr("class", "line");
	
	this.dragZoomHighlight = this.innerSVG.append("rect").attr("y", 0).attr("fill","#addd8e");	
	
	
	this.highlights = this.innerSVG.append("g");
	this.peaks = this.innerSVG.append("g");
	this.lossyAnnotations = this.innerSVG.append("g");
	this.annotations = this.innerSVG.append("g");
	
	
	// add Chart Title
	if (options.title) {
		this.title = this.g.append("text")
		.attr("class", "axis")
		.text(options.title)
		.attr("dy","-0.8em")
		.style("text-anchor","middle");
	}
	// add the x-axis label
	if (options.xlabel) {
	this.xlabel = this.g.append("text")
		.attr("class", "aWWWAAAAAxis")
		.text(options.xlabel)
		.attr("dy","2.4em")
		.style("text-anchor","middle").style("pointer-events","none");
	}
	// add y-axis label
	if (options.ylabel) {
	this.ylabel = this.g.append("g").append("text")
		.attr("class", "axis")
		.text(options.ylabel)
		.style("text-anchor","middle").style("pointer-events","none");
	}
	
	
		var self = this;
	
	//~ brushstart();

	function brushstart() {
		//brushmove();
		self.dragZoomHighlight.attr("width",0);
		self.dragZoomHighlight.attr("display","inline");
	}

	function brushmove() {
	  var s = self.brush.extent();
	  var width = self.x(s[1] - s[0]) - self.x(0);
	  //console.log(s + "\t" + s[0] + "\t" + s[1] + "\t" + width);
	  //~ console.log(s[0]);
	  self.dragZoomHighlight.attr("x",self.x(s[0])).attr("width", width);
	}

	function brushend() {
	  self.dragZoomHighlight.attr("display","none");
	  var s = self.brush.extent();
	  self.x.domain(s);
	  self.brush.x(self.x)
	  self.redraw()();
	}
};


Graph.prototype.setData = function(model){
/*	this.clear();
	//get Max m/z value of primarymatches
 	this.xmaxPrimary = d3.max(annotatedPeaks,
			function(d){
				return ((d.isprimarymatch == 1)? d.expmz - 0 : 0);
			}
		) + 50;
 	//get Min m/z value of primarymatches
	this.xminPrimary = d3.min(annotatedPeaks, 
			function(d){
				return ((d.isprimarymatch == 1)?  d.expmz - 0 : this.xmaxPrimary);
			}
		) - 50;
	//sort Data by m/z and Int
	var nested =  d3.nest()
		.key(function(d) { return d.expmz + '-' + d.absoluteintensity; })
		.entries(annotatedPeaks);
		*/
	//create points array with Peaks
	this.points = new Array();
	this.pep1 = model.pep1;
	this.pep2 = model.pep2;
	for (var i = 0; i < model.nested.length; i++){
		this.points.push(new Peak(model.nested[i].values, this));
	}
/*
	//~ this.xmax = d3.max(this.points, function(d){return d.x;}) + 10;
	//~ this.xmin = d3.min(this.points, function(d){return d.x;}) - 10;

	this.xmax = this.xmaxPrimary;
	this.xmin = this.xminPrimary;

	this.ymax = d3.max(this.points, function(d){return d.y;});
	this.ymin = 0;//d3.min(this.points, function(d){return d.y;});*/

	this.resize(model);
}

Graph.prototype.resize = function(model) {
	var self = this;
	
	//see https://gist.github.com/mbostock/3019563
	var cx = self.g.node().parentNode.parentNode.clientWidth;
	var cy = self.g.node().parentNode.parentNode.clientHeight;
	
	self.g.attr("width", cx).attr("height", cy);
	var width = cx - self.margin.left - self.margin.right;
	var height = cy - self.margin.top  - self.margin.bottom;
	self.x.domain([model.xmin, model.xmax])
		.range([0, width]);
	// y-scale (inverted domain)
	self.y.domain([0, model.ymax]).nice()
		.range([height, 0]).nice();

	var yTicks = height / 40;
	var xTicks = width / 100;

	
	self.yaxis.call(d3.svg.axis().scale(self.y).ticks(yTicks)
						.orient("left").tickFormat(d3.format("s")));
	

	self.xAxis = d3.svg.axis().scale(self.x).ticks(xTicks).orient("bottom");
		
	self.xaxis.attr("transform", "translate(0," + height + ")")
		.call(self.xAxis);
	
	this.g.selectAll('.axis line, .axis path')
			.style({'stroke': 'Black', 'fill': 'none', 'stroke-width': '1.2px'});
	
	//~ this.g.selectAll('.tick')
		//~ .attr("pointer-events", "none");
		
	self.plot.attr("width", width)
		.attr("height", height)

	self.innerSVG.attr("width", width)
			.attr("height", height)
			.attr("viewBox", "0 0 "+width+" "+height);
	
	self.xaxisRect.attr("width",width).attr("y", height).attr("height", self.margin.bottom);
	self.dragZoomHighlight.attr("height", height);
				
	self.zoom = d3.behavior.zoom().x(self.x).on("zoom", self.redraw());
	self.plot.call( d3.behavior.zoom().x(self.x).on("zoom", self.redraw()));
	self.innerSVG.call(self.zoom);

	if (this.title) {
		this.title.attr("x", width/2);
	}
	this.xlabel.attr("x", width/2).attr("y", height);
	this.ylabel.attr("transform","translate(" + -45 + " " + height/2+") rotate(-90)");
	
	self.redraw()();
}

Graph.prototype.redraw = function(){
	var self = this;
	return function (){
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
	this.highlights.selectAll("*").remove();
	this.peaks.selectAll("*").remove();
	this.lossyAnnotations.selectAll("*").remove();
	this.annotations.selectAll("*").remove();
}


Graph.prototype.setHighlights = function(peptide, pepI){
	this.clearHighlights();
	if (peptide) {
		this.clearLabels();
		this.greyPeaks();
		var peakCount = this.points.length;
		for (var p = 0; p < peakCount; p++) {
			var match = false;
			var peak = this.points[p];
			var fragCount = peak.fragments.length;
			for (var pf = 0; pf < fragCount; pf++) {
				var frag = peak.fragments[pf];
				var pepSeq = frag.peptide;
				if (peptide == frag.peptide
					&& ((frag.ionType == 'y' && frag.ionNumber == (pepSeq.length - pepI - 1))
						||(frag.ionType == 'b' && frag.ionNumber == (pepI - 0 + 1))
						)
					) {
					match = true;
				}
			}
			
			
			if (match === true) {
				this.points[p].highlight(true);
				this.points[p].showLabels();
			}
		}	
	} else {
		this.showLabels();
		this.colourPeaks();
	}
}

Graph.prototype.clearHighlights = function(peptide, pepI){
	var peakCount = this.points.length;
	for (var p = 0; p < peakCount; p++) {
		if (this.points[p].fragments.length > 0) {
			this.points[p].highlight(false);
		}
	}
}

Graph.prototype.clearLabels = function(){
	var peakCount = this.points.length;
	for (var p = 0; p < peakCount; p++) {
		if (this.points[p].fragments.length > 0) {
			this.points[p].removeLabels();
		}
	}
}

Graph.prototype.showLabels = function(){
	var peakCount = this.points.length;
	for (var p = 0; p < peakCount; p++) {
		if (this.points[p].fragments.length > 0) {
			this.points[p].showLabels();
		}
	}
}


Graph.prototype.greyPeaks = function(){
	var peakCount = this.points.length;
	for (var p = 0; p < peakCount; p++) {
		this.points[p].line.attr("stroke", this.spectrumViewer.model.lossFragBarColour);
	}
}
Graph.prototype.colourPeaks = function(){
	var peakCount = this.points.length;
	for (var p = 0; p < peakCount; p++) {
		var peak = this.points[p];
		peak.line.attr("stroke", peak.colour);
	}
}
/*
Graph.prototype.showLabels = function(){
	var peakCount = this.points.length;
	for (var p = 0; p < peakCount; p++) {
		if (this.points[p].fragments.length > 0) {
			this.points[p].showLabels();
		}
	}
}



 * 

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
