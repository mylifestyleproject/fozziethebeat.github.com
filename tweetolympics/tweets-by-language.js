var projection = d3.geo.azimuthal()
                       .scale(240)
                       .origin([-71.03,42.37])
                       .mode("orthographic")
                       .translate([310, 250]);

var w = 480, h = 300;
var layout = d3.layout.cloud()
                      .timeInterval(10)
                      .size([w, h])
                      .fontSize(function(d) { return fontSize(+d.value); })
                      .text(function(d) { return d.key; })
                      .on("word", progress)
                      .on("end", draw);

var circle = d3.geo.greatCircle()
                   .origin(projection.origin());
var fill = d3.scale.category20b();


var words = [],
    max,
    tags;

var complete = 0,
    maxWords = 150,
    maxLength = 30,
    spiralType = "archimedean",
    fontType = "Impact",
    scaleType = "log";

var fontSize = d3.scale.log().range([10, 100]),
    fetcher = "http://search.twitter.com/search.json?rpp=100&q={word}",
    statusText = d3.select("#status");

var scale = {
  orthographic: 240,
  stereographic: 240,
  gnomonic: 240,
  equidistant: 240/ Math.PI * 2,
  equalarea: 240 / Math.SQRT2
};

var path = d3.geo.path().projection(projection);
var logScale = d3.scale.log();
var scaleCount = function(x) { return Math.round(logScale(x)) + 1; };

var svg, worldCountries, feature; 
var cloudSvg, background, vis;
/*
var sportSvg = d3.select("#sports")
                 .append("svg")
                 .attr("width", 480)
                 .attr("height", 200);
                 */

d3.json("olympics.total.langs.json", function(totalLangCounts) {
    totalLangCounts.forEach(function (entry, i) {
        entry.value = +entry.value;
    });
    d3.select("#sports").selectAll(".controls")
      .data(totalLangCounts)
      .enter()
      .append("a")
      .attr("id", function(d) { return d.key; })
      .text(function(d) { return d.key; })
      .on("click", function (d) {
          var newSport = d3.select(this).attr("id");
          activate("sports", newSport);
          loadGlobe(activeLabel("sports"));
          loadTagCloud(activeLabel("sports"));
      });
    d3.select("#sports #" + totalLangCounts[0].key).classed("active", true);

    var labelChart = d3.select("#sportLabels").append("svg")
                       .attr("class", "chart")
                       .attr("width", 80)
                       .attr("height", 200);

    var langChart = d3.select("#sportBars").append("svg")
                      .attr("class", "chart")
                      .attr("width", 400)
                      .attr("height", 200);

    var realSports = totalLangCounts.slice(1);
    var sportValues = realSports.map(function(entry) { return entry.value; });
    var x = d3.scale.linear()
                    .domain([0, d3.max(sportValues)])
                    .range([0, 400]);
    langChart.selectAll("rect")
             .data(realSports)
             .enter()
             .append("rect")
             .attr("y", function(d, i) { return i*20; })
             .attr("width", function(d) { return x(d.value); })
             .attr("height", 20);

    langChart.selectAll("text")
             .data(realSports)
             .enter()
             .append("text")
             .attr("class", "bar")
             .attr("x", function(d) { return x(d.value); })
             .attr("y", function(d, i) { return i*20; })
             .attr("dx", -3)
             .attr("dy", "1em")
             .attr("text-anchor", "end")
             .text(function(d) { return d.value ; });

    labelChart.selectAll("text")
              .data(realSports)
              .enter()
              .append("text")
              .attr("x", 0)
              .attr("y", function(d, i) { return i*20; })
              .attr("dy", "1em")
              .text(function(d) { return d.key; });

    console.log("adding labels and counts");
    d3.json("world-countries.json", function(collection) {
        worldCountries = collection;
        loadGlobe(activeLabel("sports"));
    });

    loadTagCloud(activeLabel("sports"));
});


function generate() {
  layout.font(fontType)
        .spiral(spiralType);
  if (tags.length)
      fontSize.domain([+tags[tags.length - 1].value || 1, +tags[0].value]);
  complete = 0;
  statusText.style("display", null);
  words = [];
  layout.stop()
        .words(tags.slice(0, max))
        .start();
}

function progress(d) {
    statusText.attr("value", ~~(++complete*100 / max));
}

