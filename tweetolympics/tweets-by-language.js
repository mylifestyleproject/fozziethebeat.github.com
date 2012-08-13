var feature; 
var projection = d3.geo.azimuthal()
                       .scale(380)
                       .origin([-71.03,42.37])
                       .mode("orthographic")
                       .translate([640, 400]);

var circle = d3.geo.greatCircle()
                   .origin(projection.origin());

var scale = {
  orthographic: 380,
  stereographic: 380,
  gnomonic: 380,
  equidistant: 380 / Math.PI * 2,
  equalarea: 380 / Math.SQRT2
};

var path = d3.geo.path()
                 .projection(projection);

var quantize = d3.scale.log().domain([0, 15000000]).range(d3.range(8));
var logScale = d3.scale.log();

var scaleCount = function(x) { return Math.round(logScale(x)) + 1; };

var svg;
var worldCountries

d3.json("world-countries.json", function(collection) {
    worldCountries = collection;
    loadGlobe(activeLabel("sports"));
});

function loadGlobe(sport) {
    console.log("loading: " + sport);
    clearsvg();
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
    var m1 = [d3.event.pageX, d3.event.pageY],
        o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
    projection.origin(o1);
    circle.origin(o1)
    refresh();
  }
}

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
});

function activeLabel(controlGroup) {
    return d3.selectAll("#" + controlGroup).select(".active").attr("id");
};

function activate(group, link) {
    d3.selectAll("#" + group + " a").classed("active", false);
    d3.select("#" + group + " #" + link).classed("active", true);
};

function clearsvg() {
    d3.select("#globe").selectAll("svg").remove();
};

function setupsvg() {
    svg = d3.select("#globe")
            .append("svg:svg")
            .attr("class", "Blues")
            .attr("width", 1280)
            .attr("height", 800)
            .on("mousedown", mousedown);
};
