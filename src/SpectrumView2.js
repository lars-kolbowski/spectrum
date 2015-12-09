var SpectrumView = Backbone.View.extend({

	el: "#spectrumDiv",

	initialize: function() {

		this.cmap = colorbrewer.Paired[6];
		this.p1color = this.cmap[5];
		this.p1color_loss = this.cmap[4];
		this.p2color = this.cmap[1];
		this.p2color_loss = this.cmap[0];
		this.lossFragBarColour = "#cccccc";
		this.highlightColour = "yellow";
		this.highlightWidth = 11;
		this.notUpperCase = /[^A-Z]/g;

		this.svg = d3.select(this.el)
				//~ .append("div").style("height","100%").style("width","100%")
				.append("svg").style("width", "100%").style("height", "100%");


		//create graph
		this.graph = new Graph (this.svg, this, {xlabel:"m/z", ylabel:"Intensity"});

		this.listenTo(this.model, 'change', this.render);
		//this.listenTo(this.model, 'destroy', this.remove);
	},

	render: function() {

		this.graph.setData(this.model.annotatedPeaks);

		//this.lossyShown = false;

	},

});