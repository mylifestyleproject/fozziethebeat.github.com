var fontSize = d3.scale.log().range([16, 26])

d3.json("/tweetolympics/basketball.hashtag.count.json", function(tagcounts) {
    tagcounts.forEach(function (e, i) {
        e.value = +e.value;
    });
    tagcounts.sort(function (x,y) {
        return (y.value - x.value);
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
