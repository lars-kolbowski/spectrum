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
//		PeptideFragmentationKey.js

function PeptideFragmentationKey (targetSvg, options){
	//to contain registered callback functions
	//~ this.highlightChanged = new Signals.Signal();
	this.options = options || {};
	this.margin = {
		"top":    this.options.title  ? 40 : 20,
		"right":  20,
		"bottom": this.options.xlabel ? 60 : 40,
		"left":   this.options.ylabel ? 100 : 80
	};

	this.g =  targetSvg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

}

PeptideFragmentationKey.prototype.setData = function(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaks){
	var self = this;

	this.pepSeq1 = pepSeq1; //contains modification info
	this.linkPos1 = linkPos1;
	this.pepSeq2 = pepSeq2; // contains modification info
	this.linkPos2 = linkPos2;
	this.annotatedPeaks = annotatedPeaks;


	// def plot_spectrum(cl_pep, XiDB, removeisotopes=False, ppmmean=0, ppmstds=0,
    //               annotate_verbose=True):
	var removeisotopes = false, ppmmean = 0, ppmstds = 0,
				annotate_verbose = true;

    // #==========================================================================
    // # retrieve data from DB and cl_pep object
    // #==========================================================================
    // pep1 = cl_pep.peptide1.sequence
    // pep2 = cl_pep.peptide2.sequence
	var pep1 = this.pepSeq1.replace(SpectrumViewer.notUpperCase, '');
    var pep2 = this.pepSeq2.replace(SpectrumViewer.notUpperCase, '');

    // #get modifications
    // mods1_dic = get_mods(unmodified_peps["peptide1"][0])
    // mods2_dic = get_mods(unmodified_peps["peptide2"][0])
	//~ var mods1_dic = get_mods(this.pepSeq1);
    //~ var mods2_dic = get_mods(this.pepSeq2);

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
			var matchedPeptide = peak.matchedpeptide.replace(SpectrumViewer.notUpperCase, '');//uncertain about whether this property includes mod info?sv
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
    // alpha_annotation = get_fragment_annotation(ions1, pep1)
    var alpha_annotation = get_fragment_annotation(ions1, pep1);
    // beta_annotation = get_fragment_annotation(ions2, pep2)
	var beta_annotation = get_fragment_annotation(ions2, pep2);

    // columns = ['expmz', 'absoluteintesity', 'fragment_name', 'sequence',
               // 'mass', 'loss', 'peptide_id', 'scan_number', u'matchedpeptide',
               // 'description', 'matched_peptide_id', 'charge']

    // if removeisotopes:
        // spec = XiDB.get_query("SELECT {} FROM v_spec_viewer_advanced_materialized \
        // where spectrum_match_id = {} and (isprimarymatch like '1' or \
        // isprimarymatch is Null) and (isotope_peak_info = 'monoisotopic' or \
        // isotope_peak_info is Null)".format(",".join(columns),
                                        // cl_pep.meta["spectrum_id"]))
    // else:
        // spec = XiDB.get_query("SELECT {} FROM v_spec_viewer_advanced_materialized \
        // where spectrum_match_id = {} and (isprimarymatch like '1' or \
        // isprimarymatch is Null)".format(",".join(columns),
                                        //~ cl_pep.meta["spectrum_id"]))

    // #==========================================================================
    // #    account for crosslink shift
    // #    this alings the peptide sequences at the cross-link site
    // #==========================================================================
    // shift = cl_pep.linkpos1 - cl_pep.linkpos2
    var shift = linkPos1 - linkPos2;
    var spaceArray = arrayOfSpaces(Math.abs(shift));
    var linkpos;
    //if shift <= 0:
    if  (shift <= 0) {
        // pep1 = "".join(["#"] * np.abs(shift) + list(pep1))
        pep1 = Array(Math.abs(shift) + 1).join("#") + pep1;
        // alpha_annotation = ["#"] * np.abs(shift) + list(alpha_annotation)
        alpha_annotation = spaceArray.concat(alpha_annotation);
        // linkpos = cl_pep.linkpos2
        linkpos = linkPos2;
    }
    // else:
    else {
        //~ pep2 = "".join(["#"] * np.abs(shift) + list(pep2))
        pep2 = Array(shift + 1).join("#") + pep2;
        // beta_annotation = ["#"] * np.abs(shift) + list(beta_annotation)
        beta_annotation = spaceArray.concat(beta_annotation);
        // linkpos = cl_pep.linkpos1
        linkpos = linkPos1;
	}

	console.log("linkpos: "+linkpos);

    // diff = len(pep1) - len(pep2)
    var diff = pep1.length - pep2.length;
    spaceArray = arrayOfSpaces(Math.abs(diff));
    // if diff <= 0:
    if (diff <= 0) {
        // pep1 = "".join(list(pep1) + ["#"] * np.abs(diff))
        pep1 = pep1 + Array(Math.abs(diff) + 1).join("#");
        // alpha_annotation = list(alpha_annotation) + ["#"] * np.abs(diff)
		alpha_annotation = alpha_annotation.concat(spaceArray);
	}
    // else:
    else {
        // pep2 = "".join(list(pep2) + ["#"] * np.abs(diff))
        pep2 = pep2 + Array(diff + 1).join("#");
        // beta_annotation = list(beta_annotation) + ["#"] * np.abs(diff)
		beta_annotation = beta_annotation.concat(spaceArray);
	}
    console.log(alpha_annotation);
    console.log(beta_annotation);
    function arrayOfSpaces(n){
		var arr = [];
		for (var a = 0; a < n; a++) {arr.push("#")}
		return arr;
	}

   /* noise = spec[pd.isnull(spec["fragment_name"])] */ //not sure what this is for

/*
    #==========================================================================
    #  FRAGMENTATION KEY STARTS HERE
    #==========================================================================
    const = 0
    pos_alpha = 0
    pos_beta = 0
    # annotate and plot the amino acids with the modifications
    for AAalpha, AAbeta, idx in zip(pep1, pep2, range(len(pep1))):
        #draw the modifications (cm, ox etc.)
        pos_alpha += draw_mod_annotation(AAalpha, xax_min+10+const,
                                         xmax1, pos_alpha,
                                         mods1_dic, ax)
        pos_beta += draw_mod_annotation(AAbeta, xax_min+10+const,
                                        xmax2-5, pos_beta,
                                        mods2_dic, ax)
        if idx == linkpos:
            ax.plot([xax_min+14+const, xax_min+14+const],
                    [xmax1-2, xmax1-8], color='k', linestyle='-',
                    linewidth=2)
        const += xstep
	*/

    var xStep = 20;
    // the letters
    drawPeptide( pep1, 20, SpectrumViewer.p1color);
    drawPeptide( pep2, 60, SpectrumViewer.p2color);
    function drawPeptide( pep, y, colour) {
		var l = pep.length;
		for (var i = 0; i < l; i++){
			if (pep[i] != "#") {
				self.g.append("text")
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

    // # plot annotation lines
    // const = xstep / 1.5
    // for anno_alpha, anno_beta in zip(alpha_annotation, beta_annotation):
        // plotxy(xax_min+const+10, xmax2-5, ax, xstep/3, fgm=anno_beta)
        // plotxy(xax_min+const+10, xmax1, ax, xstep/3, fgm=anno_alpha)
        // const += xstep

    drawFragmentationEvents(alpha_annotation, 25);
    drawFragmentationEvents(beta_annotation, 65);

	function drawFragmentationEvents( fragAnno, y) {
		var l = pep1.length; // shouldn't matter which pep you use
		for (var i = 0; i < l; i++){
			if (fragAnno[i] != "#" && fragAnno[i] != "--") {
				var x = (xStep * i) + (xStep / 2);
				drawFragmentationEvent( x, y, fragAnno[i]);
			}
		}
	}

	// def plotxy(xcoord, ycoord, ax, lengthstick=20, fgm="by"):
	function drawFragmentationEvent( x, y, frag) {
		// """
		// Plots one of these |^ things for fragmented ions...
		//
		// Paramters:
		// --------------------------
		// xcoord: float,
				// xcoordinate of the line
		// ycoord: float,
				// ycoordinate of the line
		// lengthstick: int
					 // length of the line
		// fgm: char,
			 // fragment ion type decoding
		// """

		var barHeight = 20, tailX = 5, tailY = 5;

		// # bions; either normal or lossy; have different colors
		if (frag.indexOf("b") != -1){ // really a, b, or c , see get_fragment_annotation()
			var bTail = self.g.append("line")
				.attr("x1", x)
				.attr("y1", y)
				.attr("x2", x - tailX)
				.attr("y2", y + tailY)
				.attr("class", "fragBar");
			// if "bloss" in fgm:
			if (frag.indexOf("bloss") != -1){
				// ax.plot([xcoord, xcoord-lengthstick], [ycoord, ycoord-3],
						// color='#E0E0E0', alpha=0.9, linestyle='-', linewidth=2)
				bTail.attr("stroke", SpectrumViewer.lossFragBarColour);
			}
			// elif "b" in fgm or "a" in fgm or "c" in fgm:
			else {
				// ax.plot([xcoord, xcoord-lengthstick], [ycoord, ycoord-3],
						// color='k', linestyle='-', linewidth=2)
				bTail.attr("stroke", "black");
			}
			// else:
				// pass
		}

		// # yions; either normal or lossy; have different colors
		if (frag.indexOf("y") != -1){
			var yTail = self.g.append("line")
				.attr("x1", x)
				.attr("y1", y - barHeight)
				.attr("x2", x + tailX)
				.attr("y2", y - barHeight - tailY)
				.attr("class", "fragBar");
			// if "yloss" in fgm:
			if (frag.indexOf("yloss") != -1){
				// ax.plot([xcoord, xcoord+lengthstick], [ycoord+5, ycoord+8],
						// color='#E0E0E0', alpha=0.9, linestyle='-', linewidth=2)
				yTail.attr("stroke", SpectrumViewer.lossFragBarColour);
			}
			// elif "x" in fgm or "y" in fgm or "z" in fgm:
			else {
				// ax.plot([xcoord, xcoord+lengthstick], [ycoord+5, ycoord+8],
						// color='k', linestyle='-', linewidth=2)
				yTail.attr("stroke", "black");
			}
			// else:
				// pass
		}

		var fragBar = self.g.append("line")
			.attr("x1", x)
			.attr("y1", y)
			.attr("x2", x)
			.attr("y2", y - barHeight)
			.attr("class", "fragBar");
		// if fgm.count("loss") == 2 or fgm == "yloss" or fgm == "bloss":
		var lossCount = (frag.match(/loss/g) || []).length;
		if (lossCount == 2 || frag == "-yloss" || frag == "bloss-"){
			fragBar.attr("stroke", SpectrumViewer.lossFragBarColour);
			// ax.plot([xcoord, xcoord], [ycoord, ycoord+5], color='#E0E0E0',
					// linestyle='-', linewidth=2)
		}
		// else:
		else {
			// ax.plot([xcoord, xcoord], [ycoord, ycoord+5], color='k',
						// linestyle='-', linewidth=2)
			fragBar.attr("stroke", "black");
		}

	}

/*
def draw_mod_annotation(aminoacid, xpos, ypos, idx_pos, mods, ax):
    """
    Draws the specific annotation for the peptide (which fragments
    were observed and which were missed. In addition, modifications are
    displayed.

    The object is the "text" above the actual spectrum. The sequence,
    bars, and modification texts are written to the axes
    """
    if aminoacid == "#":
        topp_up = 0
        pass
    else:
        #plot the amino acid
        ax.annotate(aminoacid, xy=(xpos, ypos))
        idx_pos += 1
        topp_up = 1
        # if amino acid has a modifciation
        # write that on top of the amino acid
        if idx_pos in mods:
            if len(mods[idx_pos]) >= 3:
                ax.annotate(mods[idx_pos],
                            xy=(xpos+1, ypos+11), color="grey",
                            fontsize=12, rotation=30)

            else:
                ax.annotate(mods[idx_pos],
                            xy=(xpos+1, ypos+5), color="grey",
                            fontsize=12)
    return(topp_up)
*/

	// def get_mods(modified_peptide):
	function get_mods(modified_peptide){
		// """
		// Returns a dictionary with the position f the modification (based
		// on the unmodified peptide) and the modification itself (str)
	//
		// Parameter:
		// ------------------------------
		// modified_peptide: str,
						 //~ peptide sequence with modifications in it in lower case
						 //~ letters
		// """

		// mods = re.finditer("[^A-Z]+", modified_peptide)
		// subs = 0
		// mods_dic = {}
		// for i in mods:
			// mods_dic[i.start()-subs] = i.group(0)
			// subs += len(i.group(0))
		// return(mods_dic)

		return null;
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
		//
		// ion
		// """

		// annotation = []
		var annotation = [];
		// #iterate over peptide and find all fragment ions
		// for i in range(1, len(pep)):
		for (var i = 1; i < (pep.length + 1); i++){
			// gotb = ""
			// goty = ""
			var gotb = "-";
			var goty = "-";

			var aIonId = "a" + i;
			var bIonId = "b" + i;
			var cIonId = "c" + i;

			// if "b"+str(i) in ions or "a"+str(i) in ions or "c"+str(i) in ions:
			if (ions.indexOf(aIonId) != -1 || ions.indexOf(bIonId) != -1 || ions.indexOf(cIonId) != -1){
				// gotb = "b"
				gotb = "b";
			}
			// elif "b"+str(i)+"loss" in ions or "a"+str(i)+"loss" in ions or "c"+str(i)+"loss" in ions:
			else if (ions.indexOf(aIonId + "loss") != -1
						|| ions.indexOf(bIonId + "loss") != -1
						|| ions.indexOf(cIonId + "loss") != -1){
				// gotb = "bloss"
				gotb = "bloss";
			}
			// else:
				// pass

			var xIonId = "x" + (pep.length - i);
			var yIonId = "y" + (pep.length - i);
			var zIonId = "z" + (pep.length - i);


			// if "y"+str(len(pep)-i) in ions or "x"+str(len(pep)-i) in ions or "z"+str(len(pep)-i) in ions:
			if (ions.indexOf(xIonId) != -1 || ions.indexOf(yIonId) != -1 || ions.indexOf(zIonId) != -1){
				// goty = "y"
				goty = "y";
			}
			// elif "y"+str(len(pep)-i)+"loss" in ions or "x"+str(len(pep)-i)+"loss" in ions or "z"+str(len(pep)-i)+"loss" in ions:
			else if (ions.indexOf(xIonId + "loss") != -1
						|| ions.indexOf(yIonId + "loss") != -1
						|| ions.indexOf(zIonId + "loss") != -1) {
				// goty = "yloss"
				goty = "yloss";
			}
			// else:
				// pass

			// annotation.append(gotb+goty)
			annotation.push(gotb + goty);
		}
		// return(annotation)
		return annotation;
	}

}

PeptideFragmentationKey.prototype.clear = function(){
	this.pepSeq1 = null;
	this.linkPos1 = null;
	this.pepSeq2 = null;
	this.linkPos2 = null;
	this.annotatedPeaks = null;
	this.g.selectAll("*").remove();
}

/*
PeptideFragmentationKey.prototype.highlightChanged = function(fragments){
	var callbackCount = this.highlightChangedCallbacks.length;
	for (var i = 0; i < callbackCount; i++) {
		this.highlightChangedCallbacks[i](fragments);
	}
}

PeptideFragmentationKey.prototype.setHighlight = function(fragments){
	this.messageDiv.innerHTML = this.toString() + "<br>Hightlight:" + JSON.stringify(fragments);
}
*/
