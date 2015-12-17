var SpectrumView = Backbone.View.extend({

	events : {
		'click #resize' : 'resize',
		'click #lossyChkBx': 'showLossy',
	},

	initialize: function() {

		this.svg = d3.select(this.el.getElementsByTagName("svg")[0]);//d3.select(this.el)
				//~ .append("svg").style("width", "100%").style("height", "100%");


		//create graph
		this.graph = new Graph (this.svg, this.model, {xlabel:"m/z", ylabel:"Intensity"});

		this.listenTo(this.model, 'change', this.render);
		//this.listenTo(this.model, 'destroy', this.remove);
	},

	render: function() {

		this.graph.setData(this.model);

		//this.lossyShown = false;

	},

	resize: function(){
		this.graph.resize(this.model);
	},

	showLossy: function(e){
		var $target = $(e.target);
        var selected = $target .is(':checked');
        this.graph.lossyShown = selected;
		this.graph.clearLabels();
		this.graph.showLabels();
	}
	
});
