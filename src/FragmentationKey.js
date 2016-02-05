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
//		based on Sven's python code, bits of python code left in as comments, can tidy later
//
//		scope for refactoring all this to make more use of Fragment object type, I think 
//
//		PeptideFragmentationKey.js

function PeptideFragmentationKey (targetSvg, model, options){
	this.model = model;
	
	this.options = options || {};
	this.margin = {
		"top":    20,
		"right":  20,
		"bottom": 40,
		"left":   40
	};

	this.highlights =  targetSvg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	this.g =  targetSvg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

}

PeptideFragmentationKey.prototype.setData = function(){
	var self = this;
	this.clear();
	var pep1 = "";
	var pep2 = "";
	//var annotatedPeaks = self.model.annotatedPeaks;
	for(i = 0; i < self.model.pep1.length; i++){
		pep1 += self.model.pep1[i].aminoAcid;
	}
	for(i = 0; i < self.model.pep2.length; i++){
		pep2 += self.model.pep2[i].aminoAcid;
	}
	var linkPos1 = self.model.linkPos1;
	var linkPos2 = self.model.linkPos2;
	
	this.pep1ModsArray = [];
	this.pep2ModsArray = [];

	for(i = 0; i < self.model.pep1.length; i++){
		if (self.model.pep1[i].Modification)
			pep1ModsArray[i] = self.model.pep1[i].aminoAcid;
	}

	for(i = 0; i < self.model.pep2.length; i++){
		if (self.model.pep2[i].Modification)
			pep2ModsArray[i] = self.model.pep1[i].aminoAcid;

	}

    // #get ion data for annotation
    // ions1 = set([i.name if "_" not in i.loss else i.name+"loss" for i in
    //              cl_pep.fragment_series["pep1"].get_ions()])
    // ions2 = set([i.name if "_" not in i.loss else i.name+"loss" for i in
    //              cl_pep.fragment_series["pep2"].get_ions()])
/*    var fragRegex = /(.\d*)/g;
    var ions1 = d3.set(), ions2 = d3.set(); //replaced with plain arrays at end
    var pLength = annotatedPeaks.length;
    for (var p = 0; p < pLength; p++){
		var peak = annotatedPeaks[p];
		fragRegex.lastIndex = 0;
		//~ console.log(peak.fragment_name.trim());
		var regexMatch = fragRegex.exec(peak.fragment_name.trim());
		if (peak.fragment_name.trim() != ""){
			//~ console.log(regexMatch[0]);
			if (peak.fragment_name.indexOf("_") == -1){
				ion = regexMatch[0];
			}
			else{
				ion = regexMatch[0] + "loss"
			}
			var matchedPeptide = peak.matchedpeptide.replace(self.model.notUpperCase, '');//uncertain about whether this property includes mod info?
			if (matchedPeptide == pep1){
				ions1.add(ion);
			} else {
				ions2.add(ion);
			}
		}
	}
    ions1 = ions1.values(); // get rid of d3 map, have plain array
    ions2 = ions2.values(); // get rid of d3 map, have plain array
    console.log(ions1);
    console.log(ions2);*/
    var fragments = self.model.JSONdata.fragments;
    var ions1 = [];
    var ions2 = [];
    for (i=0; i < fragments.length; i++){
    	if(fragments[i].peptide == 1)	//still missing in JSON
    		ions1.push(fragments[i]);
    	if(fragments[i].peptide == 2)	//still missing in JSON
    		ions2.push(fragments[i]);
    }

    // #get the indicator array for observed fragments
    var alpha_annotation = get_fragment_annotation(ions1, pep1);
	var beta_annotation = get_fragment_annotation(ions2, pep2);



    // #==========================================================================
    // #    account for crosslink shift
    // #    this alings the peptide sequences at the cross-link site
    // #==========================================================================
    // shift = cl_pep.linkpos1 - cl_pep.linkpos2
    var shift = linkPos1.linkSite - linkPos2.linkSite;
    var spaceArray = arrayOfHashes(Math.abs(shift));
    var linkpos;
    this.pep1offset = 0;
    this.pep2offset = 0;
    if  (shift <= 0) {
        // pep1 = "".join(["#"] * np.abs(shift) + list(pep1))
        pep1 = Array(Math.abs(shift) + 1).join("#") + pep1;
        // alpha_annotation = ["#"] * np.abs(shift) + list(alpha_annotation)
        alpha_annotation = spaceArray.concat(alpha_annotation);
        // linkpos = cl_pep.linkpos2
        linkpos = linkPos2.linkSite;
        this.pep1offset = Math.abs(shift) - 0;
    }
    // else:
    else {
        //~ pep2 = "".join(["#"] * np.abs(shift) + list(pep2))
        pep2 = Array(shift + 1).join("#") + pep2;
        // beta_annotation = ["#"] * np.abs(shift) + list(beta_annotation)
        beta_annotation = spaceArray.concat(beta_annotation);
        // linkpos = cl_pep.linkpos1
        linkpos = linkPos1.linkSite;
        this.pep2offset = shift - 0;
	}

	console.log("linkpos: "+linkpos);

    // diff = len(pep1) - len(pep2)
    var diff = pep1.length - pep2.length;
    spaceArray = arrayOfHashes(Math.abs(diff));
    // if diff <= 0:
    if (diff <= 0) {
        // pep1 = "".join(list(pep1) + ["#"] * np.abs(diff))
        pep1 = pep1 + Array(Math.abs(diff) + 1).join("#");
        // alpha_annotation = list(alpha_annotation) + ["#"] * np.abs(diff)
		alpha_annotation = alpha_annotation.concat(spaceArray);
		//~ this.pep1offset += Math.abs(diff);
	}
    // else:
    else {
        // pep2 = "".join(list(pep2) + ["#"] * np.abs(diff))
        pep2 = pep2 + Array(diff + 1).join("#");
        // beta_annotation = list(beta_annotation) + ["#"] * np.abs(diff)
		beta_annotation = beta_annotation.concat(spaceArray);
		//~ this.pep2offset += diff;
	}
    console.log(alpha_annotation);
    console.log(beta_annotation);
    function arrayOfHashes(n){
		var arr = [];
		for (var a = 0; a < n; a++) {arr.push("#")}
		return arr;
	}

	/*
    #==========================================================================
    #  FRAGMENTATION KEY STARTS HERE
    #==========================================================================
	*/

    var xStep = 20;
    // the letters
    this.pep1letters = [];
    this.pep2letters = [];
    this.pep1ModLetters = [];
    this.pep2ModLetters = [];
    drawPeptide( pep1, this.pep1ModsArray, 20, 5, this.model.p1color, this.pep1letters, this.pep1ModLetters);
    drawPeptide( pep2, this.pep2ModsArray, 71, 86, this.model.p2color, this.pep2letters, this.pep2ModLetters);
    function drawPeptide( pep, mods, y1, y2, colour, pepLetters, modLetters) {
		var l = pep.length;
		for (var i = 0; i < l; i++){
			if (pep[i] != "#") {
				pepLetters[i] = self.g.append("text")
					.attr("x", xStep * i)
					.attr("y", y1)
					.attr("text-anchor", "middle")
					.attr("fill", colour)
					.text(pep[i]);
				if(mods[i]){
					modLetters[i] = self.g.append("text")
						.attr("x", xStep * i)
						.attr("y", y2)
						.attr("text-anchor", "middle")
						.attr("fill", colour)
						.style("font-size", "0.7em")
						.text(mods[i]);
				}
				}
		}
	}

	// the the link line
	self.g.append("line")
		.attr("x1", xStep * (linkpos - 1))//the one...
		.attr("y1", 25)
		.attr("x2", xStep * (linkpos - 1))//the one...
		.attr("y2", 55)
		.attr("stroke", "black")
		.attr("stroke-width", 1.5);

	this.fraglines = new Array();
	var self = this;




    drawFragmentationEvents(alpha_annotation, self.pep1offset, self.model.pep1);	
    drawFragmentationEvents(beta_annotation, self.pep2offset, self.model.pep2);	

	function drawFragmentationEvents( fragAnno, offset, peptide) {
		var l = pep1.length; // shouldn't matter which pep you use
		for (var i = offset; i < l; i++){
			var frag = fragAnno[i];
			if (frag != "#" && frag != "--") {
				//var x = (xStep * i) + (xStep / 2);
				self.fraglines.push(new KeyFragment(frag, i, offset, peptide, self));

			}
		}
	}

	
/*	// def get_fragment_annotation(ions, pep):
	function get_fragment_annotation(ions, pep){
		// """
		// Creates an indicator array for the peptide that contains the information
		// about observed ions.
		//
		// Parameter:
		// -----------------------
		// ions: set,
			  // ion names
		//
		// pep: str,
			 // peptide sequence (without mods)

		var annotation = [];
		// #iterate over peptide and find all fragment ions
		for (var i = 1; i < (pep.length + 1); i++){
			var gotb = "-";
			var goty = "-";

			var aIonId = "a" + i;
			var bIonId = "b" + i;
			var cIonId = "c" + i;

			// if "b"+str(i) in ions or "a"+str(i) in ions or "c"+str(i) in ions:
			if (ions.indexOf(aIonId) != -1 || ions.indexOf(bIonId) != -1 || ions.indexOf(cIonId) != -1){
				gotb = "b";
			}
			// elif "b"+str(i)+"loss" in ions or "a"+str(i)+"loss" in ions or "c"+str(i)+"loss" in ions:
			else if (ions.indexOf(aIonId + "loss") != -1
						|| ions.indexOf(bIonId + "loss") != -1
						|| ions.indexOf(cIonId + "loss") != -1){
				//~ if (self.model.lossyShown == true) 
				gotb = "bloss";
			}

			var xIonId = "x" + (pep.length - i);
			var yIonId = "y" + (pep.length - i);
			var zIonId = "z" + (pep.length - i);

			// if "y"+str(len(pep)-i) in ions or "x"+str(len(pep)-i) in ions or "z"+str(len(pep)-i) in ions:
			if (ions.indexOf(xIonId) != -1 || ions.indexOf(yIonId) != -1 || ions.indexOf(zIonId) != -1){
				goty = "y";
			}
			// elif "y"+str(len(pep)-i)+"loss" in ions or "x"+str(len(pep)-i)+"loss" in ions or "z"+str(len(pep)-i)+"loss" in ions:
			else if (ions.indexOf(xIonId + "loss") != -1
						|| ions.indexOf(yIonId + "loss") != -1
						|| ions.indexOf(zIonId + "loss") != -1) {
				//~ if (self.model.lossyShown == true) 
				goty = "yloss";
			}
			annotation.push(gotb + goty);
		}
		return annotation;
	}*/

}

