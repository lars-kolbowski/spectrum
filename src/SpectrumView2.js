var SpectrumView = Backbone.View.extend({

	events : {
		'click #reset' : 'reset',
		'click #lossyChkBx': 'showLossy',
		'submit #setrange' : 'setrange',
	},

	initialize: function() {

		this.svg = d3.select(this.el.getElementsByTagName("svg")[0]);//d3.select(this.el)
				//~ .append("svg").style("width", "100%").style("height", "100%");


		//create graph
		this.graph = new Graph (this.svg, this.model, {xlabel:"m/z", ylabel:"Intensity"});

		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, "changed:Zoom", this.updateRange);
		this.listenTo(window, 'resize', _.debounce(this.resize));
		//this.listenTo(this.model, 'destroy', this.remove);
	},

	render: function() {

		this.graph.setData(this.model);

		//this.lossyShown = false;

	},

	reset: function(){
		this.graph.resize(this.model.xminPrimary, this.model.xmaxPrimary, this.model.ymin, this.model.ymax);
	},

	resize: function(){
		this.graph.resize(this.model.xmin, this.model.xmax, this.model.ymin, this.model.ymax);
	},

	showLossy: function(e){
		var $target = $(e.target);
        var selected = $target .is(':checked');
        this.model.lossyShown = selected;
		this.graph.lossyShown = selected;
		this.graph.clearLabels();
		this.graph.showLabels();
	},

	setrange: function(e){
		e.preventDefault();
		var xl = xleft.value-0;
		var xr = xright.value-0;
		if (xl > xr){
			$("#range-error").show();
			$("#range-error").html("Error: "+xl+" is larger than "+xr);
		}
		else{
			$("#range-error").hide();
			this.graph.resize(xl, xr, this.model.ymin, this.model.ymax);
		}

	},
	updateRange: function(){
		$("#xleft").val(this.model.xmin);
		$("#xright").val(this.model.xmax);
	}
	
});
