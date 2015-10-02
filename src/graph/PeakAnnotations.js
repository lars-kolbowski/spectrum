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
//		graph/PeakAnnotations.js

function PeakAnnotations (data, peak){
	this.peak = peak;	
	this.colour = "grey";
	this.isPrimaryMatch = false;
	
	this.annotations = [];
	for (var a= 0; a < data.length; a++){
		var fragName = data[a].fragment_name;
		if (fragName.trim() != "") {
			this.annotations.push(data[a]);
		}	
	}
	//sort so lossy at top
	this.annotations.sort(function(a, b){
		return a.fragment_name.length - b.fragment_name.length; // ASC -> a - b; DESC -> b - a
	});
}

	
PeakAnnotations.prototype.init = function(){	
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

PeakAnnotations.prototype.update = function(){
	var yStep = 20;
	var labelCount = this.labels.length;
	for (var a = 0; a < labelCount; a++){
		var label = this.labels[a];
		label.attr("x", this.peak.graph.x(this.peak.x));
		label.attr("y", this.peak.graph.y(this.peak.y) - 10 - (yStep * a));
	}
}