PeptideFragmentationKey.prototype.clear = function(){
	this.pepSeq1 = null;
	this.pep1offset = null;
	this.linkPos1 = null;
	this.pepSeq2 = null;
	this.pep2offset = null;
	this.linkPos2 = null;
	this.g.selectAll("*").remove();
}

/*PeptideFragmentationKey.prototype.setHighlights = function(fragments){
	this.clearHighlights();
	
	var fragCount = fragments.length;
    if (fragCount > 0){
		greyLetters(this.pep1letters);
		greyLetters(this.pep2letters);
		for (var f = 0; f < fragCount; f++){
			var frag = fragments[f];
			//if (this.model.lossyShown === true || frag.lossy === false) {
				var matchedPeptide = frag.peptide;
				var fragHighlightsArrayName, offset, pepLength, pepLetters, pepColour;
					
				if (this.model.pep1 == matchedPeptide){
					fragHighlightsArrayName = "pep1";
					offset = this.pep1offset;
					pepLength = this.pepSeq1.length
					pepLetters = this.pep1letters;
					pepColour = this.model.p1color;
				}
				else{
					fragHighlightsArrayName = "pep2";
					offset = this.pep2offset;
					pepLength = this.pepSeq2.length
					pepLetters = this.pep2letters;
					pepColour = this.model.p2color;
				}
				var ionType = frag.ionType;
				fragHighlightsArrayName += ionType + "FragHighlights";
				if (ionType == "b") { // or a or c
					this[fragHighlightsArrayName][frag.ionNumber + offset - 1].attr("opacity",1);
					colourLetters(pepLetters, pepColour, 0, (frag.ionNumber + offset));
				} else {
					this[fragHighlightsArrayName][pepLength - frag.ionNumber + offset - 1].attr("opacity",1);
					colourLetters(pepLetters, pepColour, (pepLength - frag.ionNumber + offset), pepLetters.length);
				}
			//}
		}
	}

	function greyLetters (pepLetters){
		var letterCount = pepLetters.length;
		for (var i = 0; i < letterCount; i++){
			if (pepLetters[i]){
				pepLetters[i].attr("fill", SpectrumModel.lossFragBarColour);
			}
		}
	}
	function colourLetters(pepLetters, colour, start, end){
		for (var i = start; i < end; i++){
			if (pepLetters[i]){
				pepLetters[i].attr("fill", colour);
			}
		}
	}	
	
}*/

