/**
 * Parses the time string as the number of seconds from the start of the epoch
 * and transforms it into a Date object.
 */
function parseTime(t) {
    return new Date(parseInt(t)*1000);
}

// Various formatters.
var formatNumber = d3.format(",d"),
    formatChange = d3.format("+,d"),
    formatDate = d3.time.format("%B %d, %Y"),
    formatTime = d3.time.format("%I:%M %p");

function activate(group, link) {
    d3.selectAll("#" + group + " a").classed("active", false);
    d3.select("#" + group + " #" + link).classed("active", true);
};

// A nest operator using the group as a key.
var nestByGroup = d3.nest().key(function(d) { return d.group; });
var nestByDate = d3.nest().key(function(d) { return d3.time.day(d.startTime); });

function plotSportData(summaries, tweets) {

    d3.select("#summary-list").selectAll().remove();

    // Create the crossfilter for the relevant dimensions and groups.
    var tweet = crossfilter(tweets),
        all = tweet.groupAll(),
        date = tweet.dimension(function(d) { return d3.time.day(d.date); }),
        dates = date.group(),
        hour = tweet.dimension(function(d) { return d.date.getHours() + d.date.getMinutes() / 60; }),
        hours = hour.group(Math.floor),
        cluster = tweet.dimension(function(d) { return d.group; }),
        clusters = cluster.group();

    var charts = [

        // The first chart tracks the hours of each tweet.  It has the
        // standard 24 hour time range and uses a 24 hour clock.
        barChart().dimension(hour)
                  .group(hours)
                  .x(d3.scale.linear()
                             .domain([0, 24])
                             .rangeRound([0, 10 * 24])),

        // The second chart tracks the tweet clusters.  The upper limit is
        // dependent on the number of summaries, which equals the number of
        // clusters. 
        // NB: I'm not sure if a linear scale and the rangeRound stuff makes
        // sense.  This is currently just a hack that at least works.
        barChart().dimension(cluster)
                  .group(clusters)
                  .x(d3.scale.linear()
                             .domain([0, summaries.length+100])
                             .rangeRound([0, 10*30])),

        // The third chart tracks the dates of the tweets.  This ranges from
        // the start of the olympics until much further out.  The range setting
        // currently makes no sense to me since the display does not match the
        // range set.  Figuring this out is a TODO.
        barChart().dimension(date)
                  .group(dates)
                  .round(d3.time.day.round)
                  .x(d3.time.scale()
                            .domain([new Date(2012, 6, 26), new Date(2012, 8, 10)])
                            .rangeRound([0, 40 * 20]))
    ];

    // Given our array of charts, which we assume are in the same order as the
    // .chart elements in the DOM, bind the charts to the DOM and render them.
    // We also listen to the chart's brush events to update the display.
    var chart = d3.selectAll(".chart")
                  .data(charts)
                  .each(function(chart) { chart.on("brush", renderAll)
                                               .on("brushend", renderAll); });

    // Render the initial lists.
    var list = d3.selectAll(".list")
                 .data([summaryList]);

    // Print the total number of tweets.
    d3.selectAll("#total").text(formatNumber(all.value()));

    // Render everything..
    renderAll();

    window.filter = function(filters) {
        filters.forEach(function(d, i) { charts[i].filter(d); });
        renderAll();
    };

    window.reset = function(i) {
        charts[i].filter(null);
        renderAll();
    };

    function summaryList(div) {
        // Map each of the top clusters to their corresponding summaries.
        var clusterSummaries = clusters.top(40).map(function(d) {
            return summaries[d.key-1];
        });

        // Group the summaries by their date.
        var tweetsByGroup = nestByDate.entries(clusterSummaries);

        // For each day's summaries, add them as a table with the date as
        // the header.
        div.each(function() {
          var date = d3.select(this)
                       .selectAll(".date")
                       .data(tweetsByGroup, function(d) { return d.key; });

          date.enter()
              .append("div")
              .attr("class", "date")
              .append("div")
              .attr("class", "day")
              .text(function(d) { return formatDate(d.values[0].startTime); });

          date.exit().remove();

          var summary = date.order()
                            .selectAll(".summarylist")
                            .data(function(d) { return d.values; },
                                  function(d) { return d.index; });

          var summaryEnter = summary.enter()
                                    .append("div")
                                    .attr("class", "summarylist");

          summaryEnter.append("div")
                      .attr("class", "summary")
                      .text(function(d) { return d.Summary; });

          summary.exit().remove();

          summary.order();
        });
    }

    // Renders the specified chart or list.
    function render(method) {
        d3.select(this).call(method);
    }

    // Whenever the brush moves, re-rendering everything.
    function renderAll() {
        chart.each(render);
        list.each(render);
        d3.select("#active").text(formatNumber(all.value()));
    }
}

function activeLabel(controlGroup) {
    return d3.selectAll("#" + controlGroup).select(".active").attr("id");
}

function reloadData(sportName, methodName) {
    var filebase = "/tweetolympics/data/tweet." + sportName + "." + methodName + ".all.";
    var summaryList, tweetList, remaining = 2;
    d3.csv(filebase + "summary.csv", function(summaries) {
        summaries.forEach(function(d, i) {
           d.index = i;
           d.group = parseInt(d.Group);
           d.startTime = parseTime(d.Start);
           d.meanTime = parseTime(d.Mean);
        });
        summaryList = summaries;
        if (!--remaining)
            plotSportData(summaryList, tweetList);
    });

    d3.csv(filebase + "groups.csv", function(tweets) {
        tweets.forEach(function(d, i) {
            d.index = i;
            d.group = parseInt(d.Group);
            d.date = parseTime(d.Time);
        });
        tweetList = tweets;
        if (!--remaining)
            plotSportData(summaryList, tweetList);
    });
}

d3.selectAll("#sports a").on("click", function (d) {
    var newSport = d3.select(this).attr("id");
    activate("sports", newSport);
    reloadData(activeLabel("sports"), activeLabel("methods"));
});

d3.selectAll("#methods a").on("click", function (d) {
    var newMethod = d3.select(this).attr("id");
    activate("methods", newMethod);
    reloadData(activeLabel("sports"), activeLabel("methods"));
});

reloadData(activeLabel("sports"), activeLabel("methods"));
