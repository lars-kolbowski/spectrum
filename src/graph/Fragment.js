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
//		graph/Fragment.js

function Fragment (data){
	this.name = data.fragment_name.trim();
	this.peptide = data.matchedpeptide;
	
	var ion = this.name.split('')[0];
	if (ion == 'a' || ion == 'b' || ion == 'c') {
		this.ionType = 'b';
	} else {
		this.ionType = 'y';
	}
	
	var fragRegex = /(.(\d*))/g;
	var regexMatch = fragRegex.exec(this.name);
		
    this.ionNumber = regexMatch[2] - 0;
    
	//~ this.peak = peak;	
	//~ this.colour = "grey";
	//~ this.isPrimaryMatch = false;
	//~ 
/*
 	this.clearHighlights();
	var pLength = fragments.length;
    for (var p = 0; p < pLength; p++){
		var peak = fragments[p];
		fragRegex.lastIndex = 0;
		//~ console.log(peak.fragment_name.trim());
		var regexMatch = fragRegex.exec(peak.fragment_name.trim());
		if (peak.fragment_name.trim() != ""){
			//~ console.log(regexMatch[0]);
			console.log(regexMatch[2]);
			var matchedPeptide = peak.matchedpeptide;
			var fragHighlightsArrayName; 
			var offset, pepLength;

			
			if (this.spectrumViewer.pep1 == matchedPeptide){
				fragHighlightsArrayName = "pep1";
				offset = this.pep1offset;
				pepLength = this.pepSeq1.length
			}
			else{
				fragHighlightsArrayName = "pep2";
				offset = this.pep2offset;
				pepLength = this.pepSeq2.length
			}
			var ionType = peak.fragment_name.split("")[0];
			fragHighlightsArrayName += peak.fragment_name.split("")[0] + "FragHighlights";
			if (ionType == "b") { // or a or c
				this[fragHighlightsArrayName][(regexMatch[2] - 0) + offset - 1].attr("opacity",1);
			} else {
				this[fragHighlightsArrayName][pepLength - (regexMatch[2] - 0) + offset - 1].attr("opacity",1);
			}
		}
	}
*/
}

	
Fragment.prototype.init = function(){	
	//create
	this.labels = []; // will be array of d3 selections
	var annotCount = this.annotations.length;
	var unlossiFound = false;
	for (var a = 0; a < annotCount; a++){
		var annotation = this.annotations[a];
		if (annotation.isprimarymatch == true) {
			this.isPrimaryMatch = true;
		}
		var fragName = annotation.fragment_name;
		var label;
		if (fragName.indexOf("_") == -1){ // put lossi peaks in seperate layer
			 label = this.peak.graph.annotations.append('text');
			label.text(fragName)
		} else {
			label = this.peak.graph.lossiAnnotations.append('text');
			label.text(fragName);
			//hack to take out lossi peaks
		}
		label.attr("text-anchor", "middle")
			.attr("class", "peakAnnot");
		
		var c = "pink";//colour for annotation
		var matchedPeptide = annotation.matchedpeptide;
		var pep; 
		if (this.peak.graph.spectrumViewer.pep1 == matchedPeptide){
			pep = "p1";
		}
		else{
			pep = "p2";
		}
		if (fragName.indexOf("_") == -1){ //is not lossi
			c = SpectrumViewer[pep + "color"];	
			this.colour = c;	
			//~ unlossiFound = true;		
		} else { // is lossy
			c = SpectrumViewer[pep + "color_loss"]; //javascript lets you do this...
			//~ if (unlossiFound == false) {
				this.colour = c;
			//~ };
		}		
		label.attr("fill", c);	
		label.append("svg:title").text("m/z: " + this.peak.x + ", i: " + this.peak.y);	// easy tooltip
		this.labels.push(label);
	}
}

Fragment.prototype.update = function(){
	var yStep = 20;
	var labelCount = this.labels.length;
	for (var a = 0; a < labelCount; a++){
		var label = this.labels[a];
		label.attr("x", this.peak.graph.x(this.peak.x));
		label.attr("y", this.peak.graph.y(this.peak.y) - 10 - (yStep * a));
	}
}
