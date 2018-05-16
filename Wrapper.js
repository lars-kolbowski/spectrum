//    xiSPEC Spectrum Viewer
//    Copyright 2016 Rappsilber Laboratory, University of Edinburgh
//
//    This product includes software developed at
//    the Rappsilber Laboratory (http://www.rappsilberlab.org/).
//
//    author: Lars Kolbowski
//
//    Wrapper.js

"use strict";

var xiSPEC = {};
var CLMSUI = CLMSUI || {};
// http://stackoverflow.com/questions/11609825/backbone-js-how-to-communicate-between-views
CLMSUI.vent = {};
_.extend (CLMSUI.vent, Backbone.Events);

xiSPEC.init = function(targetDiv) {
	// targetDiv could be div itself or id of div - lets deal with that
	if (typeof targetDiv === "string"){
		this.targetDiv = document.getElementById(targetDiv);
	} else {
		this.targetDiv = targetDiv;
	}

	d3.select(this.targetDiv).selectAll("*").remove();

	//init models
	var model_vars = {
		// baseDir: "/",
		xiAnnotatorBaseURL: "http://xi3.bio.ed.ac.uk/xiAnnotator/",
	};
	this.SpectrumModel = new AnnotatedSpectrumModel(model_vars);
	this.SettingsSpectrumModel = new AnnotatedSpectrumModel(model_vars);
	this.SpectrumModel.otherModel = this.SettingsSpectrumModel;
	this.SettingsSpectrumModel.otherModel = this.SpectrumModel;

	var _html = ""
		+"<div class='dynDiv' id='settingsWrapper'>"
		+"	<div class='dynDiv_moveParentDiv'>"
		+"		<span class='dynTitle'>Settings</span>"
		+"		<i class='fa fa-times-circle settingsCancel' id='closeSettings'></i>"
		+"	</div>"
		+"	<div class='dynDiv_resizeDiv_tl draggableCorner'></div>"
		+"	<div class='dynDiv_resizeDiv_tr draggableCorner'></div>"
		+"	<div class='dynDiv_resizeDiv_bl draggableCorner'></div>"
		+"	<div class='dynDiv_resizeDiv_br draggableCorner'></div>"
		+"</div>"
		+"<div id='spectrumControls'>"
		+'<i class="btn btn-1a btn-topNav fa fa-download" aria-hidden="true" id="downloadSVG" title="download SVG" style="cursor: pointer;"></i>'
		+'<label class="btn" title="toggle moveable labels on/off">Move Labels<input class="pointer" id="moveLabels" type="checkbox"></label>'
		+"<button id='clearHighlights'>Clear Highlights</button>"
		+"<label class='movePeakLabels'>Move Labels<input id='moveLabels' type='checkbox'></label>"
		+'<label class="btn" title="toggle measure mode on/off">Measure<input class="pointer" id="measuringTool" type="checkbox"></label>'
		+'<form id="setrange">'
		+'	<label class="btn" title="m/z range" style="cursor: default;">m/z:</label>'
		+'	<label class="btn" for="lockZoom" title="Lock current zoom level" id="lock" class="btn">🔓</label><input id="lockZoom" type="checkbox" style="display: none;">'
		+'	<input type="text" id="xleft" size="5" title="m/z range from:">'
		+'	<span>-</span>'
		+'	<input type="text" id="xright" size="5" title="m/z range to:">'
		+'	<input type="submit" id="rangeSubmit" value="Set" class="btn btn-1 btn-1a" style="display: none;">'
		+'	<span id="range-error"></span>'
		+'	<button id="reset" title="Reset to initial zoom level" class="btn btn-1 btn-1a">Reset Zoom</button>'
		+'</form>'
		+"<button id='toggleSettings' title='Show Settings' class='btn btn-1a btn-topNav'>&#9881;</button>"
		+"</div>"
		+"</div>"
		+"<div class='plotsDiv'>"
		+"  <div id='spectrumMainPlotDiv'>"
		+"      <svg id='spectrumSVG'></svg>"
		+"      <div id='measureTooltip'></div>"
		+"  </div>"
		+"  <div id='QCdiv'>"
		+"      <div class='subViewHeader'></div>"
		+"      <div class='subViewContent'>"
		+"          <div class='subViewContent-plot' id='subViewContent-left'><svg id='errIntSVG' class='errSVG'></svg></div>"
		+"          <div class='subViewContent-plot' id='subViewContent-right'><svg id='errMzSVG' class='errSVG'></svg></div>"
		+"      </div>"
		+"  </div>"
		+"</div>"
		+"</div>"
	;

	d3.select(this.targetDiv)
		// .classed ("xiSPECwrapper", true)
		.append("div")
		// .attr ("class", "verticalFlexContainer")
		.attr ("id", 'spectrumPanel')
		// http://stackoverflow.com/questions/90178/make-a-div-fill-the-height-of-the-remaining-screen-space?rq=1
		//.style ("display", "table")
		.html (_html)
	;

	this.Spectrum = new SpectrumView({model: this.SpectrumModel, el:"#spectrumPanel"});
	this.FragmentationKey = new FragmentationKeyView({model: this.SpectrumModel, el:"#spectrumMainPlotDiv"});
	this.InfoView = new PrecursorInfoView ({model: this.SpectrumModel, el:"#spectrumPanel"});
	this.QCwrapper = new QCwrapperView({el: '#QCdiv'});
	this.ErrorIntensityPlot = new ErrorPlotView({
		model: this.SpectrumModel,
		el:"#subViewContent-left",
		xData: 'Intensity',
		margin: {top: 10, right: 30, bottom: 20, left: 65},
		svg: "#errIntSVG",
	});
	this.ErrorMzPlot = new ErrorPlotView({
		model: this.SpectrumModel,
		el:"#subViewContent-right",
		xData: 'm/z',
		margin: {top: 10, right: 30, bottom: 20, left: 65},
		svg: "#errMzSVG",
	});
	CLMSUI.vent.trigger('show:QC', true);

	this.SettingsView = new SpectrumSettingsView({
		model: this.SettingsSpectrumModel,
		el:"#settingsWrapper",
		showCustomCfg: false,
	});


};

