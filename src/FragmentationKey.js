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
	var pepCount = self.model.peptides.length;
	var	linkPos = self.model.JSONdata.LinkSite;
	
	var pepModsArray = [];
	this.peptides = self.model.pepStrs;
	var fragments = self.model.JSONdata.fragments;
	var ions = [];
	var annotations = [];
    this.pepLetters = [];
	this.pepModLetters = [];
	this.pepoffset = [0,0];
	for(p=0; p < pepCount; p++){
		ions[p] = [];
		this.pepLetters[p] = [];
		this.pepModLetters[p] = [];
		pepModsArray[p] = [];
		for(i = 0; i < self.model.peptides[p].length; i++){
			if (self.model.peptides[p][i].Modification)
				pepModsArray[p][i] = self.model.peptides[p][i].Modification;
		}
	}

	for (i=0; i < fragments.length; i++){
		if(typeof fragments[i].peptideId !== 'undefined')
			ions[fragments[i].peptideId].push(fragments[i].name);
	}

	// #get the indicator array for observed fragments
	for(p=0; p < pepCount; p++){
		annotations[p] = get_fragment_annotation(ions[p], this.peptides[p]);
	}

	if (pepCount > 1){
		function arrayOfHashes(n){
			var arr = [];
			for (var a = 0; a < n; a++) {arr.push("#")}
			return arr;
		}
	    // #==========================================================================
	    // #    account for crosslink shift
	    // #    this alings the peptide sequences at the cross-link site
	    // #==========================================================================
	    // shift = cl_pep.linkpos1 - cl_pep.linkpos2
	    var shift = linkPos[0].linkSite - linkPos[1].linkSite;
	    var spaceArray = arrayOfHashes(Math.abs(shift));
	    var linkpos;
	    if  (shift <= 0) {
	        // pep1 = "".join(["#"] * np.abs(shift) + list(pep1))
	        this.peptides[0] = Array(Math.abs(shift) + 1).join("#") + this.peptides[0];
	        // alpha_annotation = ["#"] * np.abs(shift) + list(alpha_annotation)
	        annotations[0] = spaceArray.concat(annotations[0]);
	        // linkpos = cl_pep.linkpos2
	        linkpos = linkPos[1].linkSite+1;
	        this.pepoffset[0] = Math.abs(shift) - 0;
	    }
	    // else:
	    else {
	        //~ pep2 = "".join(["#"] * np.abs(shift) + list(pep2))
	        this.peptides[1] = Array(shift + 1).join("#") + this.peptides[1];
	        // beta_annotation = ["#"] * np.abs(shift) + list(beta_annotation)
	        annotations[1] = spaceArray.concat(annotations[1]);
	        // linkpos = cl_pep.linkpos1
	        linkpos = linkPos[0].linkSite+1;
	        this.pepoffset[1] = shift - 0;
		}

		console.log("linkpos: "+linkpos);

	    // diff = len(pep1) - len(pep2)
	    var diff = this.peptides[0].length - this.peptides[1].length;
	    spaceArray = arrayOfHashes(Math.abs(diff));
	    // if diff <= 0:
	    if (diff <= 0) {
	        // pep1 = "".join(list(pep1) + ["#"] * np.abs(diff))
	        this.peptides[0] = this.peptides[0] + Array(Math.abs(diff) + 1).join("#");
	        // alpha_annotation = list(alpha_annotation) + ["#"] * np.abs(diff)
			annotations[0] = annotations[0].concat(spaceArray);
			//~ this.pep1offset += Math.abs(diff);
		}
	    // else:
	    else {
	        // pep2 = "".join(list(pep2) + ["#"] * np.abs(diff))
	        this.peptides[1] = this.peptides[1] + Array(diff + 1).join("#");
	        // beta_annotation = list(beta_annotation) + ["#"] * np.abs(diff)
			annotations[1] = annotations[1].concat(spaceArray);
			//~ this.pep2offset += diff;
		}
	    console.log(annotations[0]);
	    console.log(annotations[1]);
	}

	/*
    #==========================================================================
    #  FRAGMENTATION KEY STARTS HERE
    #==========================================================================
	*/

    var xStep = 20;
    // the letters
	drawPeptide( this.peptides[0], pepModsArray[0], 20, 5, this.model.p1color, this.pepLetters[0], this.pepModLetters[0]);
	if(this.peptides[1])
    	drawPeptide( this.peptides[1], pepModsArray[1], 71, 83, this.model.p2color, this.pepLetters[1], this.pepModLetters[1]);
	function drawPeptide( pep, mods, y1, y2, colour, pepLetters, modLetters) {
		var l = pep.length;
		var shift = 0;
		for (var i = 0; i < l; i++){
			if (pep[i] != "#") {
				pepLetters[i] = self.g.append("text")
					.attr("x", xStep * i)
					.attr("y", y1)
					.attr("text-anchor", "middle")
					.attr("fill", colour)
					.text(pep[i]);
				if(mods[i-shift]){
					modLetters[i] = self.g.append("text")
						.attr("x", xStep * i)
						.attr("y", y2)
						.attr("text-anchor", "middle")
						.attr("fill", colour)
						.style("font-size", "0.7em")
						.text(mods[i-shift]);
				}
			}
			else
				shift++;
		}
	}
	if(this.peptides[1]){
		// the the link line
		self.g.append("line")
			.attr("x1", xStep * (linkpos - 1))//the one...
			.attr("y1", 25)
			.attr("x2", xStep * (linkpos - 1))//the one...
			.attr("y2", 55)
			.attr("stroke", "black")
			.attr("stroke-width", 1.5);
	}

	this.fraglines = new Array();
	var self = this;




    drawFragmentationEvents(annotations[0], self.pepoffset[0], self.model.pepStrs[0]);
	if(this.peptides[1])	
		drawFragmentationEvents(annotations[1], self.pepoffset[1], self.model.pepStrs[1]);	

	function drawFragmentationEvents( fragAnno, offset, peptide) {
		var l = self.peptides[0].length; // shouldn't matter which pep you use
		for (var i = offset; i < l; i++){
			var frag = fragAnno[i];
			if (frag != "#" && frag != "--") {
				//var x = (xStep * i) + (xStep / 2);
				self.fraglines.push(new KeyFragment(frag, i, offset, peptide, self));

			}
		}
	}

	
	// def get_fragment_annotation(ions, pep):
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
	}

}

