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

function PeakAnnotation (data, graph){
	this.x = data[0].expmz - 0;
	this.y = data[0].absolute_intensity - 0;
	this.graph = graph;	

	for (var a= 0; a < data.length; a++){
		var annot = data[a];
		if (annot.isprimarymatch == 1) {this.primary = true;}
		annot.fragment_name;	
	}
}
PeakAnnotation.colours = d3.scale.ordinal().range(colorbrewer.Set2[3]);
PeakAnnotation.prototype.init = function(){
	var self = this;
		/*this.label = this.graph.annotations.append('text')
			.text(this.fragmentNames)
			.attr("text-anchor", "middle")
			.attr("fill", this.colour);
		*/	

		// this.circle.append("svg:title").text(this.fragmentNames);

}

PeakAnnotation.prototype.update = function(){
		//~ this.label.attr("x", this.graph.x(this.x));
		//~ this.label.attr("y", this.graph.y(this.y) - 10);
}
