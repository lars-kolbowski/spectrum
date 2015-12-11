var FragmentationKeyView = Backbone.View.extend({

	el: "#fragKeyDiv",

	initialize: function() {
		this.svg = d3.select(this.el).append("svg").style("width", "100%").style("height", "100%");
		this.margin = {
			"top":    20,
			"right":  20,
			"bottom": 40,
			"left":   40
		};
		this.highlights =  this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
		this.g =  this.svg.append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");


		//d3.select(this.el).append("svg").attr("width", 50).attr("height", 50).append("circle").attr("cx", 25).attr("cy", 25).attr("r", 25).style("fill", "purple");
		

		//create peptide frag key
		this.peptideFragKey = new PeptideFragmentationKey(this.svg, this);

		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
	},

	render: function() {
		this.peptideFragKey.setData();
	},

});