xiSPEC.setData = function(data){

	var json_request = this.convert_to_json_request(data);
	this.SpectrumModel.request_annotation(json_request);

};

xiSPEC.sanityChecks = function(data){
	
	// ToDo: create sanityChecks
	// if(data.sequence2 !== undefined){
	// 	if(data.linkPos1 === undefined || data.linkPos2 === undefined){
	// 		alert('sequence')
	// 		return false;
	// 	}
	// }

	return true;
};

xiSPEC.convert_to_json_request = function (data) {

	if (!this.sanityChecks(data)) return false;


	// defaults
	if(data.ionTypes === undefined){
		data.ionTypes = "peptide;b;y";
	}
	if(data.crossLinkerModMass === undefined){
		data.crossLinkerModMass = 0;
	}
	if(data.modifications === undefined){
		data.modifications = [];
	}
	if(data.fragmentTolerance === undefined){
		data.fragmentTolerance = {"tolerance": '20.0', 'unit': 'ppm'};
	}


	var annotationRequest = {};
    var peptides = [];
    var linkSites = [];
    peptides[0] = xiSPEC.arrayifyPeptide(data.sequence1);

	if(data.linkPos1 !== undefined){
    	linkSites[0] = {"id":0, "peptideId":0, "linkSite": data.linkPos1};
	}
    if (data.sequence2 !== undefined) {
        peptides[1] = xiSPEC.arrayifyPeptide(data.sequence2);
        linkSites[1] = {"id":0, "peptideId":1, "linkSite": data.linkPos1}
    }

	var peaks = [];
	for (var i = 0; i < data.peaklist.length; i++) {
		peaks.push(
			{"intensity": data.peaklist[i][1], "mz": data.peaklist[i][0]}
		);
	}

    annotationRequest.Peptides = peptides;
    annotationRequest.LinkSite = linkSites;
	annotationRequest.peaks = peaks;
    annotationRequest.annotation = {};

    var ionTypes = data.ionTypes.split(";");
    var ionTypeCount = ionTypes.length;
    var ions = [];
    for (var it = 0; it < ionTypeCount; it++) {
        var ionType = ionTypes[it];
        ions.push({"type": (ionType.charAt(0).toUpperCase() + ionType.slice(1) + "Ion")});
    }
    annotationRequest.annotation.fragmentTolerance = data.fragmentTolerance;
	annotationRequest.annotation.modifications = data.modifications;
	annotationRequest.annotation.ions = ions;
    annotationRequest.annotation["cross-linker"] = {'modMass': data.crossLinkerModMass}; // yuk
    annotationRequest.annotation.precursorMZ = data.precursorMZ;
    annotationRequest.annotation.precursorCharge = data.precursorCharge;
	annotationRequest.annotation.custom = [];

    console.log("request", annotationRequest);
	return annotationRequest;

};

xiSPEC.arrayifyPeptide = function (seq_mods) {
    var peptide = {};
    peptide.sequence = [];

    var seq_AAonly = seq_mods.replace(/[^A-Z]/g, '')
    var seq_length = seq_AAonly.length;

    for (var i = 0; i < seq_length; i++) {
        peptide.sequence[i] = {"aminoAcid":seq_AAonly[i], "Modification": ""}
    }

    var re = /[^A-Z]+/g;
    var offset = 1;
	var result;
    while (result = re.exec(seq_mods)) {
		console.log(result);
        peptide.sequence[result.index - offset]["Modification"] = result[0];
		offset += result[0].length;
    }
    return peptide;
}
