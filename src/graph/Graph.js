//		a spectrum viewer
//		
//		Colin Combe, Rappsilber Laboratory, 2015
// 
//		graph/Graph.js

//		//see https://gist.github.com/mbostock/3019563

Graph = function(targetSvg, options) {


	this.options = options || {};
	this.margin = {
		"top":    this.options.title  ? 40 : 20,
		"right":  20,
		"bottom": this.options.xlabel ? 60 : 40,
		"left":   this.options.ylabel ? 100 : 80
	};

	this.g =  targetSvg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

	// drag x-axis logic
	//~ this.downx = Math.NaN;

	// drag y-axis logic
	//~ this.downy = Math.NaN;

	//~ var self = this;
    //~ d3.select(this.chart)
      //~ .on("mousemove.drag", self.mousemove())
      //~ .on("touchmove.drag", self.mousemove())
      //~ .on("mouseup.drag",   self.mouseup())
      //~ .on("touchend.drag",  self.mouseup());

};


Graph.prototype.setData = function(annotatedPeaks){
 	var nested =  d3.nest()
		.key(function(d) { return d.expmz +'-'+ d.absoluteintensity; })
		.entries(annotatedPeaks);
	this.points = new Array();
	for (var i = 0; i < nested.length; i++){
		this.points.push(new Peak(nested[i].values, this));
	}
		
	this.xmax = d3.max(this.points, function(d){return d.x;}) + 100;
	this.xmin = d3.min(this.points, function(d){return d.x;}) - 100;
	this.ymax = d3.max(this.points, function(d){return d.y;});
	this.ymin = 0;//3.min(this.points, function(d){return d.y;});	
	
	this.resize()();
}

Graph.prototype.resize = function() {
	var self = this;

	//see https://gist.github.com/mbostock/3019563
	return function() {
		console.log("doing it");
		var cx = self.g.node().parentNode.clientWidth;
		var cy = self.g.node().parentNode.clientHeight;
		self.g.attr("width", cx).attr("height", cy);
		self.g.attr("width", cx).attr("height", cy).selectAll("*").remove();
		
		var width = cx - self.margin.left - self.margin.right;
		var height = cy - self.margin.top  - self.margin.bottom;
		
		  
		self.x = d3.scale.linear()
			.domain([self.xmin, self.xmax])
			.range([0, width]);
//~ 
		// y-scale (inverted domain)
		self.y = d3.scale.linear()
			.domain([0, self.ymax]).nice()
			.range([height, 0]).nice();
		
		self.g.append("g")
			.attr("class", "y axis")
			.call(d3.svg.axis().scale(self.y).orient("left"));
//~ 
		self.g.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.svg.axis().scale(self.x).orient("bottom"));

  /*

  this.vis = d3.select(this.chart).append("svg")
      .attr("width",  this.cx)
      .attr("height", this.cy)
      .append("g")
        .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");
*/
  self.plot = self.g.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "#EEEEEE")
      .attr("pointer-events", "all");
  
  self.innerSVG = self.g.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 "+width+" "+height)
      .attr("class", "line");
  
      
   //~ self.zoom = d3.behavior.zoom().x(self.x).on("zoom", self.redraw());
  //~ self.plot.call(self.zoom);
	//~ self.innerSVG.call(self.zoom);

      
   self.annotations = self.innerSVG.append("g");
   self.peaks = self.innerSVG.append("g");

  // add Chart Title
  if (self.options.title) {
    self.title = self.vis.append("text")
        .attr("class", "axis")
        .text(self.options.title)
        .attr("x", self.size.width/2)
        .attr("dy","-0.8em")
        .style("text-anchor","middle");
  }
  
  self.redraw();
}
}

Graph.prototype.redraw = function(){

  for (var i = 0; i < this.points.length; i++){
	  this.points[i].init();
  }
  //~ console.log(PeakAnnotation.colours.domain());
	  
	  
	  
	 
    //~ self.plot.call(self.zoom);
    //~ self.innerSVG.call(self.zoom);
    for (var i = 0; i < this.points.length; i++){
	  this.points[i].update();
	}
  }

Graph.prototype.clear = function(){
	//~ this.points= [];
	//this.redraw()();
}

Graph.prototype.highlightChanged = function(fragments){
	var callbackCount = this.highlightChangedCallbacks.length;
	for (var i = 0; i < callbackCount; i++) {
		this.highlightChangedCallbacks[i](fragments);
	}
}

Graph.prototype.setHighlight = function(fragments){
	//~ this.messageDiv.innerHTML = this.toString() + "<br>Hightlight:" + JSON.stringify(fragments);
}


Graph.prototype.mousemove = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;
    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy = self.y.invert(p[1]),
          yaxis1 = 0;//self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;
      if (rupy != 0) {
        var changey, new_domain;
        changey = self.downy / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};

Graph.prototype.mouseup = function() {
  var self = this;
  return function() {
		document.onselectstart = function() { return true; };
	    d3.select('body').style("cursor", "auto");
    	d3.select('body').style("cursor", "auto");
 		if (!isNaN(self.downy)) {
		  self.redraw()();
		  self.downy = Math.NaN;
		  d3.event.preventDefault();
		  d3.event.stopPropagation();
		}
    }
}



Graph.prototype.yaxis_drag = function(d) {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.mouse(self.vis[0][0]);
    self.downy = self.y.invert(p[1]);
  }
};

Graph.prototype.setTitle = function(text) {
	//~ this.title.text(text);
};

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
