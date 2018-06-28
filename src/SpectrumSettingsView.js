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
//		authors: Lars Kolbowski
//
//
//		SpectrumSettingsView.js

var CLMSUI = CLMSUI || {};

var SpectrumSettingsView = Backbone.View.extend({

	events : {
		'click #lossyChkBx': 'showLossy',
		'click #absErrChkBx': 'absErrToggle',
		'change #colorSelector': 'changeColorScheme',
		'click .settingsTab' : 'changeTab',
		'click .settingsCancel' : 'cancel',
		'change #settingsDecimals' : 'changeDecimals',
		'change #highlightColor' : 'updateJScolor',
		'change #peakHighlightMode' : 'changePeakHighlightMode',
		'click #xispec_toggleCustomCfgHelp' : 'toggleCustomCfgHelp',
		'click #settingsCustomCfgApply' : 'applyCustomCfg',
		'submit #xispec_settingsForm' : 'applyData',
		// 'keyup .stepInput' : 'updateStepSizeKeyUp',
		'change .ionSelectChkbox': 'updateIons'
	},

	identifier: "Spectrum Settings",

	initialize: function(options) {

		var defaultOptions = {
			showCustomCfg: true,
		};

		this.options = _.extend(defaultOptions, options);

		SpectrumSettingsView.__super__.initialize.apply (this, arguments);
		var self = this;

		this.listenTo(CLMSUI.vent, 'spectrumSettingsShow', this.bringToTop);
		this.listenTo(CLMSUI.vent, 'spectrumSettingsToggle', this.toggleView);
// 		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'change:JSONdata', this.render);

		this.isVisible = false;

		this.wrapper = d3.select(this.el);

		//borrowed from CLMSUI.BaseframeView
		// add drag listener to four corners to call resizing locally rather than through dyn_div's api, which loses this view context
		var drag = d3.behavior.drag().on ("dragend", function() { self.modTable.draw(); });
		this.wrapper.selectAll(".draggableCorner").call (drag);

		//menu
		this.menu = this.wrapper.append("div").attr("class", "xispec_settings_menu");
		var buttonData = ["Data", "Appearance", "Custom config"]
		buttonData.forEach(function(b, i){
			var zIndex = 20 - i;
			var b_id = b.replace(" ", "_").toLowerCase();
			self.menu.append("button")
				.attr("class", "settingsTab xispec_btn xispec_btn-1a")
				.attr("data-tab", b_id)
				.attr("id", b_id)
				.attr("style", "z-index: " + zIndex)
				.text(b)
			;
		});

		if (!this.options.showCustomCfg){
			this.menu.selectAll('#custom_config').style("display", "none");
		}

		// add active class to first tab-button
		this.menu.select('button').classed('xispec_active', true);

		var mainDiv = this.wrapper.append("div").attr("id", "xispec_settings_main");

		//data ToDo: change to more BBlike data handling
		var dataTab = mainDiv.append("div").attr("class", "xispec_settings-tab xispec_flex-column").attr("id", "settings_data");

		var dataForm = dataTab.append("form").attr("id", "xispec_settingsForm").attr("method", "post").attr("class", "xispec_flex-column");

		// var dataFlexColumn = dataForm.append("div").attr("class", "xispec_flex-column");

		var peptideLabel = dataForm.append("label").attr("class", "xispec_flex-row").text("Peptide Sequence: ")
		this.peptideViewEl = peptideLabel.append('div').attr('class', 'xispec_flex-grow').append("input")
			.attr("type", "text")
			.attr("required", "")
			.attr("autofocus", "")
			.attr("autocomplete", "off")
			.attr("placeholder", "Peptide Sequence1[;Peptide Sequence2]")
			.attr("name", "peps")
		;
		this.pepInputView = new PepInputView({model: this.model, el: this.peptideViewEl[0] });

		var dataFlexRow = dataForm.append("div").attr("class", "xispec_flex-row xispec_midDataDiv");

		var leftDiv = dataFlexRow.append("div").attr("class", "xispec_settingsDataLeft");

		this.peaklist = leftDiv.append("label").attr("class", "xispec_flex-column").attr("style", "height: 100%").text("Peak list (m/z\tintensity): ").append("textarea")
			.attr("required", "")
			.attr("id", "xispec_settingsPeaklist")
			.attr("type", "text")
			.attr("placeholder", "Peak List [m/z intensity]")
			.attr("name", "peaklist")
			.attr("class", "xispec_form-control")
		;

		var rightDiv = dataFlexRow.append("div").attr("class", "xispec_settingsDataRight");

		var ionSelector = rightDiv.append("label").attr("class", "xispec_flex-row").text("Fragment Ions: ")
			.append("div").attr("class", "xispec_multiSelect_dropdown xispec_flex-grow")
		;
		ionSelector.append("input")
			.attr("type", "text")
			.attr("class", "xispec_btn-drop")
			.attr("id", "xispec_ionSelection")
			.attr("readonly", "")
		;
		var ionSelectorDropdown = ionSelector.append("div").attr("class", "xispec_multiSelect_dropdown-content mutliSelect");
		var ionSelectorList = ionSelectorDropdown.append("ul").attr("id", 'xispec_ionList');
		var ionOptions = [
			{value: "peptide", text: "Peptide Ion"},
			{value: "a", text: "A Ion"},
			{value: "b", text: "B Ion"},
			{value: "c", text: "C Ion"},
			{value: "x", text: "X Ion"},
			{value: "y", text: "Y Ion"},
			{value: "z", text: "Z Ion"},
		];
		ionSelectorList.selectAll("li").data(ionOptions)
			.enter()
			.append("li").append("label")
			.append("input")
				.attr("class", "ionSelectChkbox")
				.attr("type", "checkbox")
				.attr("name", "ions[]")
				.attr("id", function(d) { return d.text.replace(" ", ""); })
				.attr("value", function(d) { return d.value; })
		;
		ionSelectorList.selectAll("label").data(ionOptions)
			.append('span')
			.text(function(d) { return d.text; })
		;

		this.precursorZ = rightDiv.append("label").attr("class", "xispec_flex-row").text("Precursor charge state: ").append('div').attr('class', 'xispec_flex-grow')
			.append("input").attr("type", "number").attr("placeholder", "Charge").attr("autocomplete", "off").attr("name", "preCharge").attr("min", "1").attr("required", "")
		;

		var toleranceWrapper = rightDiv.append("label").attr("class", "xispec_flex-row").text("MS2 tolerance: ");
		this.toleranceValue = toleranceWrapper.append('div').attr('class', 'xispec_flex-grow').append("input")
			.attr("type", "text")
			// .attr("type", "number")
			.attr("placeholder", "tolerance")
			.attr("autocomplete", "off")
			.attr("name", "ms2Tol")
			// .attr("min", "0")
			// .attr("step", "0.1")
			.attr("required", "")
			// .attr("class", "stepInput")
		;
		this.toleranceUnit = toleranceWrapper.append('div').append("select")
			.attr("name", "tolUnit")
			.attr("required", "")
			.attr("style", "width: 65px; margin-left: 8px;")
			.attr("class", "xispec_form-control")
		;
		this.toleranceUnit.append("option").attr("value", "ppm").text("ppm");
		this.toleranceUnit.append("option").attr("value", "Da").text("Da");

		this.crossLinkerModMassWrapper = rightDiv.append("label").attr("class", "xispec_flex-row").text("Cross-linker mod mass: ");

		this.crossLinkerModMass = this.crossLinkerModMassWrapper.append('div').attr('class', 'xispec_flex-grow')
			.append("input")
				.attr("placeholder", "CL mod mass")
				.attr("autocomplete", "off")
				.attr("name", "clModMass")
				.attr("required", "")
				.attr("type", "text")
				// .attr("type", "number")
				// .attr("step", "0.001")
				// .attr("class", "stepInput")
		;

		//modTable
		var modTableWrapper = dataForm.append("div").attr("class", "xispec_form-control dataTables_wrapper").attr("id", "xispec_modificationTable_wrapperOuter");
		var modTable = modTableWrapper.append("table").attr("id", "xispec_modificationTable").attr("style", "width: 100%");
		this.initializeModTable();

		//end modTable
		var dataBottom = dataForm.append("div").attr("class", "xispec_settings-bottom");

		var applyxispec_btn = dataBottom.append("input").attr("class", "xispec_btn xispec_btn-1 xispec_btn-1a network-control").attr("value", "Apply").attr("id", "settingsDataApply").attr("type", "submit");
		var cancelxispec_btn = dataBottom.append("input").attr("class", "xispec_btn xispec_btn-1 xispec_btn-1a network-control settingsCancel").attr("value", "Cancel").attr("id", "settingsCancel").attr("type", "button");

		//appearance
		var appearanceTab = mainDiv.append("div")
			.attr("class", "xispec_settings-tab xispec_flex-column")
			.attr("id", "settings_appearance")
			.style("display", "none")
		;

		var colorSchemeSelector = appearanceTab.append("label").text("Color scheme: ")
			.append("select").attr("id", 'colorSelector').attr("class", 'xispec_form-control pointer')
		;
		var colOptions = [
			{value: "RdBu", text: "Red (& Blue)"},
			{value: "BrBG", text: "Brown (& Teal)"},
			{value: "PiYG", text: "Pink (& Green)"},
			{value: "PRGn", text: "Purple (& Green)"},
			{value: "PuOr", text: "Orange (& Purple)"},
		];

		d3.select("#colorSelector").selectAll("option").data(colOptions)
			.enter()
			.append("option")
			.attr ("value", function(d) { return d.value; })
			.text (function(d) { return d.text; })
		;

		var highlightColorSelector = appearanceTab.append("label").text("Highlight Color: ")
			.append("input")
				.attr("class", "jscolor pointer")
				.attr("id", "highlightColor")
				.attr("value", "#FFFF00")
				.attr("type", "text")
				.attr("style", "width: 103px;")
		;
		jscolor.installByClassName("jscolor");

		var highlightingModeChkBx = appearanceTab.append("label").text("Hide not selected fragments.")
			.append("input").attr("type", "checkbox").attr("id", "peakHighlightMode")
		;

		var lossyChkBx = appearanceTab.append("label").text("Show neutral loss labels")
			.append("input").attr("type", "checkbox").attr("id", "lossyChkBx")
		;

		this.decimals = appearanceTab.append("label").text("Number of decimals to display: ")
			.append("input").attr("type", "number").attr("id", "settingsDecimals").attr("min", "1").attr("max", "10").attr("autocomplete", "off")
		;

		this.absoluteError = appearanceTab.append("label").text("Absolute error values (QC): ")
			.append("input").attr("type", "checkbox").attr("id", "absErrChkBx")
		;


		//custom config
		var customConfigTab = mainDiv.append("div").attr("class", "xispec_settings-tab xispec_flex-column").attr("id", "settings_custom_config").style("display", "none");
		customConfigTab.append('div').attr('id', 'toggleCustomCfgHelp').attr('class', 'pointer').text('Help ').append('i').attr("class", "fa fa-question-circle").attr("aria-hidden", "true");
		customConfigTab.append("textarea")
			.attr("id", "customCfgHelp")
			.attr("class", "xispec_form-control")
			.text('# enable double fragmentation within one fragment\n# also fragmentation events on both peptides\nfragment:BLikeDoubleFragmentation\n\n# custom loss definition examples\n## Water\nloss:AminoAcidRestrictedLoss:NAME:H20;aminoacids:S,T,D,E;MASS:18.01056027;cterm\n## Amonia\nloss:AminoAcidRestrictedLoss:NAME:NH3;aminoacids:R,K,N,Q;MASS:17.02654493;nterm\n## AIons as loss from BIons\n## when defiend as loss the matched fragments will have less impact on the score then matching A-Ions\nloss:AIonLoss\n\n# also match peaks if they are one dalton off - assuming that sometimes the monoisotopic peak is missing\nMATCH_MISSING_MONOISOTOPIC:(true|false)');
		this.customConfigInput = customConfigTab.append("textarea").attr("id", "xispec_settingsCustomCfg-input").attr("class", "xispec_form-control");
		var customConfigBottom = customConfigTab.append("div").attr("class", "xispec_settings-bottom");
		var customConfigSubmit = customConfigBottom.append("input").attr("class", "xispec_btn xispec_btn-1 xispec_btn-1a network-control").attr("value", "Apply").attr("id", "settingsCustomCfgApply").attr("type", "submit");

		d3.select(this.el).selectAll("label")
			.classed ("xispec_label", true)
		;

		d3.select(this.el).selectAll("input[type=text]")
			.classed ("xispec_form-control", true)
		;
		d3.select(this.el).selectAll("input[type=number]")
			.classed ("xispec_form-control", true)
		;
		d3.select(this.el).selectAll("input[type=textarea]")
			.classed ("xispec_form-control", true)
		;

	},

	changeDecimals: function(){
		var model = this.model.otherModel; //apply changes directly for now
		model.showDecimals = parseInt(this.decimals[0][0].value);
		model.trigger('change'); //necessary for PrecursorInfoView update
	},

	applyCustomCfg: function(e){

		this.model.otherModel.customSettings = $("#xispec_settingsCustomCfg-input").val().split("\n");
		var json = this.model.get("JSONrequest");
		// if(this.model.MSnTolerance.unit == "ppm"){
		// 	json['annotation']['custom'] = ["LOWRESOLUTION:false"];	//ToDo: temp fix until new xiAnnotator version is released
		// }
		// else{
		// 	json['annotation']['custom'] = ["LOWRESOLUTION:true"];	//ToDo: temp fix until new xiAnnotator version is released
		// }

		json['annotation']['custom'] = $("#xispec_settingsCustomCfg-input").val().split("\n");

		this.model.otherModel.request_annotation(json);
		this.model.otherModel.changedAnnotation = true;
		this.model.otherModel.trigger("changed:annotation");

		// this.render();

	},

	toggleView: function(){
		this.isVisible = (this.isVisible ? false : true);
		this.render();
		$(this.el).toggle();
		this.modTable.draw();
	},

	applyData: function(e){

		e.preventDefault();

		var form = e.currentTarget;
		//Todo error handling!
		if(!this.checkInputsForValidity(form)){
			console.log('Invalid character found in form');
			return false;
		}
		var self = this;
		var formData = new FormData($(form)[0]);
		$('#xispec_settingsForm').hide();
		var spinner = new Spinner({scale: 5}).spin (d3.select("#xispec_settings_main").node());

		$.ajax({
			url: self.model.baseDir+"php/formToJson.php",
			type: 'POST',
			data: formData,
			async: false,
			cache: false,
			contentType: false,
			processData: false,
			success: function (response) {
				var json = JSON.parse(response);
				// json['annotation']['custom'] = "LOWRESOLUTION:false\n";	//ToDo: temp fix until new xiAnnotator version is released
				self.model.otherModel.request_annotation(json);
				self.model.otherModel.changedAnnotation = true;
				self.model.otherModel.trigger("changed:annotation");
				spinner.stop();
				$('#xispec_settingsForm').show();
			}
		});

		this.model.saveUserModificationsToCookie();
		return false;

		//window.SpectrumModel.request_annotation(window.SettingsSpectrummodel.get("JSONdata"));
	},

	//ToDo: improve error handling to be more informative - display outside of console
	checkInputsForValidity: function(formData){

		var invalidChars = function(input, unknownCharPattern){
			var match = input.match(unknownCharPattern);
			if (match){
				return match[0];
			}
			return false;
		}

		//peptideStr
		var invalidChar = invalidChars(formData['peps'].value, /([^GALMFWKQESPVICYHRNDTa-z:;#0-9(.)\-]+)/);
		if (invalidChar){
			alert('Invalid character(s) in peptide sequence: ' + invalidChar);
			return false;
		}

		//peakList
		var invalidChar = invalidChars(formData['peaklist'].value, /([^0-9\.\s]+)/);
		if (invalidChar){
			alert('Invalid character(s) in peak list: ' + invalidChar);
			return false;
		}
		//clModMass
		var invalidChar = invalidChars(formData['clModMass'].value, /([^0-9\.\-]+)/);
		if (invalidChar){
			alert('Invalid character(s) in cros-linker modmass: ' + invalidChar);
			return false;
		}
		//precursor charge state
		var invalidChar = invalidChars(formData['preCharge'].value, /([^0-9]+)/);
		if (invalidChar){
			alert('Invalid character(s) in charge state: ' + invalidChar);
			return false;
		}
		//ms2Tolerance
		var invalidChar = invalidChars(formData['ms2Tol'].value, /([^0-9\.]+)/);
		if (invalidChar){
			alert('Invalid character(s) in ms2Tolerance: ' + invalidChar);
			return false;
		}

		return true;

	},

	initializeModTable: function(){
		var self = this;
		var modTableVars = {
			// "scrollY": '130px',
			"scrollCollapse": true,
			"paging":   false,
			"ordering": false,
			"info":     false,
			"searching":false,
			"processing": true,
			"serverSide": true,
			"ajax": self.model.baseDir + "php/convertModsToJSON.php?peps=",
			"columns": [
				{ "title": "Mod-Input", "data": "id" },
				{ "title": "Modification", "className": "dt-center" },
				{ "title": "Mass", "className": "dt-center" },
				{ "title": "Specificity", "data": "aminoAcid", "className": "dt-center" },
			],

			"columnDefs": [
				{
					"render": function ( data, type, row, meta ) {
						return '<input class="xispec_form-control" id="modName_'+meta.row+'" title="modification code" name="mods[]" readonly type="text" value='+data+'>';
					},
					"class": "invisible",
					"targets": 0,
				},
				{
					"render": function ( data, type, row, meta ) {
						return row['id']+'<i class="fa fa-undo xispec_resetMod" title="reset modification to default" aria-hidden="true"></i></span>';
					},
					"targets": 1,
				},
				{
					"render": function ( data, type, row, meta ) {
						data = 0;
						var found = false;
						var rowNode = self.modTable.rows( meta.row ).nodes().to$();

						//check knownModifications first
						if(self.model.knownModifications['modifications'] !== undefined){
							for (var i = 0; i < self.model.knownModifications['modifications'].length; i++) {
								if(self.model.knownModifications['modifications'][i].id == row.id)
									data = self.model.knownModifications['modifications'][i].mass;
									found = true;
							}
						}
						//then check JSONdata annotation
						if (!found && self.model.annotationData.modifications){
							for (var i = 0; i < self.model.annotationData.modifications.length; i++) {
								if(self.model.annotationData.modifications[i].id == row.id){
									data = self.model.annotationData.modifications[i].massDifference;

								}
							}
						}
						data = parseFloat(data.toFixed(10).toString()); // limit to 10 decimal places and get rid of tailing zeroes
						if(data.toString().indexOf('.') !== -1)
							var stepSize = '0.'+'0'.repeat(data.toString().split('.')[1].length - 1) + 1;
						else
							var stepSize = 1;
						return '<input class="xispec_form-control stepInput" id="modMass_'+meta.row+'" row="'+meta.row+'" title="modification mass" name="modMasses[]" type="text" required value='+data+' autocomplete=off>';
					},
					"targets": 2,
				},
				{
					"render": function ( data, type, row, meta ) {
						//check knownModifications first
						if(self.model.knownModifications['modifications'] !== undefined){
							for (var i = 0; i < self.model.knownModifications['modifications'].length; i++) {
								if(self.model.knownModifications['modifications'][i].id == row.id){
									data = data.split(",");
									data = _.union(data, self.model.knownModifications['modifications'][i].aminoAcids);
									data.sort();
									data = data.join("");
									var found = true;
								}
							}
						}
						//then check JSONdata annotation
						if (!found && self.model.annotationData.modifications){
							aminoAcids = "";
							for (var i = 0; i < self.model.annotationData.modifications.length; i++) {
								if(self.model.annotationData.modifications[i].id == row.id){
									aminoAcids += self.model.annotationData.modifications[i].aminoacid;
								}
							}
						}
						data = data.split(",").join("");
						return '<input class="xispec_form-control" id="modSpec_'+meta.row+'" row="'+meta.row+'" title="amino acids that can be modified" name="modSpecificities[]" type="text" required value='+data+' autocomplete=off>'
					},
					"targets": 3,
				}
	            ]
	    };

	    this.modTable = $('#xispec_modificationTable').DataTable( modTableVars );


	    //ToDo: change to BB event handling
		$('#xispec_modificationTable').on('input', 'input', function() {

			var row = this.getAttribute("row");
			var modName = $('#modName_'+row).val();
			var modMass = parseFloat($('#modMass_'+row).val());
			var modSpec = $('#modSpec_'+row).val();

			var mod = {'id': modName, 'mass': modMass, 'aminoAcids': modSpec};

			self.model.updateUserModifications(mod, false);
			displayModified($(this).closest("tr"));

		 });

		var displayModified = function (row){
			row.addClass('userModified');
			row.find(".resetMod").css("visibility", "visible");
		}

		$('#xispec_modificationTable').on('click', '.resetMod', function() {
			var modId = $(this).parent()[0].innerText;
			self.model.delUserModification(modId, false);
			self.modTable.ajax.reload();
		});


	},

	render: function() {

		if (!this.isVisible) return;

		this.pepInputView.render();
		this.modTable.ajax.url( this.model.baseDir + "php/convertModsToJSON.php?peps="+encodeURIComponent(this.model.pepStrsMods.join(";"))).load();
		//ions
		this.model.get("JSONdata").annotation.ions.forEach(function(ion){
			$('#'+ion.type).attr('checked', true);
		});
		var ionSelectionArr = new Array();
		$('.ionSelectChkbox:checkbox:checked').each(function(){
		    ionSelectionArr.push($(this).val());
		});
		$('#xispec_ionSelection').val(ionSelectionArr.join(", "));

		this.peaklist[0][0].value = this.model.peaksToMGF();
		this.precursorZ[0][0].value  = this.model.get("JSONdata").annotation.precursorCharge;
		this.toleranceValue[0][0].value  = this.model.get("JSONdata").annotation.fragementTolerance.split(' ')[0];
		this.toleranceUnit[0][0].value = this.model.get("JSONdata").annotation.fragementTolerance.split(" ")[1];
		this.crossLinkerModMass[0][0].value = this.model.get("JSONdata").annotation['cross-linker'].modMass;
		this.decimals[0][0].value = this.model.showDecimals;

		if(this.model.isLinear)
			$(this.crossLinkerModMassWrapper[0][0]).hide();
		else
			$(this.crossLinkerModMassWrapper[0][0]).show();

		if (this.model.get("JSONdata").annotation.custom !== undefined)
			this.customConfigInput[0][0].value = this.model.get("JSONdata").annotation.custom.join("\n");

		// this.updateStepSize($(this.toleranceValue[0][0]));
		// this.updateStepSize($(this.crossLinkerModMass[0][0]));
	},

	cancel: function(){
		this.isVisible = false;
		$(this.wrapper[0]).hide();
		document.getElementById('highlightColor').jscolor.hide();
		this.model.resetModel();
	},

	toggleCustomCfgHelp: function(){
		$('#customCfgHelp').toggle();
	},

	// updateStepSizeKeyUp: function(e){
	// 	this.updateStepSize($(e.target));
	// },
	//
	// updateStepSize: function($target){
	// 	// var $target = $(e.target);
	// 	//update stepsize
	// 	if ($target.prop('value').toString().split('.')[1])
	// 		var stepSize = '0.'+'0'.repeat($target.prop('value').toString().split('.')[1].length - 1) + '1';
	// 	else {
	// 		//min stepsize to 0.1 -- can't read out 0. from target value
	// 		var stepSize = 0.1;
	// 	}
	// 	$target.attr('step', stepSize);
	// 	$target.attr('value', $target.prop('value'));
	// },

	changeTab: function(e) {
		var activeTab = $(e.currentTarget).data('tab');
		$('.xispec_settings-tab').hide();
		this.menu.selectAll('button').classed('xispec_active', false);
		$('#settings_'+activeTab).show();
		$(e.target).addClass('xispec_active');
	},

	updateJScolor: function(event) {
		var color = '#' + event.originalEvent.srcElement.value;
		//for now change color of model directly
		//ToDo: Maybe change this also to apply/cancel and/or put in reset to default values
		this.model.otherModel.changeHighlightColor( color );
	},

	changePeakHighlightMode: function(event){
		var model = this.model.otherModel; //apply changes directly for now
		var $target = $(event.target);
        var selected = $target .is(':checked');
		model.showAllFragmentsHighlight = !selected;
		model.trigger("changed:fragHighlighting");
	},

	updateIons: function(event){

		var ionSelectionArr = new Array();
		$('.ionSelectChkbox:checkbox:checked').each(function(){
			ionSelectionArr.push($(this).val());
		});

		if (ionSelectionArr.length == 0)
			$('#xispec_ionSelection').val("Select ions...");
		else
			$('#xispec_ionSelection').val(ionSelectionArr.join(", "));

	},

	showLossy: function(e) {
		var model = this.model.otherModel; //apply changes directly for now
		var $target = $(e.target);
        var selected = $target .is(':checked');
		model.lossyShown = selected;
		model.trigger("changed:lossyShown");
	},

	absErrToggle: function(e) {
		var model = this.model.otherModel; //apply changes directly for now
		var $target = $(e.target);
		var selected = $target.is(':checked');
		CLMSUI.vent.trigger('QCabsErr', selected);
	},

	changeColorScheme: function(e){
		var model = this.model.otherModel; //apply changes directly for now
		model.changeColorScheme(e.target.value);
	},
});
