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
//		graph/Peak.js

function Peak (data, graph){
	
	 /*   #prep data, normalize intensities and adjust the axes span
    spec["norm_int"] = (spec["absoluteintesity"] /
                        np.max(spec["absoluteintesity"].values) * 100)*/
	
	this.x = data[0].expmz - 0;
	this.y = data[0].absolute_intensity - 0;
	this.graph = graph;		
	this.annotations = new PeakAnnotations(data, this);
}

Peak.prototype.init = function(){
	this.line = this.graph.peaks.append('line');
	this.annotations.init();
	this.line.attr("stroke", this.annotations.colour);
	this.line.attr("stroke-width","1");// use css
}

Peak.prototype.update = function(){
	this.line.attr("x1", this.graph.x(this.x));
	this.line.attr("y1", this.graph.y(this.y));
	this.line.attr("x2", this.graph.x(this.x));
	this.line.attr("y2", this.graph.y(0));
	this.annotations.update();
}
