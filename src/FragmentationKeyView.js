var FragmentationKeyView = Backbone.View.extend({

	events : {
		'click #clearHighlights' : 'clearHighlights',
	},

	initialize: function() {
		this.svg = d3.select(this.el.getElementsByTagName("svg")[0]);//d3.select(this.el).append("svg").style("width", "100%").style("height", "100%");
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
		this.peptideFragKey = new PeptideFragmentationKey(this.svg, this.model);

		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'destroy', this.remove);
		this.listenTo(this.model, 'changed:Sticky', this.updateSticky)
	},

	render: function() {
		this.peptideFragKey.setData();
	},

	clearHighlights: function(){
		this.peptideFragKey.clearStickyHighlights();
	},

	updateSticky: function(){
		console.log(this.model.sticky);
		this.peptideFragKey.setStickyHighlights(this.model.sticky[0].fragments);
	}

});