PeptideFragmentationKey.prototype.greyLetters = function(){
		var self = this;
		grey(this.pep1letters);
		grey(this.pep2letters);
		function grey(pepLetters){ 
			var letterCount = pepLetters.length;
			for (var i = 0; i < letterCount; i++){
				if (pepLetters[i]){
					pepLetters[i].attr("fill", self.model.lossFragBarColour);
				}
			}
		}
	}
PeptideFragmentationKey.prototype.colorLetters = function(fragment){

	if (fragment == "all"){
		color(this.pep1letters, this.model.p1color, 0, this.pep1letters.length);
		color(this.pep2letters, this.model.p2color, 0, this.pep2letters.length);			
	}
	else{
		if (fragment.peptide == this.model.pep1){
			if (fragment.ionType == "b"){
				start = 0;
				end = fragment.ionNumber + this.pep1offset;
			}
			if (fragment.ionType == "y"){
				start = this.pep1letters.length - fragment.ionNumber;
				end = this.pep1letters.length;
			}
			color(this.pep1letters, this.model.p1color, start, end);
			if (	(fragment.ionNumber >= this.model.linkPos1 && fragment.ionType == "b") 
					|| (this.pep1letters.length - fragment.ionNumber < this.model.linkPos1 && fragment.ionType == "y")
				)
				color(this.pep2letters, this.model.p2color, 0, this.pep2letters.length)			
		}
		else{
			if (fragment.ionType == "b"){
				start = 0;
				end = fragment.ionNumber + this.pep2offset;
			}
			if (fragment.ionType == "y"){
				start = this.pep2letters.length - fragment.ionNumber;
				end = this.pep2letters.length;
			}
			color(this.pep2letters, this.model.p2color, start, end);

			if (	(fragment.ionNumber >= this.model.linkPos2 && fragment.ionType == "b") 
					|| (this.pep2letters.length - fragment.ionNumber < this.model.linkPos2 && fragment.ionType == "y")
				)
				color(this.pep1letters, this.model.p1color, 0, this.pep1letters.length)
		}
	}	

	function color(pepLetters, pepColor, start, end){
		for (var i = start; i < end; i++){
			if (pepLetters[i]){
				pepLetters[i].attr("fill", pepColor);
			}
		}	
	}
}	

	
PeptideFragmentationKey.prototype.clearHighlights = function(){

	for (var f = 0; f < this.fraglines.length; f++) {
		if (_.intersection(this.model.sticky, this.fraglines[f].fragments).length == 0) {
			this.fraglines[f].highlight(false);
		}
	}

}
