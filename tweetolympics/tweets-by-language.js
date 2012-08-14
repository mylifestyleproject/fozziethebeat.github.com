var feature; 
var projection = d3.geo.azimuthal()
                       .scale(240)
                       .origin([-71.03,42.37])
                       .mode("orthographic")
                       .translate([350, 250]);

var circle = d3.geo.greatCircle()
                   .origin(projection.origin());

var scale = {
  orthographic: 240,
  stereographic: 240,
  gnomonic: 240,
  equidistant: 240/ Math.PI * 2,
  equalarea: 240 / Math.SQRT2
};

var path = d3.geo.path()
                 .projection(projection);

var fontSize = d3.scale.log().range([14, 26])
var logScale = d3.scale.log();

var scaleCount = function(x) { return Math.round(logScale(x)) + 1; };

var svg;
var worldCountries

d3.json("world-countries.json", function(collection) {
    worldCountries = collection;
    loadGlobe(activeLabel("sports"));
});

loadTagCloud(activeLabel("sports"));

function draw(words) {
    d3.select("#tagcloud")
      .append("svg")
      .attr("width", 300)
      .attr("height", 300)
      .append("g")
      .attr("transform", "translate(150,150)")
      .selectAll("text")
      .data(words)
      .enter()
      .append("text")
      .style("font-size", function(d) { return d.size +"px";})
      .attr("text-anchor", "middle")
      .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
      .text(function(d) { return d.text; });
};

function loadTagCloud(sport) {
    console.log("loading tag cloud for: " + sport);
    clearsvg("#tagCloud");
    var countFile = "olympics." + sport + ".tags.json";
    d3.json(countFile , function(tagcounts) {
        tagcounts.forEach(function (e, i) {
            e.value = +e.value;
        });

        d3.layout.cloud()
          .size([300, 300])
          .words(tagcounts)
          .text(function(d) { return d.key; })
          .font("Impact")
          .fontSize(function(d) { return fontSize(+d.value); })
          .on("end", draw)
          .start();
    });
};

function loadGlobe(sport) {
    console.log("loading globe for: " + sport);
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
    rotateGlobe([origin[0] + 2, origin[1]]);
}

setInterval(updateGlobe, 50);

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

d3.selectAll("#sports a").on("click", function (d) {
    var newSport = d3.select(this).attr("id");
    activate("sports", newSport);
    loadGlobe(activeLabel("sports"));
    loadTagCloud(activeLabel("sports"));
});

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
