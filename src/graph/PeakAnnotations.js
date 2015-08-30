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
	
	this.annotations = [];
	for (var a= 0; a < data.length; a++){
		var fragName = data[a].fragment_name;
		if (fragName.trim() != "") {
			this.annotations.push(fragName);
		}	
	}
	//sort
	this.annotations.sort(function(a, b){
		return a.length - b.length; // ASC -> a - b; DESC -> b - a
	});
}

	
PeakAnnotations.prototype.init = function(){	
	/*	//~ var matchedPeptide = data[0].matchedpeptide;
	//~ this.colour = "grey";
	//~ if (graph.spectrumViewer.pep1 == matchedPeptide.replace(SpectrumViewer.notUpperCase, '')){
		//~ this.colour = SpectrumViewer.p1color;
	//~ }
	//~ if (graph.spectrumViewer.pep2 == matchedPeptide.replace(SpectrumViewer.notUpperCase, '')){
		//~ this.colour = SpectrumViewer.p2color;
	//~ }*/
	
	//create
	this.labels = []; // will be array of d3 selections
	var annotCount = this.annotations.length;
	for (var a = 0; a < annotCount; a++){
		var fragName = this.annotations[a];
		var label = this.peak.graph.annotations.append('text')
			.text(fragName)
			.attr("text-anchor", "middle");
		
		var c;//colour for annotation
		if (fragName.indexOf("_") == -1){ //is not lossi
		
		
		} else { // is lossi
		
		}		
		label.attr("fill", c);				
		this.labels.push(label);
		// this.circle.append("svg:title").text(this.fragmentNames);	
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
