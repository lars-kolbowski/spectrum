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
//		authors: Sven Giese, Colin Combe
//
//		based on Sven's python code, bits of python code left in as comments, can tidy later
//
//		scope for refactoring all this to make more use of Fragment object type, I think 
//
//		PeptideFragmentationKey.js

function PeptideFragmentationKey (targetSvg, spectrumViewer, options){
	this.highlightChanged = new signals.Signal();
	this.spectrumViewer = spectrumViewer;
	
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
	var annotatedPeaks = self.spectrumViewer.model.annotatedPeaks;
	this.pepSeq1 = self.spectrumViewer.model.pep1; //contains modification info in lower case
	this.pepSeq2 = self.spectrumViewer.model.pep2; // contains modification info in lower case
	var linkPos1 = self.spectrumViewer.model.linkPos1;
	var linkPos2 = self.spectrumViewer.model.linkPos2;
	
	// def plot_spectrum(cl_pep, XiDB, removeisotopes=False, ppmmean=0, ppmstds=0,
    //               annotate_verbose=True):
	var removeisotopes = false, ppmmean = 0, ppmstds = 0,
				annotate_verbose = true;


	var pep1 = this.pepSeq1.replace(SpectrumViewer.notUpperCase, '');
    var pep2 = this.pepSeq2.replace(SpectrumViewer.notUpperCase, '');

    // #get ion data for annotation
    // ions1 = set([i.name if "_" not in i.loss else i.name+"loss" for i in
    //              cl_pep.fragment_series["pep1"].get_ions()])
    // ions2 = set([i.name if "_" not in i.loss else i.name+"loss" for i in
    //              cl_pep.fragment_series["pep2"].get_ions()])
    var fragRegex = /(.\d*)/g;
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
			var matchedPeptide = peak.matchedpeptide.replace(SpectrumViewer.notUpperCase, '');//uncertain about whether this property includes mod info?
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
    console.log(ions2);

    // #get the indicator array for observed fragments
    var alpha_annotation = get_fragment_annotation(ions1, pep1);
	var beta_annotation = get_fragment_annotation(ions2, pep2);


    // #==========================================================================
    // #    account for crosslink shift
    // #    this alings the peptide sequences at the cross-link site
    // #==========================================================================
    // shift = cl_pep.linkpos1 - cl_pep.linkpos2
    var shift = linkPos1 - linkPos2;
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
        linkpos = linkPos2;
        this.pep1offset = Math.abs(shift) - 0;
    }
    // else:
    else {
        //~ pep2 = "".join(["#"] * np.abs(shift) + list(pep2))
        pep2 = Array(shift + 1).join("#") + pep2;
        // beta_annotation = ["#"] * np.abs(shift) + list(beta_annotation)
        beta_annotation = spaceArray.concat(beta_annotation);
        // linkpos = cl_pep.linkpos1
        linkpos = linkPos1;
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
    drawPeptide( pep1, 20, self.spectrumViewer.p1color, this.pep1letters);
    drawPeptide( pep2, 60, self.spectrumViewer.p2color, this.pep2letters);
    function drawPeptide( pep, y, colour, pepLetters) {
		var l = pep.length;
		for (var i = 0; i < l; i++){
			if (pep[i] != "#") {
				pepLetters[i] = self.g.append("text")
					.attr("x", xStep * i)
					.attr("y", y)
					.attr("text-anchor", "middle")
					.attr("fill", colour)
					.text(pep[i]);
				}
		}
	}

	// the the link line
	self.g.append("line")
		.attr("x1", xStep * (linkpos - 1))//the one...
		.attr("y1", 22)
		.attr("x2", xStep * (linkpos - 1))//the one...
		.attr("y2", 42)
		.attr("stroke", "black")
		.attr("stroke-width", 1.5);

    drawFragmentationEvents(alpha_annotation, 25, self.spectrumViewer.model.pep1);	//self.pepSeq1 same?
    drawFragmentationEvents(beta_annotation, 65, self.spectrumViewer.model.pep2);	//self.pepSeq2 same?

	function drawFragmentationEvents( fragAnno, y, peptide) {
		var l = pep1.length; // shouldn't matter which pep you use
		for (var i = 0; i < l; i++){
			var frag = fragAnno[i];
			if (frag != "#" && frag != "--") {
				var x = (xStep * i) + (xStep / 2);
				
				//~ console.log("frag:"+frag);
		
				var barHeight = 20, tailX = 5, tailY = 5;

				// # bions; either normal or lossy; have different colors
				if (frag.indexOf("b") != -1){ // really a, b, or c , see get_fragment_annotation()
					
					var highlightPath = "M" + x + "," + (y - barHeight) 
										+" L" + x + "," +  y 
										+ " L" + (x - tailX) + "," + (y + tailY);
						
					var bHighlight = self.highlights.append("path")
						.attr("d", highlightPath)
						.attr("stroke", self.spectrumViewer.highlightColour)
						.attr("stroke-width", self.spectrumViewer.highlightWidth)
						.attr("opacity", 0)						
						.attr("peptide", peptide)
						.attr("fragKeyIndex", i);
					
					var line = bHighlight[0][0];
					line.onmouseover = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.onmouseout = function(evt) {
						highlight();
					};
					line.ontouchstart = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.ontouchend = function(evt) {
						highlight();
					};
								
					if (peptide === self.spectrumViewer.pep1) {
						self.pep1bFragHighlights[i] = bHighlight;	
					} else {
						self.pep2bFragHighlights[i] = bHighlight;	
					}
								
					var bTail = self.g.append("line")
						.attr("x1", x)
						.attr("y1", y)
						.attr("x2", x - tailX)
						.attr("y2", y + tailY)
						.attr("peptide", peptide)
						.attr("fragKeyIndex", i)
						.attr("class", "fragBar");
					// if "bloss" in fgm:
					if (frag.indexOf("bloss") != -1){
						bTail.attr("stroke", self.spectrumViewer.lossFragBarColour);
					}
					else {
						bTail.attr("stroke", "black");
					}
					
				line = bTail[0][0];
					line.onmouseover = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.onmouseout = function(evt) {
						highlight();
					};
					line.ontouchstart = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.ontouchend = function(evt) {
						highlight();
					};	
				}

				// # yions; either normal or lossy; have different colors
				if (frag.indexOf("y") != -1){
					var highlightPath = "M" + x + "," + y 
										+" L" + x + "," +  (y - barHeight) 
										+ " L" + (x + tailX) + "," + (y  - barHeight - tailY);
						
					var yHighlight = self.highlights.append("path")
						.attr("d", highlightPath)
						.attr("stroke",self.spectrumViewer.highlightColour)
						.attr("stroke-width", self.spectrumViewer.highlightWidth)
						.attr("opacity", 0)
						.attr("peptide", peptide)
						.attr("fragKeyIndex", i);
					
					var line = yHighlight[0][0];
					line.onmouseover = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.onmouseout = function(evt) {
						highlight();
					};
					line.ontouchstart = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.ontouchend = function(evt) {
						highlight();
					};
								
					if (peptide === self.spectrumViewer.pep1) {
						self.pep1yFragHighlights[i] = yHighlight;	
					} else {
						self.pep2yFragHighlights[i] = yHighlight;	
					}
					
					var yTail = self.g.append("line")
						.attr("x1", x)
						.attr("y1", y - barHeight)
						.attr("x2", x + tailX)
						.attr("y2", y - barHeight - tailY)
						.attr("peptide", peptide)
						.attr("fragKeyIndex", i)
						.attr("class", "fragBar");
					// if "yloss"
					if (frag.indexOf("yloss") != -1){
						yTail.attr("stroke", self.spectrumViewer.lossFragBarColour);
					}
					else {
						yTail.attr("stroke", "black");
					}
				line = yTail[0][0];
					line.onmouseover = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.onmouseout = function(evt) {
						highlight();
					};
					line.ontouchstart = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.ontouchend = function(evt) {
						highlight();
					};
				}

				var fragBar = self.g.append("line")
					.attr("x1", x)
					.attr("y1", y)
					.attr("x2", x)
					.attr("y2", y - barHeight)
					.attr("peptide", peptide)
					.attr("fragKeyIndex", i)
					.attr("class", "fragBar");
					
				var lossCount = (frag.match(/loss/g) || []).length;
				if (lossCount == 2 || frag == "-yloss" || frag == "bloss-"){
					fragBar.attr("stroke", self.spectrumViewer.lossFragBarColour);
				}
				else {
					fragBar.attr("stroke", "black");
				}
				line = fragBar[0][0];
					line.onmouseover = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.onmouseout = function(evt) {
						highlight();
					};
					line.ontouchstart = function(evt) {
						highlight(this.getAttribute("peptide"), this.getAttribute("fragKeyIndex"));
					};
					line.ontouchend = function(evt) {
						highlight();
					};
					
			}
		}
	}

	function highlight(peptide, i){
		self.clearHighlights();
		var pepI;
		if (peptide === self.spectrumViewer.model.pep1){
			if (self.pep1bFragHighlights[i]) self.pep1bFragHighlights[i].attr("opacity",1);
			if (self.pep1yFragHighlights[i]) self.pep1yFragHighlights[i].attr("opacity",1);
			pepI = i - self.pep1offset;
		} else {
			if (self.pep2bFragHighlights[i]) self.pep2bFragHighlights[i].attr("opacity",1);
			if (self.pep2yFragHighlights[i]) self.pep2yFragHighlights[i].attr("opacity",1);
			pepI = i - self.pep2offset;
		}
		self.highlightChanged.dispatch(peptide, pepI);
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
				//~ if (self.spectrumViewer.lossyShown == true) 
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
				//~ if (self.spectrumViewer.lossyShown == true) 
				goty = "yloss";
			}
			annotation.push(gotb + goty);
		}
		return annotation;
	}

}

