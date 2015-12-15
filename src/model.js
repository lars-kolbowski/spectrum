var SpectrumViewer = Backbone.Model.extend({
	defaults: {
		pepSeq1: "VGQQYSSAPLR",
		linkPos1: 3,
		pepSeq2: "EKELESIDVLLEQTTGGNNKDLK",
		linkPos2: 5,
		notUpperCase: /[^A-Z]/g,
	},

	initialize: function(){
		this.on("change:annotatedPeaksCSV", function(model){
			this.setData();
		});
	},
	setData: function(){
		var annotatedPeaksCSV = this.get("annotatedPeaksCSV");
		this.set("annotatedPeaks", d3.csv.parse(annotatedPeaksCSV.trim()));
		this.annotatedPeaks = this.get("annotatedPeaks");
		this.pep1 = this.get("pepSeq1").replace(this.get("notUpperCase"), '');
		//this.set("pep1", this.get("pepSeq1").replace(this.get("notUpperCase"), ''));
		this.pep2 = this.get("pepSeq2").replace(this.get("notUpperCase"), '');
		//this.set("pep2", this.get("pepSeq2").replace(this.get("notUpperCase"), ''));
		this.linkPos1 = this.get("linkPos1");
		this.linkPos2 = this.get("linkPos2");
		this.notUpperCase = this.get("notUpperCase"),
		this.cmap = colorbrewer.RdBu[8];
		this.p1color = this.cmap[7];
		this.p1color_cluster = this.cmap[5];
		this.p1color_loss = this.cmap[6];
		this.p2color = this.cmap[0];
		this.p2color_cluster = this.cmap[2];
		this.p2color_loss = this.cmap[1];
		this.lossFragBarColour = "#cccccc";
		this.highlightColour = "yellow";
		this.highlightWidth = 11;
		this.setGraphData();
	},

	clear: function(){
		this.set({ pep1: "", pep2: "" });
			//TODO
			//this.peptideFragKey.clear();
			//this.graph.clear();
	},

	setGraphData: function(){
		var annotatedPeaks = this.get("annotatedPeaks");
		//get Max m/z value of primarymatches
		this.xmaxPrimary = d3.max(annotatedPeaks,
			function(d){
				return ((d.isprimarymatch == 1)? d.expmz - 0 : 0);
			}
			) + 50;
		//this.set("xmaxPrimary", xmaxPrimary);

		 //get Min m/z value of primarymatches
		 this.xminPrimary = d3.min(annotatedPeaks, 
		 	function(d){
		 		return ((d.isprimarymatch == 1)?  d.expmz - 0 : this.xmaxPrimary);
		 	}
		 	) - 50;
		 //this.set("xminPrimary", xminPrimary);

		//sort Data by m/z and Int
		this.nested =  d3.nest()
		.key(function(d) { return d.expmz + '-' + d.absoluteintensity; })
		.entries(annotatedPeaks);


		this.xmax = this.xmaxPrimary;
		this.xmin = this.xminPrimary;

		this.ymax = d3.max(annotatedPeaks, function(d){return d.absolute_intensity - 0;});
		//this.ymax = d3.max(this.points, function(d){return d.y;});
		this.ymin = 0;//d3.min(this.points, function(d){return d.y;});
	},

});