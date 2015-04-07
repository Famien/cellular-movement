var config = {
	zoom: .95,
	timeline: {
		timer: null,
		width: 1100,
		barWidth: 6,
		// TODO: Update this and remove this "magic" constant for the width '1100'
		xScale: d3.scale.linear().domain([1880,2014]).range([20, 950])
	}
}
var global = {
	usMapWidth:1500,
	usMapHeight:1200,
	max:200000,
	maxIncome:250000,
	gradientStart:"#fff",
	gradientEnd:"#eee",
	scale:4000000,
	center:[-71.063,42.3562],
	neighbors:null,
	translate:[0,0],
	translateScale:1,
	mapFillColor:null,
	minDifference:15,
	city:city,
	data:null,
	histogramInterval:15,
	weekdayFilter:[0,0]
}
$(function() {
	queue()
		.defer(d3.json, geojson1)
		.defer(d3.json, dots)
		.defer(d3.csv, lines)
		.defer(d3.json,overlap)
		.defer(d3.json,neighbors)
		.defer(d3.json,neighborhoods)
		.await(dataDidLoad);
})

$("#topDifferences .hideTop").hide()

function dataDidLoad(error, geojson1, dots, lines, overlap, neighbors,neighborhoodDictionary) {
	d3.select("#title").html(toTitleCase(city.replace("_"," ")))
	var subtitle = d3.select("#subtitle").html()
	subtitle = subtitle.replace("current city", toTitleCase(city))
	subtitle = subtitle.replace(" 25%",minDifference +"%")
	d3.select("#subtitle").html(subtitle)
	global.neighbors = neighbors
	global.center = center
	global.minDifference = minDifference
	global.scale = scale
//	window.location.hash = JSON.stringify([global.translate, global.translateScale])
	initNycMap(geojson1, dots,lines, "Median", "#svg-1",0,global.maxIncome*100000,neighbors,overlap,neighborhoodDictionary)
	$("#topDifferences .showTop").click(hideTop)
	$("#topDifferences .hideTop").click(showTop)
	d3.selectAll("#svg-1 svg g .topDifferences").attr("opacity",0)
	drawScale()
}
function drawWater(water,svg,fill,stroke,waterClass){
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var path = d3.geo.path().projection(projection);
	var waterShape = d3.select("#svg-1 svg g")
	
//	var tip = d3.tip()
//		.attr('class', 'd3-tip-nyc-difference')
//		.offset([0, 0])
//	
//	waterShape.call(tip);
	waterShape.selectAll(".water")
		.data(water.features)
        .enter()
        .append("path")
		.attr("class","water")
		.attr("d",path)
		.style("fill","#fff")
	    .style("opacity",.8)
//	.on("mouseover", function(d){
//		tip.html( d.properties.FULLNAME)
//		tip.show()
//	})
//	.on("mouseout",function(d){
//		tip.hide()
//	})
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
function hideTop(){
	//console.log("show graph")
	$("#topDifferences .showTop").hide()
	$("#topDifferences .hideTop").show()
	d3.selectAll("#svg-1 svg g .topDifferences").attr("opacity",1)
	
}
function showTop(){
//	console.log("hide graph")
	$("#topDifferences .hideTop").hide()
	$("#topDifferences .showTop").show()
	d3.selectAll("#svg-1 svg g .topDifferences").attr("opacity",0)
}
function getSizeOfObject(obj){
    var size = 0, key;
     for (key in obj) {
         if (obj.hasOwnProperty(key)) size++;
     }
     return size;
}
function sumEachColumnChartData(data,column){
	//console.log(data)
	//console.log(data)
	var groupLength = getSizeOfObject(data)
	var sum = 0
	for(var i =0; i<groupLength; i++){
		//var columns = getSizeOfObject(data[i])
		var columnValue = parseInt(data[i][column])
		sum += columnValue
	}
	return sum
}
var utils = {
	range: function(start, end) {
		var data = []

		for (var i = start; i < end; i++) {
			data.push(i)
		}

		return data
	}
}
var table = {
	group: function(rows, fields) {
		var view = {}
		var pointer = null

		for(var i in rows) {
			var row = rows[i]

			pointer = view
			for(var j = 0; j < fields.length; j++) {
				var field = fields[j]

				if(!pointer[row[field]]) {
					if(j == fields.length - 1) {
						pointer[row[field]] = []
					} else {
						pointer[row[field]] = {}
					}
				}

				pointer = pointer[row[field]]
			}

			pointer.push(row)
		}

		return view
	},

	maxCount: function(view) {
		var largestName = null
		var largestCount = null

		for(var i in view) {
			var list = view[i]

			if(!largestName) {
				largestName = i
				largestCount = list.length
			} else {
				if(list.length > largestCount) {
					largestName = i
					largestCount = list.length
				}
			}
		}

		return {
			name: largestName,
			count: largestCount
		}
	},

	filter: function(view, callback) {
		var data = []

		for(var i in view) {
			var list = view[i]
			if(callback(list, i)) {
				data = data.concat(list)
			}
		}

		return data
	}
}
function sortObjectByValue(toSort){
	var sorted = toSort.sort(function(a,b){return a["Median"]-b["Median"]})
	return sorted
}
function zoomed() {
	//console.log("calling zoomed" + d3.event.scale + ", translate: "+ d3.event.translate )
	map.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  	map.select(".map-item").style("stroke-width", 1.5 / d3.event.scale + "px");
	var newScaleDistance = Math.round((5/d3.event.scale)* 100) / 100
	d3.select("#scale .scale-text").text(newScaleDistance+"km")
	window.location.hash = JSON.stringify([d3.event.translate, d3.event.scale])
}
function initNycMap(paths, dots,lines, column, svg,low,high,neighbors,overlap,neighborhoodDictionary) {
	renderMap(paths,svg, global.usMapWidth,global.usMapHeight)
	drawTimeHistogram(lines)
	formatMovement(lines)
	drawDots(dots)
	if(water != null && water != undefined){
		d3.json(water, function(waterdata) {
			drawWater(waterdata, "#svg-1","#000","blue","water")
		});
	}
//	var parsedTranslate = JSON.parse(window.location.hash.substring(1))[0]
//	var parsedScale = JSON.parse(window.location.hash.substring(1))[1]
//	global.translate = parsedTranslate
//	global.translateScale = parsedScale
//	map.attr("transform", "translate(" + global.translate + ")scale(" + global.translateScale + ")");
}
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI/180)
}
function renderBoroughs(data,svg,width,height){
	var boroughs = d3.select("#svg-1 svg")
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var path = d3.geo.path().projection(projection);
	//console.log(data)
	boroughs.selectAll(".boroughs")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "boroughs")
		.attr("cursor", "pointer")
		.attr("stroke","#eee")
		.attr("fill","#eee")
		.attr("stroke-width",.5)
}
function formatTimeHistogram(data){
	var interval = global.histogramInterval
	var barNumber = 0
	var itemInBar = 0
	var intervalArray = []
	data = table.filter(table.group(data, ["weekday"]), function(list, minute) {
		return (minute >= global.weekdayFilter[0] && minute <= global.weekdayFilter[1])
	})
	var groupByMinute = table.group(data, ["minute"])
	for(var i in groupByMinute){
		itemInBar += groupByMinute[i].length
		if(i%interval == 0){
		intervalArray.push([barNumber,itemInBar])
			
			barNumber += 1
			itemInBar = 0
		}		
	}
	return intervalArray
}
function drawTimeHistogram(data){
	var width = 1000
	var height = 200
	var margin = 60

	var intervalData = formatTimeHistogram(data)
	var barwidth = (width-margin*2)/intervalData.length
	var heightScale = d3.scale.linear().domain([0,200]).range([0,height-margin*2])
	var reverseheightScale = d3.scale.linear().domain([200,0]).range([0,height-margin*2])
	
	var histogram = d3.select("#svg-2").append("svg")
		.attr("width", width)
		.attr("height", height)
	
	var x = d3.scale.linear().domain([0,intervalData.length]).range([0,width-margin*2])
	
	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
		.tickFormat(function(d){
			return d*15/60
		});
	
	var yAxis = d3.svg.axis()
	    .scale(reverseheightScale)
	    .orient("left")
		.ticks(4);
	
	histogram.selectAll("rect")
	.data(intervalData)
	.enter()
	.append("rect")
	.attr("class",function(d){
		return "interval_"+d[0]
	})
	.attr("width", function(d){
		return barwidth-2
	})
	.attr("height",function(d){
		return heightScale(d[1])
	})
	.attr("x",function(d,i){
		return x(d[0])+margin
	})
	.attr("y",function(d){
		return height-heightScale(d[1])-margin-30
	})	
	.attr("fill","#000")
	//	.on("mouseover", function(d){
	//		console.log(d)
	//	})
	
	histogram.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(60,120)")
	    .call(xAxis)

	histogram.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(50,30)")
	    .call(yAxis)
}
function formatMovement(data){
	var colorIndex = 0
	var colorArray =["#5BB076","#6ADE3F","#55992F","#A8DC5C","#60E189","#B7DB94","#5F804C"]
	//var colorDictionary = {"F":"#51471F","M":"#948430","N":"#70682A"}
	var colorDictionary = {"F":"#333","M":"#444","N":"#555"}
	//var colorDictionary = {"F":"#5D8B4A","M":"#79D247","N":"#95DB91"}
	//lat1,lng1,lat2,lng2,weekday,gender,minute,duration,id
	var groupByMinute = table.group(data, ["minute"])
	//console.log(groupByMinute)
	var starttime = 0
	var endtime = starttime+global.histogramInterval*1.0/60
	var weekdayFilter = global.weekdayFilter
	global.data = table.filter(table.group(data, ["weekday"]), function(list, minute) {
		return (minute >= weekdayFilter[0] && minute <= weekdayFilter[1])
	})
	var weekdayDictionary = {
		1:"Monday",
		2:"Tuesday",
		3:"Wednesday",
		4:"Thursday",
		5:"Friday",
		6:"Saturday",
		0:"Sunday"
	}
	d3.select("#title").html(weekdayDictionary[weekdayFilter[0]]+" - "+weekdayDictionary[weekdayFilter[1]])
	setInterval(function(){
		starttime +=.1
		endtime+=.1
		var weekdaycolor = {1:"green"}
			data = table.filter(table.group(global.data, ["minute"]), function(list, minute) {
				return (minute > starttime*60 && minute < endtime*60)
			})
			for(var i in data){
			var numberOfSegments = data[i]
			//var color = colorArray[placeInColorArray]
			var gender = data[i]["gender"]
			var minutes = data[i]["minute"]
			var weekday = data[i]["weekday"]
			var duration = data[i]["duration"]		
			var color = colorDictionary[gender]
			//console.log(data[i])
			drawMovement(data[i],color,duration)
			var barNumber = Math.round(starttime*60/global.histogramInterval)
			d3.selectAll("#svg-2 rect").attr("fill","#000")
			d3.selectAll(".interval_"+barNumber).attr("fill","#70682A")
			d3.select("#subtitle")
				.html("time interval size: " + global.histogramInterval+" minutes</br>"
				
				+ "start time between: " + Math.round(starttime*100)/100 + " - "+Math.round(endtime*100)/100 )
			
			if(endtime> 23){
				starttime = 0
				endtime = starttime+global.histogramInterval*1.0/60
			}
		}	
		
	},100)
}
function drawMovement(data,color,duration){
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var moveMap = d3.select("#svg-1 svg g")
	var lineData = [{x:parseFloat(data["lat1"]),y:parseFloat(data["lng1"])},{x:parseFloat(data["lat2"]),y:parseFloat(data["lng2"])}]
	
	var line = d3.svg.line()
	.interpolate("basis")
	.x(function(d){
		//console.log(d)
		return projection([d["y"],d["x"]])[0]})
	.y(function(d){return projection([d["y"],d["x"]])[1]})
	
	var path = moveMap.append("path")
	.attr("class","line")
	.attr("d", line(lineData))
	.attr("fill","none")
	.attr("stroke", color)
	.attr("stroke-width",1)
	.attr("opacity",0.2)
	.on("mouseover",function(){console.log([lineData[0],lineData[1]])})
		
//	.style("stroke-dasharray", ("20, 3"))
		var totalLength = path.node().getTotalLength();
	if(totalLength>100){
	var dashLength = 50	
	}
	else{
	var dashLength = totalLength/20
	}
	path.attr("stroke-dasharray",totalLength + " " + totalLength)
		.attr("stroke-dashoffset", totalLength)
		.transition()
		//.delay(colorIndex*500)
	    .duration(2000)
	    .ease("linear")
	    .attr("stroke-dashoffset", 0)
		.attr("opacity",0.1)
		.transition()
		.delay(2000)
		.remove()

}
function drawDots(data){
	//console.log(data)
	for(var i in data){
	//	console.log([i,data[i]])
		for (var dots in data[i]){
			//console.log(data[i][dots])
			drawEach(data[i][dots])
		}
	}

}

