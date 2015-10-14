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


function SpectrumViewer (targetDiv){ // maybe make this param the SVG element
	// targetDiv could be div itself or id of div - lets deal with that
	if (typeof targetDiv === "string"){
		targetDiv = document.getElementById(targetDiv);
	}
	//avoids prob with 'save - web page complete'
	d3.select(targetDiv).selectAll("*").remove();
	
	this.svg = d3.select(targetDiv)
				//~ .append("div").style("height","100%").style("width","100%")
				.append("svg").style("width", "100%").style("height", "85%");
	
	//create peptide frag key
	this.peptideFragKey = new PeptideFragmentationKey(this.svg, this);
	//create graph
	this.graph = new Graph (this.svg, this, {xlabel:"m/z", ylabel:"intensity"});

	//link each to other by registering callbacks
	var gBinding = this.peptideFragKey.highlightChanged.add(this.graph.setHighlights);
	gBinding.context = this.graph;
	var pfBinding = this.graph.highlightChanged.add(this.peptideFragKey.setHighlights);
	pfBinding.context = this.peptideFragKey;
}

SpectrumViewer.cmap = colorbrewer.Paired[6];
SpectrumViewer.p1color = SpectrumViewer.cmap[5];
SpectrumViewer.p1color_loss = SpectrumViewer.cmap[4];
SpectrumViewer.p2color = SpectrumViewer.cmap[1];
SpectrumViewer.p2color_loss = SpectrumViewer.cmap[0];
SpectrumViewer.lossFragBarColour = "#cccccc";
SpectrumViewer.highlightColour = "yellow";
SpectrumViewer.highlightWidth = 11;
SpectrumViewer.notUpperCase = /[^A-Z]/g;


SpectrumViewer.prototype.setData = function(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaksCSV){
	this.pep1 = pepSeq1.replace(SpectrumViewer.notUpperCase, '');
    this.pep2 = pepSeq2.replace(SpectrumViewer.notUpperCase, '');
	this.annotatedPeaks = d3.csv.parse(annotatedPeaksCSV.trim());
	this.linkPos1 = linkPos1;
	this.linkPos2 = linkPos2;
	this.lossyShown = false;
	this.peptideFragKey.setData(this.pep1, this.linkPos1, this.pep2, this.linkPos2, this.annotatedPeaks);
	//graph doesn't need peptide sequences and link positions, only annotated peaks
	this.graph.setData(this.annotatedPeaks);

	/* #writes additional info into the plot, mz, precursor charge etc.
    if annotate_verbose:
        pre_info = "search: {} \n PSMID: {}\n scan: {}\n m/z: {}\n z: {}\n\n score: {:.2f} \n mean(ppmerror): {:.2f} \n std(ppmerror): {:.2f}".format(
                    cl_pep.meta["search_id"], cl_pep.meta['spectrum_id'], cl_pep.scan, np.round(cl_pep.get_mz() + 1.002, 4), cl_pep.charge, cl_pep.score, ppmmean, ppmstds)
    else:
        pre_info = "PSMID: {}\n m/z: {}\n z:{}".format(
                    cl_pep.meta['spectrum_id'], round(cl_pep.get_mz() + 1.002, 4), cl_pep.charge)

    #write info about the PSMID into right iddle of the plot
    */
}

SpectrumViewer.prototype.clear = function(){
	this.pep1 = "";
	this.pep2 = "";
	//~ this.lossyShown = false;
	this.peptideFragKey.clear();
	this.graph.clear();
}

SpectrumViewer.prototype.resize = function(){
	this.graph.resize();
}

SpectrumViewer.prototype.getSVG = function(){
	var svgXml = this.svg[0][0].parentNode.innerHTML;
    svgXml = svgXml.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ev="http://www.w3.org/2001/xml-events" ')
	
	return '<?xml version="1.0" encoding="UTF-8" standalone=\"no\"?>' 
		+ "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">"
		+ svgXml;	
}

SpectrumViewer.prototype.showLossy = function(show){
	this.lossyShown = show;
	this.peptideFragKey.clear();
	this.peptideFragKey.setData(this.pep1, this.linkPos1, this.pep2, this.linkPos2, this.annotatedPeaks);
	this.graph.setData(this.annotatedPeaks);
}

//SpectrumViewer.prototype.destroy(){} //if multiple viewers need to make sure don't cause memory leaks, see -
//http://www.interworks.com/blogs/mgardner/2009/08/31/avoiding-memory-leaks-and-javascript-best-practices

