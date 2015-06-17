function Annotation (data, graph){
	this.x = data[0].expmz - 0;
	this.y = data[0].absoluteintesity - 0; //typo in column name
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
Annotation.colours = d3.scale.ordinal().range(colorbrewer.Set2[3]);
Annotation.prototype.init = function(){
	var self = this;
	if (this.primary){
		this.circle = this.graph.annotations.append('circle');
		this.circle.attr("r",15);
		var stringForColour = ""
		if (this.fragmentNames.indexOf('b') !== -1){ stringForColour += "b";}
		if (this.fragmentNames.indexOf('y') !== -1){ stringForColour += "y";}
		//~ console.log(stringForColour);
		this.circle.attr("fill",Annotation.colours(stringForColour));
		this.circle.append("svg:title").text(this.fragmentNames);
		this.circle.on("click", function(){
			self.graph.setTitle(self.sequences);
		});
	}
	//~ else {
		//~ this.circle.attr("r",5);
	//~ }
	//~ this.line.attr("stroke-width","1");
	//~ this.annotation.init();
}

Annotation.prototype.update = function(){
	if (this.primary){
	this.circle.attr("cx", this.graph.x(this.x));
	this.circle.attr("cy", this.graph.y(this.y));
}
	//~ this.line.attr("x2", this.graph.x(this.x));
	//~ this.line.attr("y2", this.graph.y(0));
	//~ this.annotation.update();
}