function drawEach(data){
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var dotMap = d3.select("#svg-1 svg").append("g").attr("class","scatterplot")
	dotMap
	//.data(data)
	//.enter()
	.append("circle")
	.attr("cx",function(){
		return projection([data[1],data[0]])[0]
	})
	.attr("cy",function(){
		//console.log(d)
		return projection([data[1],data[0]])[1]
	})
	.attr("r", 2)
	.attr("fill","black")
	.attr("opacity",.1)
	
}
function isInArray(value, array) {
  return array.indexOf(value) > -1;
}
function calculateScaleSize(){
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var lat1 = global.center[1]
	var lng1 = global.center[0]
	var lat2 = lat1+0.1
	var lng2 = global.center[0]+0.1
	var distance = getDistanceFromLatLonInKm(lat1,lng1,lat2,lng2)
	//console.log(distance+"km")
	var x1 = projection([lng1,lat1])[0]
	var y1 = projection([lng1,lat1])[1]
	var x2 = projection([lng2,lat2])[0]
	var y2 = projection([lng2,lat2])[1]
	var screenDistance = Math.sqrt(Math.pow(Math.abs(x2-x1),2)+Math.pow(Math.abs(y2-y1),2))
//	console.log([x1,x2,y1,y2,screenDistance])
	
	var screenDistance1km = screenDistance/distance
	var screenDistance100km = screenDistance1km*100
	//console.log(screenDistance1km)
	return screenDistance1km
}
function drawScale(){
	var kmInPixels = calculateScaleSize()
//	console.log(kmInPixels)
	var scale = d3.select("#scale")
			.append("svg")
			.attr("width",kmInPixels*6)
			.attr("height",50)
		scale.append("rect")
			.attr("class","scale")
			.attr("x",20)
			.attr("y",20)
			.attr("width",kmInPixels)
			.attr("height",1)
			.attr("fill","#000")
		
		scale.append("text")
			.attr("class","scale-text")
			.text("1 km")
			.attr("x",40)
			.attr("y",35)
			.attr("font-size",12)
}
function renderMap(data, selector,width,height) {
	var projection = d3.geo.mercator().scale(global.scale).center(global.center)
	var path = d3.geo.path().projection(projection);
	
	var zoom = d3.behavior.zoom()
	    .translate([0, 0])
	    .scale(1)
	    .scaleExtent([1, 10])
	    .on("zoom", zoomed);
		
	var svg = d3.select(selector).append("svg")
		.attr('height', height)
		.attr('width', width)
		.attr("fill", "none");
		
	map =  svg.append("g")

	map.append("rect")
	    .attr("class", "overlay")
	    .attr("width", width)
	    .attr("height", height)
	 	.call(zoom);
				
	map.selectAll(".map").append("path")
		.data(data.features)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("class", "map-item")
		.attr("cursor", "pointer")
		.call(zoom);
	return map
}
function medianValuesOnly(data){
	var dataById = table.group(data,["Id"])
	var medians = []
	//console.log(dataById)
	for(var i in dataById){
		var income = parseInt(dataById[i][0]["Median"])
		//console.log(dataById[i][0])
		var population = dataById[i][0]["Total"]
		if(income !="-" && isNaN(income)==false){
			medians.push(income)
		}
	}
	var sorted = medians.sort(sortInt)
	return sorted
}
function sortInt(a,b){
	return a-b
}
function calculatePercentile(data,income){
	var totalItems = data.length
	var percentile = Math.round(data.indexOf(income)/totalItems*100)
//	console.log([totalItems,percentile])
	return percentile
}
function formatDifferenceData(data,overlapData){
	var medianValues = medianValuesOnly(data)
	var percentile = calculatePercentile(medianValues,80000)
	//console.log(percentile)
	
	var dataById = table.group(data, ["Id"])
	var incomes = []
	var minDifference = global.minDifference
	for(var i in overlapData){
		var id1 = overlapData[i]["id1"]
		var id2 = overlapData[i]["id2"]
		if(id1 in dataById && id2 in dataById){
		//console.log([income1,income2])
			if(!isNaN(parseInt(dataById[id2][0]["Median"])) || !isNaN(parseInt(dataById[id1][0]["Median"]))){
				var income1 = parseInt(dataById[id1][0]["Median"])
				var income2 = parseInt(dataById[id2][0]["Median"])
				var average = (income1+income2)/2			
				var incomeDifference = Math.abs(income1-income2)
				var percent1 = incomeDifference/income1*100
				var percent2 = incomeDifference/income2*100
				//var percentileDifference = Math.abs(percent1-percent2)
				var pop1 = parseInt(dataById[id1][0]["Total"])
				var pop2 = parseInt(dataById[id2][0]["Total"])
				var popDifference = Math.abs(pop1-pop2)
				var pop1Percent = popDifference/pop1*100
				var pop2Percent = popDifference/pop2*100
				var popPercentDif = Math.abs(pop1Percent-pop2Percent)
			
				var percentile1 = calculatePercentile(medianValues,income1)
				var percentile2 = calculatePercentile(medianValues,income2)
				var percentileDifference = Math.abs(percentile1-percentile2)
				//console.log([income1,percentile1,income2,percentile2,percentileDifference])
				//console.log(pop1,pop2,popPercentDif)
			//	console.log(percentileDifference)
				var lng1 = parseFloat(overlapData[i]["lng1"])
				var lng2 =parseFloat(overlapData[i]["lng2"])
				var lat1 = parseFloat(overlapData[i]["lat1"])
				var lat2 = parseFloat(overlapData[i]["lat2"])
			
				if(isNaN(lng2)){
					lng2 = lng1
				}
				if(isNaN(lat2)){
					lat2 = lat1
				}
			
				var average = (income1+income2)/2			
				var incomeDifference = Math.abs(income1-income2)
				var percentageDifference = incomeDifference/average*100
				//console.log(percentageDifference)
				if( percentileDifference>minDifference &&income1 !=0 && !isNaN(pop1)&& !isNaN(pop2)&& income2!=0 && popDifference<pop1 && popDifference<pop2 && pop1 !=0 && pop2 !=0){
					incomes.push({income1:income1, income2:income2, percentile1:percentile1,percentile2:percentile2,id1:overlapData[i]["id1"],id2:overlapData[i]["id2"],lng1:lng1,lat1:lat1,lng2:lng2,lat2:lat2,difference:percentileDifference})
				}
			}
		}
	}
	//console.log(incomes)
	var sortedIncomes = incomes.sort(function(a,b){return a["difference"]-b["difference"]}).reverse()
	return sortedIncomes
}
function renderNycMap(data, column,svg,low,high,neighbors,neighborhoodDictionary) {
	var map = d3.select(svg).selectAll(".map-item")
	var companiesByZipcode = table.group(data, ["Id"])
	var idToNeighborhood = neighborhoodDictionary.blockgroup_nhoods
	//	var largest = table.maxCount(companiesByZipcode)
	//console.log(companiesByZipcode)
	var colorScale = function(d) {
		var scale = d3.scale.linear().domain([0,global.max]).range([global.gradientStart, global.gradientEnd]); 
		var x = companiesByZipcode[d.properties.GEOID]
		if(!x){
			return scale(1)
		}else{
			if(isNaN(x[0][column])) {
				return scale(1)
			}
			if(x[0][column] < low ||x[0][column] > high){
				return "#eee"
			}
			return scale(x[0][column])
		}
	}

	map.attr("stroke-opacity", 1)
		.attr("stroke","none")
		.attr("fill-opacity", 1)
		.attr("fill",colorScale)
		.attr("stroke-width",.5)
		var tip = d3.tip()
		  .attr('class', 'd3-tip-nyc')
		  .offset([-10, 0])
	
		map.call(tip);
		map.on('mouseover', function(d){
			global.mapFillColor = d3.select(this).attr("fill")
			
			var currentZipcode = d.properties.GEOID
			var currentIncome = table.group(data, ["Id"])[currentZipcode][0][column]
			var currentIncome = currentIncome.replace("+","")
			var currentIncome = currentIncome.replace(",","")
			var neighborhood = idToNeighborhood[currentZipcode]
			if(companiesByZipcode[currentZipcode]){
				if(isNaN(currentIncome) || currentIncome == "" || currentIncome == undefined){
					//tipText = "no data"
					//console.log(companiesByZipcode[currentZipcode])
					d3.selectAll("#svg-2 svg").remove()
				}
				else{
					//tipText = "block group: "+currentZipcode+"<br/>median household income:$"+ currentIncome
					if(neighborhood == ""){
						tipText = "block group "+currentZipcode
					}else{
					tipText = "block group "+currentZipcode+" in "+neighborhood
					}
					var test = "test"
					tip.html(function(d){return tipText})
					tip.show()
					d3.select("#current-details").html("Adjacent Median Incomes:</br> Census block group "+currentZipcode+" has median household income of $"+currentIncome)
					drawNeighborsGraph(companiesByZipcode, currentZipcode)
					d3.select(this).attr("fill","red")
				}
			}			
		})
		.on('mouseout', function(d){
			d3.select(this).attr("fill",global.mapFillColor)
			d3.select("#current-details").html("")
			tip.hide()
			d3.selectAll("#svg-2 svg").remove()
		})
		//.on("click",function(d){
		//	console.log(d.properties.GEOID)
		//	console.log(companiesByZipcode[d.properties.GEOID][0]["Total"])
		//	console.log(companiesByZipcode[d.properties.GEOID])
		//})
	return map
}
function drawNeighborsGraph(data, id){
	d3.selectAll("#svg-2 svg").remove()
	var height = 140
	var width = 400
	var chart = d3.selectAll("#svg-2")
			.append("svg")
			.attr("width",width)
			.attr("height",height)
			.append("g")
			.attr("transform","translate(80,20)")
	var margin = 80
	var neighborsMedians = []
	var incomeScale = d3.scale.linear().domain([0,250000]).range([0,height-margin])
	var incomeScaleReverse = d3.scale.linear().domain([0,250000]).range([height-margin,0])
	
	var selectedIdMedian = parseInt(data[id][0]["Median"])
	neighborsMedians.push({"id":id,"Median": selectedIdMedian})

	var marginLeft = 30
	var yAxis = d3.svg.axis().scale(incomeScaleReverse).orient("left").ticks(4)
	var sum = selectedIdMedian
	var divideBy = 1
	
	var neighborsList = global.neighbors[id]
	for(var neighbor in neighborsList){
		var currentId = neighborsList[neighbor]
		if(currentId in data){
			var income = parseInt(data[currentId][0]["Median"])	
			if(!isNaN(income)){
				neighborsMedians.push({"id":currentId,"Median":income})
				sum = sum+income
				divideBy +=1
			}
		}		
	}

	var neighbors = neighborsMedians.items;
	var average = sum/divideBy
	//console.log(average)
	//console.log(neighbors)
	chart.selectAll("rect")
		.data(sortObjectByValue(neighborsMedians))
		.enter()
		.append("rect")
		.attr("x", function(d,i){
			return i*8+10
		})
		.attr("y", function(d){
			return height-margin-incomeScale(d.Median)
		})
		.attr("width", 6)
		.attr("height", function(d){
			return incomeScale(d.Median)
		})
		.attr("fill",function(d){
			if(d.id == id){
				return "red"
			}else{
				return "black"
			}
		})
		
		chart.append("rect")
			.attr("class","average")
			.attr("x", 0)
			.attr("y", function(){
				return height-margin-incomeScale(average)
			})
			.attr("width", divideBy*8+10)
			.attr("height", 1)
			.attr("fill","#aaa")
		chart.append("text")
			.attr("class","average-text")
			.attr("x", 5)
			.attr("y", function(){
				return height-margin-incomeScale(average)-5
			})
			.text("Average $"+ parseInt(average))
			.attr("font-size",10)
	chart.append("g").attr("class", "y axis").call(yAxis)
}
function showHide(shID) {
   if (document.getElementById(shID)) {
      if (document.getElementById(shID+'-show').style.display != 'none') {
         document.getElementById(shID+'-show').style.display = 'none';
         document.getElementById(shID).style.display = 'block';
      }
      else {
         document.getElementById(shID+'-show').style.display = 'inline';
         document.getElementById(shID).style.display = 'none';
      }
   }
}