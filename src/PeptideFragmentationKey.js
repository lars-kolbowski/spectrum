//		a spectrum viewer
//		Copyright 2015 Rappsilber Laboratory
//
//		author: Colin Combe
//
//		PeptideFragmentationKey.js

//		Just boilerplate...

function PeptideFragmentationKey (targetDiv){
	//to contain registered callback functions
	this.highlightChangedCallbacks = [];

	// targetDiv could be div itself or id of div - lets deal with that
	if (typeof targetDiv === "string"){
		targetDiv = document.getElementById(targetDiv);
	}
	//avoids prob with 'save - web page complete'
	SpectrumViewer.emptyElement(targetDiv);

	this.messageDiv = document.createElement('div');
	targetDiv.appendChild(this.messageDiv);

	this.spuriousEventButton = document.createElement('button');
	this.spuriousEventButton.innerHTML = "fire highlight changed"
	this.spuriousEventButton.onclick = function(){
		this.fireRandomEvent();
	}
	targetDiv.appendChild(this.spuriousEventButton);
}

PeptideFragmentationKey.prototype.setData = function(pepSeq1, linkPos1, pepSeq2, linkPos2, annotatedPeaks){
	this.pepSeq1 = pepSeq1;
	this.linkPos1 = linkPos1;
	this.pepSeq2 = pepSeq2;
	this.linkPos2 = linkPos2;
	this.annotatedPeaks = annotatedPeaks;

	this.messageDiv.innerHTML = this.toString();
}

PeptideFragmentationKey.prototype.clear = function(){
	this.pepSeq1 = null;
	this.linkPos1 = null;
	this.pepSeq2 = null;
	this.linkPos2 = null;
	this.annotatedPeaks = null;

	this.messageDiv.innerHTML = "";
}

PeptideFragmentationKey.prototype.highlightChanged = function(fragments){
	var callbackCount = this.highlightChangedCallbacks.length;
	for (var i = 0; i < callbackCount; i++) {
		this.highlightChangedCallbacks[i](fragments);
	}
}

PeptideFragmentationKey.prototype.setHighlight = function(fragments){
	this.messageDiv.innerHTML = this.toString() + "<br>Hightlight:" + JSON.stringify(fragments);
}

PeptideFragmentationKey.prototype.toString = function(){
	return 	this.pepSeq1 +", xl@"+ this.linkPos1 +" | "+ this.pepSeq2 + ", xl@" + this.linkPos2;
}

PeptideFragmentationKey.prototype.fireRandomEvent = function(){
	if (this.annotatedPeaks) {//if data loaded
		var dataCount = this.annotatedPeaks.length;
		var rnd = Math.random() * dataCount;
		this.highlightChanged([this.annotatedPeaks[Math.floor(rnd)]]); //note param is array of fragments
	}
}