PeptideFragmentationKey.prototype.clear = function(){
	this.pepSeq1 = null;
	this.pep1offset = null;
	this.linkPos1 = null;
	this.pepSeq2 = null;
	this.pep2offset = null;
	this.linkPos2 = null;
	this.pep1bFragHighlights = [];
	this.pep1yFragHighlights = [];
	this.pep2bFragHighlights = [];
	this.pep2yFragHighlights = [];
	this.g.selectAll("*").remove();
}

PeptideFragmentationKey.prototype.setHighlights = function(fragments){
	this.clearHighlights();
	
	var fragCount = fragments.length;
    if (fragCount > 0){
		greyLetters(this.pep1letters);
		greyLetters(this.pep2letters);
		for (var f = 0; f < fragCount; f++){
			var frag = fragments[f];
			if (this.spectrumViewer.lossyShown === true || frag.lossy === false) {
				var matchedPeptide = frag.peptide;
				var fragHighlightsArrayName, offset, pepLength, pepLetters, pepColour;
					
				if (this.spectrumViewer.pep1 == matchedPeptide){
					fragHighlightsArrayName = "pep1";
					offset = this.pep1offset;
					pepLength = this.pepSeq1.length
					pepLetters = this.pep1letters;
					pepColour = self.spectrumViewer.p1color;
				}
				else{
					fragHighlightsArrayName = "pep2";
					offset = this.pep2offset;
					pepLength = this.pepSeq2.length
					pepLetters = this.pep2letters;
					pepColour = self.spectrumViewer.p2color;
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
			}
		}
	}

	function greyLetters (pepLetters){
		var letterCount = pepLetters.length;
		for (var i = 0; i < letterCount; i++){
			if (pepLetters[i]){
				pepLetters[i].attr("fill", self.spectrumViewer.lossFragBarColour);
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
	
}

	
PeptideFragmentationKey.prototype.clearHighlights = function(){

	clear(this.pep1bFragHighlights);
	clear(this.pep1yFragHighlights);
	clear(this.pep2bFragHighlights);
	clear(this.pep2yFragHighlights);
	
	colour(this.pep1letters, this.spectrumViewer.p1color);
	colour(this.pep2letters, this.spectrumViewer.p2color);
	
	function clear(hightlightArray){
		var pLength = hightlightArray.length;
		for (var p = 0; p < pLength; p++){
			if (hightlightArray[p]){
				hightlightArray[p].attr("opacity",0);
			}
		}	
	}
	
	function colour(pepLetters, colour){
		var pLength = pepLetters.length;
		for (var p = 0; p < pLength; p++){
			if (pepLetters[p]){
				pepLetters[p].attr("fill", colour);
			}
		}	
	}
}
