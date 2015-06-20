//		a spectrum viewer
//		Copyright 2015 Rappsilber Laboratory
//
//		author: Colin Combe
//		
//		SpectrumViewer.js

function SpectrumViewer (pepFragDiv, graphDiv){
	//create peptide frag key
	this.peptideFragKey = new PeptideFragmentationKey(pepFragDiv);
	//create graph
	this.graph = new Graph (graphDiv);
	//link each to other by registering callbacks
	this.peptideFragKey.highlightChangedCallbacks.push(this.graph.setHighlights);
	this.graph.highlightChangedCallbacks.push(this.peptideFragKey.setHighlights);
}

SpectrumViewer.prototype.setData = function(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaksCSV){
	var annotatedPeaks = d3.csv.parse(annotatedPeaksCSV);
	this.peptideFragKey.setData(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaks);
	//graph doesn't need peptide sequences and link positions, only annotated peaks
	this.graph.setData(annotatedPeaks);
}

SpectrumViewer.prototype.clear = function(){
	this.peptideFragKey.clear();
	this.graph.clear();
}

//SpectrumViewer.prototype.destroy(){} //need to make sure don't cause memory leaks, see -
//http://www.interworks.com/blogs/mgardner/2009/08/31/avoiding-memory-leaks-and-javascript-best-practices

SpectrumViewer.emptyElement = function(element) {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
};
