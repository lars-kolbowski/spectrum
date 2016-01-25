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
//		authors: Sven Giese, Colin Combe, Lars Kolbowski
//
//		FragKey/fragment.js

function KeyFragment (fragments, index, offset, peptide, FragKey) {
	this.FragKey = FragKey;
	this.peptide = peptide;
	this.fragments = Array();

	var yfrag_index = peptide.length - (index + 1 - offset);
	var bfrag_index = (index + 1 - offset);
	if (peptide == this.FragKey.model.pep1)
		var color = this.FragKey.model.p1color;
	else
		var color = this.FragKey.model.p2color;

	var peakCount = FragKey.model.points.length;
	for (var p = 0; p < peakCount; p++) {
		var peak = FragKey.model.points[p];
		var fragCount = peak.fragments.length;
		for (var pf = 0; pf < fragCount; pf++) {
			var frag = peak.fragments[pf];
			var pepSeq = frag.peptide;
			if (peptide == frag.peptide
				&& ((frag.ionType == 'y' && frag.ionNumber == yfrag_index) ||(frag.ionType == 'b' && frag.ionNumber == bfrag_index))
				) {
				if (!_.contains(this.fragments, frag))
					this.fragments.push(frag);
			}
		}
	}	

	var xStep = 20;

	this.x = (xStep * index) + (xStep / 2);
	if (this.peptide == this.FragKey.model.pep1)
		var y = 25;
	else
		var y = 75;
	var barHeight = 18, tailX = 5, tailY = 5;

	var self = this;

	//svg elements
	this.g = this.FragKey.highlights.append('g');

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
	group.onclick = function(evt) {
		self.FragKey.model.updateStickyHighlight(self.fragments, evt.ctrlKey);
	};

	function startHighlight(){
		self.FragKey.model.addHighlight(self.fragments);	
	}
	function endHighlight(){
		self.FragKey.model.clearHighlight(self.fragments);	
	}
	// # bions; either normal or lossy; have different colors
	if (fragments.indexOf("b") != -1){ // really a, b, or c , see get_fragment_annotation()
	
		var highlightPath = "M" + this.x+ "," + (y - barHeight) 
							+" L" + this.x+ "," +  y 
							+ " L" + (this.x- tailX) + "," + (y + tailY);
			
		this.bHighlight = this.g.append("path")
			.attr("d", highlightPath)
			.attr("stroke", this.FragKey.model.highlightColour)
			.attr("stroke-width", this.FragKey.model.highlightWidth)
			.attr("opacity", 0)						
			.attr("peptide", this.peptide)
			.attr("fragKeyIndex", index);
		
					
		this.bTail = this.g.append("line")
			.attr("x1", this.x)
			.attr("y1", y)
			.attr("x2", this.x- tailX)
			.attr("y2", y + tailY)
			.attr("peptide", peptide)
			.attr("fragKeyIndex", index)
			.attr("class", "fragBar");

		this.btext = this.g.append("text")
			.attr("x", this.x - 7)
			.attr("y", y + 15)			
			.style("font-size", "0.6em")
			.style("fill", color)
			//.attr("text-anchor", "middle")
			.text("b"+bfrag_index)
			.attr("opacity", 0);	

		// if "bloss" in fgm:
		if (fragments.indexOf("bloss") != -1){
			this.bTail.attr("stroke", this.FragKey.model.lossFragBarColour);
		}
		else {
			this.bTail.attr("stroke", "black");
		}
			
	}

	// # yions; either normal or lossy; have different colors
	if (fragments.indexOf("y") != -1){
		var highlightPath = "M" + this.x+ "," + y 
							+" L" + this.x+ "," +  (y - barHeight) 
							+ " L" + (this.x+ tailX) + "," + (y  - barHeight - tailY);
			
		this.yHighlight = this.g.append("path")
			.attr("d", highlightPath)
			.attr("stroke",this.FragKey.model.highlightColour)
			.attr("stroke-width", this.FragKey.model.highlightWidth)
			.attr("opacity", 0)
			.attr("peptide", this.peptide)
			.attr("fragKeyIndex", index);
		
		
		this.yTail = this.g.append("line")
			.attr("x1", this.x)
			.attr("y1", y - barHeight)
			.attr("x2", this.x + tailX)
			.attr("y2", y - barHeight - tailY)
			.attr("peptide", peptide)
			.attr("fragKeyIndex", index)
			.attr("class", "fragBar");

		this.ytext = this.g.append("text")
			.attr("x", this.x - 2)
			.attr("y", y - barHeight - 7)			
			.style("font-size", "0.6em")
			.style("fill", color)
			//.attr("text-anchor", "end")
			.text("y"+yfrag_index)
			.attr("opacity", 0);
		// if "yloss"
		if (fragments.indexOf("yloss") != -1){
			this.yTail.attr("stroke", this.FragKey.model.lossFragBarColour);
		}
		else {
			this.yTail.attr("stroke", "black");
		}
	}

	var fragBar = this.g.append("line")
		.attr("x1", this.x)
		.attr("y1", y)
		.attr("x2", this.x)
		.attr("y2", y - barHeight)
		.attr("peptide", peptide)
		.attr("fragKeyIndex", index)
		.attr("class", "fragBar");
		
	var lossCount = (fragments.match(/loss/g) || []).length;
	if (lossCount == 2 || fragments == "-yloss" || fragments == "bloss-"){
		fragBar.attr("stroke", this.FragKey.model.lossFragBarColour);
	}
	else {
		fragBar.attr("stroke", "black");
	}
			
}

KeyFragment.prototype.highlight = function(show, fragments){
	if(show === true){
		for(f = 0; f < fragments.length; f++){
			if(fragments[f].ionType == "b" && this.bHighlight){
				this.bHighlight.attr("opacity", 1);
				this.btext.attr("opacity", 1);
			}
			if (fragments[f].ionType == "y" && this.yHighlight){
				this.yHighlight.attr("opacity", 1);
				this.ytext.attr("opacity", 1);
			}
		}
	}
	else{
		if (this.yHighlight){
			this.yHighlight.attr("opacity", 0);
			this.ytext.attr("opacity", 0);
		}
		if (this.bHighlight){
			this.bHighlight.attr("opacity", 0);	
			this.btext.attr("opacity", 0);
		}	
	}
}