PeptideFragmentationKey.prototype.clear = function(){
	this.pepoffset = [];
	this.linkPos = [];
	this.g.selectAll("*").remove();
}

PeptideFragmentationKey.prototype.greyLetters = function(){
	for (i=0; i < this.pepLetters.length; i++){
		var letterCount = this.pepLetters[i].length;
		for (j = 0; j < letterCount; j++){
			if (this.pepLetters[i][j])
				this.pepLetters[i][j].attr("fill", this.model.lossFragBarColour);
			if (this.pepModLetters[i][j])
				this.pepModLetters[i][j].attr("fill", this.model.lossFragBarColour);				
		}
	}
}

PeptideFragmentationKey.prototype.colorLetters = function(fragment){
	var self = this;
	if (fragment == "all"){
		color(0, this.model.p1color, 0, this.pepLetters[0].length);
		if(this.peptides[1])
			color(1, this.model.p2color, 0, this.pepLetters[1].length);			
	}
	else{
		for (i=0; i < fragment.range.length; i++){
			if (fragment.range[i].peptideId == 0)
				color(0, this.model.p1color, fragment.range[i].from, fragment.range[i].to+1);
			if (fragment.range[i].peptideId == 1)
				color(1, this.model.p2color, fragment.range[i].from, fragment.range[i].to+1);
		}
	}	

	function color(pep, pepColor, start, end){
		start += self.pepoffset[pep];
		end += self.pepoffset[pep];
		for (var i = start; i < end; i++){
			if (self.pepLetters[pep][i])
				self.pepLetters[pep][i].attr("fill", pepColor);
			if (self.pepModLetters[pep][i])
				self.pepModLetters[pep][i].attr("fill", pepColor);
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
