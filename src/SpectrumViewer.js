//		a spectrum viewer
//      Copyright  2015 Rappsilber Laboratory
// 
// 		Licensed under the Apache License, Version 2.0 (the "License");
// 		you may not use this file except in compliance with the License.
// 		You may obtain a copy of the License at
// 
// 		http://www.apache.org/licenses/LICENSE-2.0
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
	d3.select(targetDiv).style("position","relative").selectAll("*").remove();
	//~ this.targetDiv = d3.select(targetDiv).style("height", "100%");//.style("overflow","hidden");
	
	this.svg = d3.select(targetDiv).append("svg").style("width", "100%").style("height", "100%");
	//create peptide frag key
	this.peptideFragKey = new PeptideFragmentationKey(this.svg);
	//create graph
	this.graph = new Graph (this.svg);
	
	//link each to other by registering callbacks
	//~ this.peptideFragKey.highlightChangedCallbacks.push(this.graph.setHighlights);
	//~ this.graph.highlightChangedCallbacks.push(this.peptideFragKey.setHighlights);
}

SpectrumViewer.prototype.setData = function(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaksCSV){
	var annotatedPeaks = d3.csv.parse(annotatedPeaksCSV.trim());
	this.peptideFragKey.setData(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaks);
	//graph doesn't need peptide sequences and link positions, only annotated peaks
	this.graph.setData(annotatedPeaks);
}

SpectrumViewer.prototype.clear = function(){
	this.peptideFragKey.clear();
	this.graph.clear();
}

SpectrumViewer.prototype.resize = function(){
	//~ this.peptideFragKey.clear();
	//~ this.graph.clear();
	this.graph.resize()();
}

//SpectrumViewer.prototype.destroy(){} //if multiple viewers need to make sure don't cause memory leaks, see -
//http://www.interworks.com/blogs/mgardner/2009/08/31/avoiding-memory-leaks-and-javascript-best-practices

