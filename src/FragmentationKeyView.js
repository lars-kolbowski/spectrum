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
		this.listenTo(this.model, 'changed:Highlights', this.updateHighlights);
		this.listenTo(this.model, 'changed:ColorScheme', this.updateColors);
	},

	render: function() {
		this.peptideFragKey.setData();
	},

	clearHighlights: function(){
		this.peptideFragKey.clearHighlights();
	},

	updateHighlights: function(){

		var lines = this.peptideFragKey.fraglines;

		for(l = 0; l < lines.length; l++){
			var highlightFragments = _.intersection(lines[l].fragments, this.model.highlights);
			if(highlightFragments.length != 0){
				lines[l].highlight(true, highlightFragments);
			}
			else if(lines[l].fragments.length > 0)
				lines[l].highlight(false);
		}

		if(this.model.highlights.length == 1){
			this.peptideFragKey.greyLetters();
			this.peptideFragKey.colorLetters(this.model.highlights[0]);
		}
		else if(this.model.highlights.length == 0)
			this.peptideFragKey.colorLetters("all");
		
	},

	updateColors: function(){
		this.peptideFragKey.clearHighlights();
	}

});