function draw(data, bounds) {
  statusText.style("display", "none");
  var scale = bounds ? Math.min(
      w / Math.abs(bounds[1].x - w / 2),
      w / Math.abs(bounds[0].x - w / 2),
      h / Math.abs(bounds[1].y - h / 2),
      h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;
  words = data;
  var text = vis.selectAll("text")
                .data(words, function(d) { return d.text.toLowerCase(); });
  text.transition()
      .duration(1000)
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; });

  text.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
      .style("font-size", function(d) { return d.size + "px"; })
      .on("click", function(d) { loadTagCloud(activeLabel("sports")); })
      .style("opacity", 1e-6)
      .transition()
      .duration(1000)
      .style("opacity", 1);

  text.style("font-family", function(d) { return d.font; })
      .style("fill", function(d) { return fill(d.text.toLowerCase()); })
      .text(function(d) { return d.text; });

  var exitGroup = background.append("g")
                            .attr("transform", vis.attr("transform"));
  var exitGroupNode = exitGroup.node();

  text.exit().each(function() {
    exitGroupNode.appendChild(this);
  });

  exitGroup.transition()
           .duration(1000)
           .style("opacity", 1e-6)
           .remove();
  vis.transition()
     .delay(1000)
     .duration(750)
     .attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
}

function setupCloudSvg() {
    cloudSvg = d3.select("#tagCloud")
                 .append("svg")
                 .attr("width", w)
                 .attr("height", h);

    background = cloudSvg.append("g");

    vis = cloudSvg.append("g")
                  .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");
}

function loadTagCloud(sport) {
    clearsvg("#tagCloud");
    setupCloudSvg();
    var countFile = "olympics." + sport + ".tags.json";
    d3.json(countFile, function(tagCounts) {
        tags = {};
        tagCounts.forEach(function(entry, i) {
            tags[entry.key] = +entry.value;
        });
        tags = d3.entries(tags).sort(function(a, b) { return b.value - a.value; });
        max = Math.min(tags.length, maxWords)
        generate();
    });
}

function loadGlobe(sport) {
    clearsvg("#globe");
    setupsvg();
    var langFile = "olympics." + sport + ".langs.json";
    d3.json(langFile, function(languageCounts) {
        var langMap = {}
        languageCounts.forEach(function(le, i) {
            langMap[le['user.lang']] = parseInt(le['count']);
        });
        var tweetCount = function(lang) {
            if (lang in langMap)
                return langMap[lang];
            else 
                return 1;
        };

        // language mappings found by
        // http://www.loc.gov/standards/iso639-2/php/code_list.php
        feature = svg.selectAll("path")
                     .data(worldCountries.features)
                     .enter()
                     .append("svg:path")
                     .attr("class", function(d) { return "q" + scaleCount(tweetCount(d.lang)) + "-9"; })
                     .attr("d", clip);

        feature.append("svg:title")
               .text(function(d) { return d.properties.name + ": " + tweetCount(d.lang) + " tweets"; });
    });
};

d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

d3.select("select").on("change", function() {
  projection.mode(this.value).scale(scale[this.value]);
  refresh(750);
});

var m0,
    o0;

function mousedown() {
  m0 = [d3.event.pageX, d3.event.pageY];
  o0 = projection.origin();
  d3.event.preventDefault();
}

function mousemove() {
    if (m0) {
        var m1 = [d3.event.pageX, d3.event.pageY];
        rotateGlobe([o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8]);
    }
}

function rotateGlobe(newOrigin) {
    projection.origin(newOrigin);
    circle.origin(newOrigin)
    refresh();
}

function updateGlobe() {
    var origin = projection.origin();
    rotateGlobe([origin[0] + 1, origin[1]]);
}

setInterval(updateGlobe, 40);

function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}

function refresh(duration) {
  (duration ? feature.transition().duration(duration) : feature).attr("d", clip);
}

function clip(d) {
  return path(circle.clip(d));
}


function activeLabel(controlGroup) {
    return d3.selectAll("#" + controlGroup).select(".active").attr("id");
};

function activate(group, link) {
    d3.selectAll("#" + group + " a").classed("active", false);
    d3.select("#" + group + " #" + link).classed("active", true);
};

function clearsvg(div) {
    d3.select(div).selectAll("svg").remove();
};

function setupsvg() {
    svg = d3.select("#globe")
            .append("svg:svg")
            .attr("class", "Blues")
            .attr("width", 700)
            .attr("height", 700)
            .on("mousedown", mousedown);
};
