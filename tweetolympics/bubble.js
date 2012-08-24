var r = 960,
    format = d3.format(",d"),
    fill = d3.scale.category20c();

var bubble = d3.layout.pack()
    .sort(null)
    .size([r, r]);

var vis = d3.select("#sports")
            .append("svg")
            .attr("width", r)
            .attr("height", r)
            .attr("class", "bubble");

d3.json("olympics.total.langs.json", function(json) {
  json.forEach(function(entry, i) {
      entry.value = +entry.value;
  });

  var nodes = bubble.nodes({children: json}).filter(function(d) { return !d.children; });
  var node = vis.selectAll("g.node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node.append("title")
      .text(function(d) { return d.key + ": " + format(d.value); });

  node.append("circle")
  .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return fill(d.key); });

  node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .text(function(d) { return d.key + "\n" + format(d.value); });
});
