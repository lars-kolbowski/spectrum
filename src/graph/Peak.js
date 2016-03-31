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
//		authors: Colin Combe, Lars Kolbowski
//
//		graph/Peak.js

function Peak (id, graph){
	var peak = graph.model.JSONdata.peaks[id];

	this.x = peak.mz;
	this.y = peak.intensity;
	this.IsotopeClusters = [];
	this.labels = [];
	for (i=0; i<peak.clusterIds.length; i++)
		this.IsotopeClusters.push(graph.model.JSONdata.clusters[peak.clusterIds[i]]);
	this.clusterIds = peak.clusterIds
	this.graph = graph;

	//make fragments
	var notLossyFragments = [];
	var lossyFragments = [];
	this.isMonoisotopic = false;
	for (var i = 0; i < this.IsotopeClusters.length; i++) {
		this.isotope = id - this.IsotopeClusters[i].firstPeakId;
		if (this.isotope == 0)
			this.isMonoisotopic = true;
	};

	var fragments = graph.model.fragments;

	for (var f = 0; f < fragments.length; f++) {
		if(_.intersection(fragments[f].clusterIds, peak.clusterIds).length != 0){
			if(fragments[f].class == "lossy")
				lossyFragments.push(fragments[f]);
			else
				notLossyFragments.push(fragments[f]);
		}				
	};

	this.fragments = notLossyFragments.concat(lossyFragments); //merge arrays
/*
	if (this.IsotopeClusters.length > 0){
		var fragments = graph.model.JSONdata.fragments;
		for(i=0; i<fragments.length; i++){
			for(j=0; j<this.IsotopeClusters.length; j++){
				if(_.contains(fragments[i].clusterIds, this.IsotopeClusters[j].id)){
					//var frag = new Fragment (fragments[i]);
					if(fragments[i].class == "lossy")
						lossyFragments.push(fragments[i]);
					else
						notLossyFragments.push(fragments[i]);
				}
			}
		}
	};

	this.fragments = notLossyFragments.concat(lossyFragments); //merge arrays*/


	//make tooltip
	this.tooltip =[];
	this.tooltip[0] = " m/z: " + this.x + ", i: " + this.y;
	var fragCount = this.fragments.length;
	for (var f = 0; f < fragCount; f++){
		//get right cluster for peak
		index = 0
		for (var i = 0; i < this.clusterIds.length; i++) {
			if(this.fragments[f].clusterInfo.indexOf(this.clusterIds[i]) != -1)
				index = this.fragments[f].clusterInfo.indexOf(this.clusterIds[i])
				cluster = graph.model.JSONdata.clusters[this.clusterIds[i]]
		}
		
		charge = cluster.charge;
		error = this.fragments[f].clusterInfo[index].error.toFixed(2)+" "+this.fragments[f].clusterInfo[index].errorUnit;
		this.tooltip.push(this.fragments[f].name + " (" + this.fragments[f].sequence + ") - " + "charge: " + charge + ", error: " + error);
	};


	//svg elements
	this.g = this.graph.peaks.append('g');

	if (this.fragments.length > 0) {
		this.highlightLine = this.g.append('line')
							.attr("stroke", this.graph.model.highlightColour)
							.attr("stroke-width", this.graph.model.highlightWidth)
							.attr("opacity","0");
		this.highlightLine.attr("x1", 0);
		this.highlightLine.attr("x2", 0);
				
		//set the dom events for it
		var self = this;
		var group = this.g[0][0];
		group.onmouseover = function(evt) {
			showTooltip(evt.clientX, evt.clientY);
			startHighlight();
		};
		group.onmouseout = function(evt) {
			hideTooltip();
			endHighlight();
		};
		group.ontouchstart = function(evt) {
			showTooltip(evt.clientX, evt.clientY);
			startHighlight();
		};
		group.ontouchend = function(evt) {
			hideTooltip();
			endHighlight();
		};
		group.onclick = function(evt){
			stickyHighlight(evt.ctrlKey);
		}

		function showTooltip(x, y, fragId){
			for (var i = 0; i < self.fragments.length; i++) {
				if (self.fragments[i].id == fragId)
					var fragname = self.fragments[i].name
			};
			if(fragId){
				for (var i = 1; i < self.tooltip.length; i++) {
					if(self.tooltip[i].indexOf(fragname) != -1)
						var frag_tooltip = self.tooltip[i]; 
				};
				self.graph.tip.html(self.tooltip[0] + "<br/>" + frag_tooltip);
			}
			else
				self.graph.tip.html(self.tooltip.join("<br/>"));

			var offset = $(self.graph.g.node().parentNode.parentNode.parentNode).position();
			self.graph.tip.style("opacity", 1)
					.style("left", (offset.top+x + 20) + "px")
					.style("top", (offset.left+y - 28) + "px")
					
		}
		function hideTooltip(){
			self.graph.tip.style("opacity", 0);
		}
		function startHighlight(fragId){
			var fragments = [];
			if(fragId){
				for (var i = 0; i < self.fragments.length; i++) {
					if(self.fragments[i].id == parseInt(fragId))
						fragments.push(self.fragments[i]);	
				};
			}
			else	
				fragments = self.fragments;
			self.graph.model.addHighlight(fragments);	
		}
		function endHighlight(){
			self.graph.tip.style("opacity", 0)
			self.graph.model.clearHighlight(self.fragments);	
		}
		function stickyHighlight(ctrl, fragId){
			var fragments = [];
			if(fragId){
				for (var i = 0; i < self.fragments.length; i++) {
					if(self.fragments[i].id == parseInt(fragId))
						fragments.push(self.fragments[i]);	
				};
			}
			else	
				fragments = self.fragments;
			self.graph.model.updateStickyHighlight(fragments, ctrl);
		}

		if (this.isMonoisotopic){
		  	//create frag labels
		  	//labeldrag	
			this.labelDrag = d3.behavior.drag();
			this.labelDrag.on("dragstart", function(){
				for(l=0; l<self.labelLines.length; l++)
					self.labelLines[l].attr("opacity", 1);
			});
			this.labelDrag.on("drag", function() {
				var coords = d3.mouse(this);
				var fragId = this.getAttribute("fragId");
				for (var f = 0; f < self.fragments.length; f++){
					if(self.fragments[f].id == fragId){
						var curLabelLine = self.labelLines[f];
						self.labelHighlights[f].attr("x", coords[0]);
						self.labels[f].attr("x", coords[0]);
						self.labelHighlights[f].attr("y", coords[1]);
						self.labels[f].attr("y", coords[1]);
					}
				}
				var startX = self.graph.x(self.x);
				var startY = self.graph.y(self.y)
				var mouseX = coords[0]-startX;
				var mouseY = coords[1];
				var r = Math.sqrt((mouseX * mouseX) + ((mouseY-startY) * (mouseY-startY) ))
				if (r > 15 )
					curLabelLine
						.attr("opacity", 1)
						.attr("x1", 0)
						.attr("x2", mouseX)
						.attr("y1", startY)
						.attr("y2", mouseY);
				else
					curLabelLine.attr("opacity", 0);
			});	
			this.labels = []; // will be array of d3 selections
			this.labelHighlights = []; // will be array of d3 selections
			this.labelLines = []; // will be array of d3 selections
			var fragCount = this.fragments.length;
			for (var f = 0; f < fragCount; f++){
				var frag = this.fragments[f];
				var labelHighlight, label;
				if (frag.class != "lossy"){
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
						.style("cursor", "default")
						.attr("fragId", frag.id)
						.attr("stroke", this.graph.model.highlightColour);
				label.text(frag.name)
						.attr("x", 0)
						.attr("text-anchor", "middle")
						.style("font-size", "0.8em")
						.style("cursor", "default")
						.attr("fragId", frag.id)
						.attr("class", "peakAnnot");
				labelLine = self.g.append("line")
		  			.attr("stroke-width", 1)
					.attr("stroke", "Black")
					.style("stroke-dasharray", ("3, 3"));
						
				label[0][0].onmouseover = function(evt) {
					if(!self.graph.model.moveLabels){
						startHighlight(this.getAttribute("fragId"));
						showTooltip(evt.clientX, evt.clientY, this.getAttribute("fragId"));
					}
				};
				label[0][0].onmouseout = function(evt) {
					if(!self.graph.model.moveLabels){				
						endHighlight();
						hideTooltip();
					}
				};
				label[0][0].ontouchstart = function(evt) {
					if(!self.graph.model.moveLabels){
						startHighlight(this.getAttribute("fragId"));
						showTooltip(evt.clientX, evt.clientY, this.getAttribute("fragId"));
					}
				};
				label[0][0].ontouchend = function(evt) {
					if(!self.graph.model.moveLabels){			
						endHighlight();
						hideTooltip();
					}
				};
				label[0][0].onclick = function(evt) {
					stickyHighlight(evt.ctrlKey, this.getAttribute("fragId"));
				};
				labelHighlight[0][0].onmouseover = function(evt) {
					if(!self.graph.model.moveLabels){
						startHighlight(this.getAttribute("fragId"));
						showTooltip(evt.clientX, evt.clientY, this.getAttribute("fragId"));
					}
				};
				labelHighlight[0][0].onmouseout = function(evt) {
					if(!self.graph.model.moveLabels){			
						endHighlight();
						hideTooltip();
					}
				};
				labelHighlight[0][0].ontouchstart = function(evt) {
					if(!self.graph.model.moveLabels){
						startHighlight(this.getAttribute("fragId"));
						showTooltip(evt.clientX, evt.clientY, this.getAttribute("fragId"));
					}
				};
				labelHighlight[0][0].ontouchend = function(evt) {
					if(!self.graph.model.moveLabels){			
						endHighlight();
						hideTooltip();
					}
				};
				labelHighlight[0][0].onclick = function(evt) {
					stickyHighlight(evt.ctrlKey, this.getAttribute("fragId"));
				};
				
				var c = "pink";//colour for annotation
				var pepIndex = frag.peptideId+1;
				if (frag.class == "non-lossy"){
					c = this.graph.model["p" + pepIndex + "color"];
				} else { // is lossy
					c = this.graph.model["p" + pepIndex + "color_loss"]; //javascript lets you do this...
				}
				label.attr("fill", c);
				this.labels.push(label);
				this.labelHighlights.push(labelHighlight);
				this.labelLines.push(labelLine);
			}
		}
		this.highlight(false);
	}
	this.line = this.g.append('line').attr("stroke-width","1");
	this.line.attr("x1", 0);
	this.line.attr("x2", 0);

	this.colour = this.graph.model.lossFragBarColour;
	if (this.fragments.length > 0){
		if (this.isMonoisotopic){
			if (this.fragments[0].peptideId == 0) {
				if (this.fragments[0].class == "non-lossy")
					this.colour = this.graph.model.p1color;
				else if (this.fragments[0].class == "lossy")
					this.colour = this.graph.model.p1color_loss;	
			}
			else if (this.fragments[0].peptideId == 1) {
				if (this.fragments[0].class == "non-lossy")
					this.colour = this.graph.model.p2color;
				else if (this.fragments[0].class == "lossy")
					this.colour = this.graph.model.p2color_loss;			
			}
		}
		else {
			if(this.fragments[0].peptideId == 0)
				this.colour = this.graph.model.p1color_cluster;
			if(this.fragments[0].peptideId == 1)
				this.colour = this.graph.model.p2color_cluster;
		}
	}
	this.line.attr("stroke", this.colour);
}

Peak.prototype.highlight = function(show, fragments){
	if (show == true) {
		this.highlightLine.attr("opacity","1");
		for (var f = 0; f < this.labels.length; f++){
			if ( _.contains(fragments, this.fragments[f]) ){
				this.labelHighlights[f].attr("opacity", 1);
				this.labels[f].attr("display", "inline");
				this.labelHighlights[f].attr("display", "inline");
			}
		}
		this.graph.peaks[0][0].appendChild(this.g[0][0]);
		this.line.attr("stroke", this.colour);
/*		for (var b = 0; b < this.IsotopeCluster.points.length; b++ )
			this.IsotopeCluster.points[b].line.attr("stroke", this.colour);*/
	} else {
		this.highlightLine.attr("opacity",0);
		for (var a = 0; a < this.labels.length; a++){
			this.labelHighlights[a].attr("opacity", 0);
		}
	}
}

Peak.prototype.update = function(){
	if (this.labels.length > 0){
		for(l=0; l<this.labelLines.length; l++)
			this.labelLines[l]
				.attr("opacity", 0)
				.attr("x1", 0)
				.attr("x2", 0)
				.attr("y1", 0)
				.attr("y2", 0)
		}
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
	var labelCount = this.labels.length;
	for (var a = 0; a < labelCount; a++){
		this.labels[a].attr("x", this.graph.x(this.x));
		this.labelHighlights[a].attr("x", this.graph.x(this.x));
		if (	(this.x > xDomain[0] && this.x < xDomain[1])	//in current range
			 && (this.graph.lossyShown === true || this.fragments[a].class == "non-lossy" || _.intersection(this.graph.model.sticky, this.fragments).length != 0)	//lossy enabled OR not lossy OR isStickyFrag
			 && (_.intersection(this.graph.model.sticky, this.fragments).length != 0 || this.graph.model.sticky.length == 0))	//isStickyFrag OR no StickyFrags
		{
			this.labels[a].attr("display","inline");
			this.labelHighlights[a].attr("display","inline");
		} else {
			this.labels[a].attr("display","none");
			this.labelHighlights[a].attr("display","none");
		}	
	}

}

Peak.prototype.updateY = function(){
	this.line.attr("y1", this.graph.y(this.y));
	this.line.attr("y2", this.graph.y(0));

	if (this.labels.length > 0) {
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
	var labelCount = this.labels.length;
	for (var a = 0; a < labelCount; a++){
		this.labels[a].attr("display", "none");
		this.labelHighlights[a].attr("display", "none");
		this.labelLines[a].attr("opacity", 0);
	}
}

Peak.prototype.showLabels = function(lossyOverride){
	var xDomain = this.graph.x.domain();
	var labelCount = this.labels.length;
	for (var a = 0; a < labelCount; a++){
		if ((this.x > xDomain[0] && this.x < xDomain[1])
				&& (this.graph.lossyShown === true || this.fragments[a].class == "non-lossy" || lossyOverride == true)) {
			this.labels[a].attr("display", "inline");
			this.labelHighlights[a].attr("display", "inline");
			this.labelLines[a].attr("opacity", 1);
		}
	}
}

Peak.prototype.updateColor = function(){
	this.colour = this.graph.model.lossFragBarColour;
	if (this.fragments.length > 0){
		if (this.isMonoisotopic){
			if (this.fragments[0].peptideId == 0) {
				if (this.fragments[0].class == "non-lossy")
					this.colour = this.graph.model.p1color;

				else if (this.fragments[0].class == "lossy")
					this.colour = this.graph.model.p1color_loss;	
			}
			else if (this.fragments[0].peptideId == 1) {
				if (this.fragments[0].class == "non-lossy")
					this.colour = this.graph.model.p2color;
				else if (this.fragments[0].class == "lossy")
					this.colour = this.graph.model.p2color_loss;			
			}
		}
		else {
			if(this.fragments[0].peptideId == 0)
				this.colour = this.graph.model.p1color_cluster;
			if(this.fragments[0].peptideId == 1)
				this.colour = this.graph.model.p2color_cluster;
		}
	}
	this.line.attr("stroke", this.colour);
	for (var i = 0; i < this.labels.length; i++)
		this.labels[i].attr("fill", this.colour);	
}