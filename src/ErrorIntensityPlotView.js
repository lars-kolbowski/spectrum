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
//		ErrorIntensityPlotView.js
var ErrorIntensityPlotView = Backbone.View.extend({
	
	events : {
		'click #toggleView' : 'toggleView',
	},

	initialize: function() {

		//this.show = true;

		var self = this;

		this.svg = d3.select(this.el.getElementsByTagName("svg")[0]);

		this.margin = {top: 110, right: 60, bottom: 50, left: 65};

		var width = 960 - this.margin.left - this.margin.right;
		var height = 500 - this.margin.top - this.margin.bottom;

		this.wrapper = this.svg
			.append('g')
			.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'wrapper')
			.style("opacity", 0); 

		this.tooltip = CLMSUI.compositeModelInst.get("tooltipModel");

		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'changed:ColorScheme', this.render);
		this.listenTo(this.model, 'changed:Highlights', this.updateHighlights);
	},

	toggleView: function(){
		if (!this.model.showSpectrum){
			this.render();
			this.wrapper.style("opacity", 1);
		}
		else{
			this.wrapper.style("opacity", 0);
			this.background.attr("height", 0)
		}
	},

	clear: function() {
		this.wrapper.selectAll("*").remove();
	},

	render: function() {

		if (this.model.JSONdata === undefined || this.model.JSONdata === null)
			return;

		this.clear();
		//get Data
		var fragments = this.model.fragments;

		var self = this;
		this.data = [];

		fragments.forEach(function(fragment){
			var peptideId = fragment.peptideId;
			var fragId = fragment.id;
			fragment.clusterInfo.forEach(function(cluster){
				var firstPeakId = self.model.JSONdata.clusters[cluster.Clusterid].firstPeakId;
				var point = {
					fragId: fragId,
					peptideId: peptideId,
					intensity: self.model.JSONdata.peaks[firstPeakId].intensity,
					error: Math.abs(cluster.error),
					charge: self.model.JSONdata.clusters[cluster.Clusterid].charge,
					//mz: self.model.JSONdata.peaks[firstPeakId].mz
				}
				self.data.push(point);
			});
		});

		var cx = this.wrapper.node().parentNode.clientWidth;
		var cy = this.wrapper.node().parentNode.clientHeight;

		var width = cx - self.margin.left - self.margin.right;
		var height = cy - self.margin.top - self.margin.bottom;

		this.xmax = d3.max(this.data, function(d) { return d['error']; });
		this.ymax = d3.max(this.data, function(d) { return d['intensity']; });

		this.x = d3.scale.linear()
		          .domain([ 0, this.xmax ])
		          .range([ 0, width ]);


		this.y = d3.scale.linear()
			      .domain([ 0, this.ymax ]).nice()
			      .range([ height, 0 ]).nice();

		this.yTicks = height / 40;
		this.xTicks = width / 100;
		    
		// draw the x axis
		this.xAxis = d3.svg.axis().scale(self.x).ticks(this.xTicks).orient("bottom");

		this.xAxisSVG = this.wrapper.append('g')
			.attr('transform', 'translate(0,' + height + ')')
			.attr('class', 'axis')
			.call(this.xAxis);

		this.xLabel = this.wrapper.append("text")
			.attr("class", "xAxisLabel")
			.text("ppm error")
			.attr("dy","2.4em")
			.style("text-anchor","middle").style("pointer-events","none");
		this.xLabel.attr("x", width/2).attr("y", height);

		// draw the y axis
		self.yAxis = d3.svg.axis().scale(this.y).ticks(this.yTicks).orient("left").tickFormat(d3.format("s"));

		this.yAxisSVG = this.wrapper.append('g')
			.attr('transform', 'translate(0,0)')
			.attr('class', 'axis')
			.call(this.yAxis);

		this.yLabel = this.wrapper.append("g").append("text")
			.attr("class", "axis")
			.text("Intensity")
			.style("text-anchor","middle").style("pointer-events","none");

		this.yLabel.attr("transform","translate(" + -50 + " " + height/2+") rotate(-90)");

		this.wrapper.selectAll('.axis line, .axis path')
				.style({'stroke': 'Black', 'fill': 'none', 'stroke-width': '1.2px'});

		this.g = this.wrapper.append('g');

		this.background = this.g.append("rect")
			.style("fill", "white")
			.attr("width", width)
			.attr("height", height);

		this.background.on("click", function(){
			this.model.clearStickyHighlights();
		}.bind(this)); 

		var p1color = this.model.p1color;
		var p2color = this.model.p2color;

		this.highlights = this.g.selectAll('scatter-dot-highlights')
			.data(this.data)
			.enter().append('circle')
			.attr("cx", function (d) { return self.x(d['error']); } )
		 	.attr("cy", function (d) { return self.y(d['intensity']); } )
			.style('fill', this.model.highlightColour)
			.style('opacity', 0)
			.style('pointer-events', 'none')
			.attr('id', function (d) { return d.fragId })
			.attr('r', 10);

		this.datapoints = this.g.selectAll('scatter-dots')
			.data(this.data)
			.enter().append('circle')
			.attr("cx", function (d) { return self.x(d['error']); } )
			.attr("cy", function (d) { return self.y(d['intensity']); } )
			.attr('id', function (d) { return d.fragId })
			.style("cursor", "pointer")
			.style("fill-opacity", 0)
			.style("stroke-width", 1)
			.style("fill", function(d) { 
				if (d['peptideId'] == 0) return p1color;
				else return p2color; } )
			.style("stroke", function(d) { 
				if (d['peptideId'] == 0) return p1color;
				else return p2color; } )
			.on("mouseover", function(d) {
				var evt = d3.event;
				self.model.addHighlight([self.model.fragments[d.fragId]]);
				self.showTooltip(evt.pageX, evt.pageY, d);
			})
			.on("mouseout", function(d) {
				self.model.clearHighlight([self.model.fragments[d.fragId]]);
				self.hideTooltip();
			})
			.on("click", function(d) {
				var evt = d3.event;
				self.stickyHighlight(d.fragId, evt.ctrlKey);
			})
			.attr("r", 3);

		this.updateHighlights();

	},

	showTooltip: function(x, y, data){
		if (this.model.showSpectrum)
			return

		var contents = [["charge", data.charge], ["error", data.error.toFixed(3)], ["Int", data.intensity.toFixed(0)]];
		
		var fragId = data.fragId;
		var fragments = this.model.fragments.filter(function(d) { return d.id == fragId; });
		var header = [[fragments[0].name]];
				
		this.tooltip.set("contents", contents )
			.set("header", header.join(" "))
			.set("location", {pageX: x, pageY: y});
	},

	hideTooltip: function(){
		if (this.model.showSpectrum)
			return
		this.tooltip.set("contents", null);
	},

	stickyHighlight: function(fragId, ctrlKey){

		var fragId = parseInt(fragId);
		var fragments = this.model.fragments.filter(function(d) { return d.id == fragId; });

		this.model.updateStickyHighlight(fragments, ctrlKey);

	},

	startHighlight: function(fragId){
		var id = fragId;
		var highlights = this.highlights[0].filter(function(d) { return parseInt(d.id) == id; });
		var points = this.datapoints[0].filter(function(d) { return parseInt(d.id) == id; });
		highlights.forEach(function(circle){
			circle.style.opacity = 1;
		})

		points.forEach(function(point){
			point.style.fillOpacity = 1;
		})
	},

	clearHighlights: function(){



		this.highlights[0].forEach(function(circle){
			circle.style.opacity = 0;
		})

		this.datapoints[0].forEach(function(point){
			point.style.fillOpacity = 0;
		})
	},


	updateHighlights: function(){
		this.clearHighlights();
		for (var i = this.model.highlights.length - 1; i >= 0; i--) {
			this.startHighlight(this.model.highlights[i].id);
		};
		

	},

});



		// var peaks = this.graph.points;

		// for(p = 0; p < peaks.length; p++){
		// 	if(peaks[p].fragments.length > 0)
		// 		peaks[p].highlight(false);
			
		// 	var highlightFragments = _.intersection(peaks[p].fragments, this.model.highlights);
		// 	if(highlightFragments.length != 0){
		// 		peaks[p].highlight(true, highlightFragments);
		// 	}
		// }
		// this.graph.updatePeakColors();
		// this.graph.updatePeakLabels();
