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
//		SpectrumViewer.js

function SpectrumViewer (targetDiv){
	// targetDiv could be div itself or id of div - lets deal with that
	if (typeof targetDiv === "string"){
		targetDiv = document.getElementById(targetDiv);
	}
	//avoids prob with 'save - web page complete'
	d3.select(targetDiv).selectAll("*").remove();
		
	this.svg = d3.select(targetDiv).append("svg").style("width", "100%").style("height", "100%");
	//create peptide frag key
	this.peptideFragKey = new PeptideFragmentationKey(this.svg);
	//create graph
	this.graph = new Graph (this.svg, this);
	
	//link each to other by registering callbacks
	//~ this.peptideFragKey.highlightChangedCallbacks.push(this.graph.setHighlights);
	//~ this.graph.highlightChangedCallbacks.push(this.peptideFragKey.setHighlights);
}

// #get colors:
// cmap = brewer2mpl.get_map("Paired", "Qualitative", 6).mpl_colors
SpectrumViewer.cmap = colorbrewer.Paired[6];
// p1color = cmap[5]
// p1color_loss = cmap[4]
// p2color = cmap[1]
// p2color_loss = cmap[0]
// this doesn't account for possibility ion could be in both p1 and p2
SpectrumViewer.p1color = SpectrumViewer.cmap[5];
SpectrumViewer.p1color_loss = SpectrumViewer.cmap[4];
SpectrumViewer.p2color = SpectrumViewer.cmap[1];
SpectrumViewer.p2color_loss = SpectrumViewer.cmap[0];
SpectrumViewer.notUpperCase = /[^A-Z]/g;

SpectrumViewer.prototype.setData = function(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaksCSV){
	this.pep1 = pepSeq1.replace(SpectrumViewer.notUpperCase, '');
    this.pep2 = pepSeq2.replace(SpectrumViewer.notUpperCase, '');
	var annotatedPeaks = d3.csv.parse(annotatedPeaksCSV.trim());
	this.peptideFragKey.setData(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaks);
	//graph doesn't need peptide sequences and link positions, only annotated peaks
	this.graph.setData(annotatedPeaks);
}

SpectrumViewer.prototype.clear = function(){
	this.pep1 = "";
	this.pep2 = "";
	this.peptideFragKey.clear();
	this.graph.clear();
}

SpectrumViewer.prototype.resize = function(){
	this.graph.resize();
}

//SpectrumViewer.prototype.destroy(){} //if multiple viewers need to make sure don't cause memory leaks, see -
//http://www.interworks.com/blogs/mgardner/2009/08/31/avoiding-memory-leaks-and-javascript-best-practices

