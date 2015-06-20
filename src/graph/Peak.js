//		a spectrum viewer
//		Copyright 2015 Rappsilber Laboratory
//
//		author: Colin Combe
//		
//		graph/Peak.js

function Peak (data, graph){
	this.x = data[0].expmz - 0;
	this.y = data[0].intensity - 0;
	this.graph = graph;	
	this.annotation = new PeakAnnotation(data, graph);
}

Peak.prototype.init = function(){
	this.line = this.graph.peaks.append('line');
	this.line.attr("stroke","black");
	this.line.attr("stroke-width","1");
	this.annotation.init();
}

Peak.prototype.update = function(){
	this.line.attr("x1", this.graph.x(this.x));
	this.line.attr("y1", this.graph.y(this.y));
	this.line.attr("x2", this.graph.x(this.x));
	this.line.attr("y2", this.graph.y(0));
	this.annotation.update();
}
