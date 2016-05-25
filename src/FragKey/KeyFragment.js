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

function KeyFragment (fragments, index, offset, peptideId, FragKey) {
	this.FragKey = FragKey;
	this.peptideId = peptideId;
	this.peptide = FragKey.model.peptides[peptideId];
	
	this.fragments = [];
	this.b = [];
	this.y = [];
	if (fragments.b){
		this.b = fragments.b;
		this.fragments = this.fragments.concat(fragments.b);
	}
	if (fragments.y){
		this.y = fragments.y;
		this.fragments = this.fragments.concat(fragments.y);
	}

	var yfrag_index = this.peptide.sequence.length - (index + 1);
	var bfrag_index = (index + 1);
	if (this.peptideId == 0)
		var color = this.FragKey.model.p1color;
	else if (this.peptideId == 1)
		var color = this.FragKey.model.p2color;



	var xStep = 20;

	this.x = (xStep * (index+offset)) + (xStep / 2);
	if (this.peptideId == 0)
		var y = 25;
	if (this.peptideId == 1)
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
		if (!self.FragKey.changeCL)
			self.FragKey.model.addHighlight(self.fragments);	
	}
	function endHighlight(){
		if (!self.FragKey.changeCL)
			self.FragKey.model.clearHighlight(self.fragments);	
	}
	// # bions; either normal or lossy; have different colors
	if (fragments.b.length != 0){ // really a, b, or c , see get_fragment_annotation()
	
		var highlightPath = "M" + this.x+ "," + (y - barHeight) 
							+" L" + this.x+ "," +  y 
							+ " L" + (this.x- tailX) + "," + (y + tailY);
			
		this.bHighlight = this.g.append("path")
			.attr("d", highlightPath)
			.attr("stroke", this.FragKey.model.highlightColour)
			.attr("stroke-width", this.FragKey.model.highlightWidth)
			.attr("opacity", 0)						
			.attr("peptide", this.peptide)
			.style("cursor", "pointer")
			.attr("fragKeyIndex", index);
		
					
		this.bTail = this.g.append("line")
			.attr("x1", this.x)
			.attr("y1", y)
			.attr("x2", this.x- tailX)
			.attr("y2", y + tailY)
			.attr("peptide", this.peptide)
			.attr("fragKeyIndex", index)
			.style("cursor", "pointer")
			.attr("class", "fragBar");


		var ion = "";
		for (var i = 0; i < fragments.b.length; i++) {
			if(fragments.b[i].type.indexOf("AIon") != -1)
				ion = "a"+bfrag_index;		
			else if(fragments.b[i].type.indexOf("BIon") != -1)
				ion = "b"+bfrag_index;
			else if(fragments.b[i].type.indexOf("CIon") != -1)
				ion = "c"+bfrag_index;
		};

		this.bText = this.g.append("text")
			.attr("x", this.x - 7)
			.attr("y", y + 15)			
			.style("font-size", "0.6em")
			.style("fill", color)
			.style("cursor", "default")
			//.attr("text-anchor", "middle")
			.text(ion)
			.attr("opacity", 0);	

		//check if only lossy fragments
		var blossy = true;
		for (var i = 0; i < fragments.b.length; i++) {
			if(fragments.b[i].class != "lossy")
				blossy = false;
		};
		if (blossy){
			this.bTail.attr("stroke", this.FragKey.model.lossFragBarColour);
		}
		else {
			this.bTail.attr("stroke", "black");
		}
			
	}

	// # yions; either normal or lossy; have different colors
	if (fragments.y.length != 0){
		var highlightPath = "M" + this.x + "," + y 
							+" L" + this.x + "," +  (y - barHeight) 
							+ " L" + (this.x + tailX) + "," + (y  - barHeight - tailY);
			
		this.yHighlight = this.g.append("path")
			.attr("d", highlightPath)
			.attr("stroke", this.FragKey.model.highlightColour)
			.attr("stroke-width", this.FragKey.model.highlightWidth)
			.attr("opacity", 0)
			.attr("peptide", this.peptide)
			.style("cursor", "pointer")
			.attr("fragKeyIndex", index);
		
		
		this.yTail = this.g.append("line")
			.attr("x1", this.x)
			.attr("y1", y - barHeight)
			.attr("x2", this.x + tailX)
			.attr("y2", y - barHeight - tailY)
			.attr("peptide", this.peptide)
			.attr("fragKeyIndex", index)
			.style("cursor", "pointer")
			.attr("class", "fragBar");

		var ion = "";
		for (var i = 0; i < fragments.y.length; i++) {		
			if(fragments.y[i].type.indexOf("XIon") != -1)
				ion = "x"+yfrag_index;		
			else if(fragments.y[i].type.indexOf("YIon") != -1)
				ion = "y"+yfrag_index;
			else if(fragments.y[i].type.indexOf("ZIon") != -1)
				ion = "z"+yfrag_index;
		}
		this.yText = this.g.append("text")
			.attr("x", this.x - 2)
			.attr("y", y - barHeight - 7)			
			.style("font-size", "0.6em")
			.style("fill", color)
			.style("cursor", "default")
			//.attr("text-anchor", "end")
			.text(ion)
			.attr("opacity", 0);

		//check if only lossy fragments
		var ylossy = true;
		for (var i = 0; i < fragments.y.length; i++) {
			if(fragments.y[i].class != "lossy")
				ylossy = false;
		};
		if (ylossy){
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
		.attr("peptide", this.peptide)
		.attr("fragKeyIndex", index)
		.style("cursor", "pointer")
		.attr("class", "fragBar");

	//if all fragments are lossy 	
	if ((fragments.y.length == 0 || ylossy) && (fragments.b.length == 0 || blossy)){
		fragBar.attr("stroke", this.FragKey.model.lossFragBarColour);
	}
	else {
		fragBar.attr("stroke", "black");
	}
			
}

KeyFragment.prototype.highlight = function(show, fragments){
	if(show === true){
		for(f = 0; f < fragments.length; f++){
			if( this.b.indexOf(fragments[f]) != -1 && this.bHighlight){
				this.bHighlight.attr("opacity", 1);
				if (fragments[f].type.indexOf("AIon") != -1 || fragments[f].type.indexOf("BIon") != -1 || fragments[f].type.indexOf("CIon") != -1)
					this.bText.attr("opacity", 1);
			}
			if (this.y.indexOf(fragments[f]) != -1 && this.yHighlight){
				this.yHighlight.attr("opacity", 1);
				if (fragments[f].type.indexOf("XIon") != -1 || fragments[f].type.indexOf("YIon") != -1 || fragments[f].type.indexOf("ZIon") != -1)
					this.yText.attr("opacity", 1);
			}
		}
	}
	else{
		if (this.yHighlight){
			this.yHighlight.attr("opacity", 0);
			this.yText.attr("opacity", 0);
		}
		if (this.bHighlight){
			this.bHighlight.attr("opacity", 0);	
			this.bText.attr("opacity", 0);
		}	
	}
}