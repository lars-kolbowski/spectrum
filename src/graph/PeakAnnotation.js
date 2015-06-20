//		a spectrum viewer
//		Copyright 2015 Rappsilber Laboratory
//
//		author: Colin Combe
//		
//		graph/PeakAnnotations.js

function PeakAnnotation (data, graph){
	this.x = data[0].expmz - 0;
	this.y = data[0].intensity - 0; //typo in column name
	this.graph = graph;	
	this.fragmentNames = "";
	this.sequences = "";
	this.primary = false;
	for (var a= 0; a < data.length; a++){
		var annot = data[a];
		if (annot.isprimarymatch == 1) {this.primary = true;}
		if (a > 0) {
			this.fragmentNames += " & ";
			this.sequences += " & ";
		}
		this.fragmentNames += annot.fragment_name;	
		this.sequences += annot.sequence;	
	}
}
PeakAnnotation.colours = d3.scale.ordinal().range(colorbrewer.Set2[3]);
PeakAnnotation.prototype.init = function(){
	var self = this;
	if (this.primary){
		this.circle = this.graph.annotations.append('circle');
		this.circle.attr("r",15);
		var stringForColour = ""
		if (this.fragmentNames.indexOf('b') !== -1){ stringForColour += "b";}
		if (this.fragmentNames.indexOf('y') !== -1){ stringForColour += "y";}
		this.circle.attr("fill",PeakAnnotation.colours(stringForColour));
		this.circle.attr("fill",Annotation.colours(stringForColour));
		this.circle.on("mouseover", function(){
			self.graph.setTitle(self.sequences);
		}).on("mouseout", function(){
			self.graph.setTitle("");
		});
		
		this.label = this.graph.annotations.append('text');
		this.label.text(this.fragmentNames);
		//~ this.circle.attr("r",15);
		//~ var stringForColour = ""
		//~ if (this.fragmentNames.indexOf('b') !== -1){ stringForColour += "b";}
		//~ if (this.fragmentNames.indexOf('y') !== -1){ stringForColour += "y";}
		//~ this.circle.attr("fill",Annotation.colours(stringForColour));
		//~ this.circle.append("svg:title").text(this.fragmentNames);
		this.label.on("mouseover", function(){
			self.graph.setTitle(self.sequences);
		}).on("mouseout", function(){
			self.graph.setTitle("");
		});
		
		
	}
}

PeakAnnotation.prototype.update = function(){
	if (this.primary){
		this.circle.attr("cx", this.graph.x(this.x));
		this.circle.attr("cy", this.graph.y(this.y));
		this.label.attr("x", this.graph.x(this.x));
		this.label.attr("y", this.graph.y(this.y));
	}
}
