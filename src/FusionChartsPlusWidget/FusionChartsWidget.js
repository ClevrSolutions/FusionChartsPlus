/**
	Fusion Chart Widget
	========================

	@file      : FusionChartsWidget.js
	@version   : 2.0
	@author    : Roeland Salij / Tobin Hupsel
	@date      : 25-3-2011
	@copyright : Mendix / Mansystems
	@license   : Please contact our sales department.

	Documentation
	=============
	This widget can be used to show differtent types of charts.
	
	Open Issues 
	===========
	
*/ 
 
define([
	"dojo/_base/declare",
	"mxui/widget/_WidgetBase"
], function (declare, _WidgetBase) {
	return declare("FusionChartsPlusWidget.FusionChartsWidget", [_WidgetBase], {

			width:500,
			height:400,
			refresh:false,
			refreshInterval:5,
			refreshMicroflow :'',
			drillDownMicroflow:'',
			editNodeMicroflow :'',
			deleteNodeMicroflow :'',
			addNodeMicroflow :'',
			editLinkMicroflow :'',
			deleteLinkMicroflow :'',
			resetChartMicroflow :'',

	
	//IMPLEMENTATION
	graphObject : null,
	tries : 0,
	
	chartType : '',
			
	// updates the widget with a new dataobject 
	setDataobject : function(mxObject) {
		
		setTimeout(dojo.hitch(this, function() {
		
			this.graphObject = mxObject;
			logger.debug(this.id + ".setDataobject");
			
			if(this.graphObject.has('source'))
			{
				var myChart = FusionCharts( "chartid_"+this.id );
				var chartType = this.graphObject.get('chartType');
				
				if (myChart == null || this.chartType != chartType ){
				
					this.chartType = chartType;
					var myChart = new FusionCharts("widgets/FusionChartsPlusWidget/Charts/" + this.chartType + '.swf', "chartid_"+this.id, this.width, this.height, "0", "1");
					
					var source = this.graphObject.get('source');
					myChart.setDataXML(source.replace(/#widgetid#/gi,this.id));
					myChart.render("chartdiv_"+this.id);
				     
					setTimeout(dojo.hitch(this, this.setWidgetID), 1000);
				}else {
					this.renderChart(myChart);
					setTimeout(dojo.hitch(this, this.setWidgetID), 1000);
				}
				
				if(this.refresh == true){
					setTimeout(dojo.hitch(this, this.refreshChart), this.refreshInterval*60000);	
				}
			}
		}), 100);	
	},
	
	renderChart : function (myChart){
		var source = this.graphObject.get('source');
		myChart.setDataXML(source.replace(/#widgetid#/gi,this.id));
	},
	
	refreshChart : function (){
		this.execaction(this.refreshMicroflow);
	},
	
	addNode: function(NodeID){
		
		this.graphObject.set("SelectedID", NodeID[0]);
		this.execaction(this.addNodeMicroflow);
	},
	
	editNode: function(NodeID){
		
		this.graphObject.set("SelectedID", NodeID[0]);
		this.execaction(this.editNodeMicroflow);
	},
	
	deleteNode: function(NodeID){
		
		this.graphObject.set("SelectedID", NodeID[0]);
		this.execaction(this.deleteNodeMicroflow);
	},
	
	editLink: function(args){
		
		this.graphObject.set("FromNodeID", args[0]);
		this.graphObject.set("ToNodeID", args[1]);
		this.execaction(this.editLinkMicroflow);
	},
	
	deleteLink: function(args){
		
		this.graphObject.set("FromNodeID", args[0]);
		this.graphObject.set("ToNodeID", args[1]);
		this.execaction(this.deleteLinkMicroflow);
	},
	
	resetChart: function(NodeID){
		
		this.graphObject.set("SelectedID", NodeID[0]);
		this.execaction(this.resetChartMicroflow);
	},
	
	setWidgetID : function(){
		
		var myChart = FusionCharts( "chartid_"+this.id );
		
		if(myChart !=null && myChart.setWidgetID != null){
			myChart.setWidgetID(this.id);
		} else if(this.tries <3) {
			this.tries +=1;
			setTimeout(dojo.hitch(this, this.setWidgetID), 1500);
		}
	},
	
	drillDown: function(args){
		this.graphObject.set("SelectedID", args[0]);
		this.execaction(this.drillDownMicroflow);
	},
	
	execaction : function(mf) {
		if (mf)
			mx.ui.action(mf, {
				callback : function(){},
				error : function() {
					logger.error(this.id + "error: error executing microflow");
				}
			});
	},
	
	//reload chart after ChartXML gets an update
	objectUpdateNotification : function(mxObject){
		var guid = dojo.isObject(mxObject) ? mxObject.getGuid() : mxObject;
		
		mx.data.get({
			guid: guid, 
			callback: dojo.hitch(this, this.setDataobject)
		});
	},

	//summery : stub function, will be used or replaced by the client environment
	onChange : function(){
	},
		
		//readonly?		
	_setDisabledAttr : function(value) {
	},
		
	postCreate : function(){
	
		window.fusionCallback = function (wID, funcName) {
			var widget = dijit.byId(wID);
			if(widget != null){
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				args.shift();
				widget[funcName](args);
			}
		};
		
		setTimeout(dojo.hitch(this, function() { //Thread, solves JS exception issue
			if (this.domNode && this.domNode.parentNode) { //still in tree?
				dojo.empty(this.domNode);
				this.domNode.innerHTML = "<div class=\"FusionChartsPlus\" dojoAttachPoint=\"FCNode\"> <div id=\"chartdiv_"+this.id+"\" /> </div>";
			}
		}), 1);	
    },
	
	applyContext : function(context, callback){
		//logger.debug(this.id + ".applyContext");

		if (context){
			//Subcribe for getting updates from ChartXML
			this.subscribe({
				guid   : context.getTrackId(),
				callback : dojo.hitch(this, this.objectUpdateNotification)
			});
			mx.data.get({
				guid: context.trackId,
				callback: dojo.hitch(this, this.setDataobject)
			});
		}else
			logger.warn(this.id + ".applyContext received empty context");
			
		callback && callback();
	},
	
	uninitialize : function(){
		logger.debug(this.id + ".uninitialize");
		var myChart = FusionCharts( "chartid_"+this.id );
		if(myChart!=null){
			FusionCharts( "chartid_"+this.id ).dispose();
		}
		window.fusionCallback =null;
	}
   });
});
require(["FusionChartsPlusWidget/js/FusionCharts", "FusionChartsPlusWidget/js/highcharts",
"FusionChartsPlusWidget/js/jquery.min", "FusionChartsPlusWidget/FusionChartsWidget"], function (FusionCharts) {});
